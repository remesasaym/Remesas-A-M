
// backend/index.js

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pino = require("pino");
const pinoHttp = require("pino-http");
const app = express();

const logger = pino({
  level: "info",
  timestamp: pino.stdTimeFunctions.isoTime,
});

const httpLogger = pinoHttp({
  logger,
});

app.use(httpLogger);

const PORT = process.env.PORT || 3001;
const ia = require("./ia/provider");
const { supabase } = require("./supabaseClient"); // Import Supabase client for backend

// Configuración de CORS mejorada
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174"
  ];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (como Postman, curl, mobile apps)
    if (!origin) return callback(null, true);

    // En producción, si ALLOWED_ORIGINS es '*', permitir todo (útil para pruebas iniciales)
    if (process.env.ALLOWED_ORIGINS === '*') return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn({ origin }, 'CORS request from unauthorized origin');
      // callback(new Error('Not allowed by CORS')); // Comentado temporalmente para evitar bloqueos en despliegue inicial si la config falla
      callback(null, true); // Permitir temporalmente para facilitar el despliegue
    }
  },
  credentials: true, // Permitir cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '50mb' })); // Para parsear el cuerpo de las solicitudes JSON con límite aumentado para imágenes

const { requireAuth } = require("./middleware/auth");
const { kycLimiter, uploadLimiter, remittanceLimiter } = require("./middleware/rateLimiter");
const remittanceRoutes = require("./routes/remittances");
const exchangeRoutes = require("./routes/exchange");
const kycRoutes = require("./routes/kyc");

app.use("/api/remittances", requireAuth, remittanceRoutes);
app.use("/api/exchange", exchangeRoutes);

// Endpoint público de KYC (solo lectura de status)
const express_router = require('express').Router();
const kyc_module = require("./routes/kyc");
app.get("/api/kyc/status/:userId", async (req, res, next) => {
  // Llamar directamente al handler sin autenticación
  const { supabase } = require('./supabaseClient');
  try {
    const { userId } = req.params;
    const { data, error } = await supabase
      .from('verification_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error getting KYC status:', error);
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.json({ status: 'not_started' });
    }

    res.json({
      status: data.status || 'pending',
      verificationId: data.id,
      documentUrl: data.id_document_url,
      selfieUrl: data.selfie_url,
      createdAt: data.created_at,
      country: data.country,
    });
  } catch (error) {
    console.error('❌ Error getting KYC status:', error);
    res.status(500).json({ error: error.message || 'Unknown error' });
  }
});

// Resto de endpoints KYC (requieren autenticación y rate limiting)
app.use("/api/kyc", requireAuth, kycLimiter, kycRoutes);
app.use("/api/upload", uploadLimiter, require("./routes/upload"));

app.post("/api/assistant", async (req, res) => {
  try {
    const { messages } = req.body;
    const r = await ia.assistantChat(Array.isArray(messages) ? messages : []);
    res.status(200).json(r);
  } catch (e) {
    res.status(500).json({ message: "Error en assistant" });
  }
});

app.post("/api/verify", async (req, res) => {
  try {
    const { idDocBase64, addressDocBase64, selfieBase64, country, addressText } = req.body;
    const r = await ia.identityVerify({ idDocBase64, addressDocBase64, selfieBase64, country, addressText });
    res.status(200).json(r);
  } catch (e) {
    res.status(500).json({ message: "Error en verificación" });
  }
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Backend de Remesas A&M corriendo en http://localhost:${PORT}`);
});

async function requireAdmin(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    console.log("Token recibido:", token); // <-- Añadido para depuración
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    const { data, error } = await supabase.auth.getUser(token);
    console.log("Usuario de Supabase:", data?.user); // <-- Añadido para depuración
    if (error || !data?.user) return res.status(401).json({ message: "Unauthorized" });
    const email = data.user.email || "";
    const uid = data.user.id || "";
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    const ADMIN_UID = process.env.ADMIN_UID;
    console.log("ADMIN_EMAIL (backend):", ADMIN_EMAIL); // <-- Añadido para depuración
    console.log("ADMIN_UID (backend):", ADMIN_UID); // <-- Añadido para depuración
    if (!ADMIN_EMAIL || !ADMIN_UID) {
      console.error("Admin credentials not set in environment variables.");
      return res.status(500).json({ message: "Server configuration error" });
    }
    if (email !== ADMIN_EMAIL && uid !== ADMIN_UID) return res.status(403).json({ message: "Forbidden" });
    req.user = data.user;
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

const adminRoutes = require("./routes/admin");
app.use("/api/admin", requireAdmin, adminRoutes);

app.get("/api/health/supabase", async (req, res) => {
  try {
    const { data, error } = await supabase.from("profiles").select("id").limit(1);
    if (error) return res.status(500).json({ ok: false, message: "DB error" });
    res.json({ ok: true, sample: data || [] });
  } catch {
    res.status(500).json({ ok: false });
  }
});

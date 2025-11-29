
const express = require("express");
const router = express.Router();
const { supabase } = require("../supabaseClient");
const logger = require("pino")();
const { decrypt } = require("../services/encryptionService");

// Ruta para obtener todas las transacciones (desencriptadas)
router.get("/transactions", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      logger.error({ error, adminId: req.user?.id }, "Error al obtener transacciones de Supabase");
      return res.status(500).json({ message: "Error al obtener transacciones" });
    }

    const decryptedData = data.map((tx) => ({
      ...tx,
      recipient_name: decrypt(tx.recipient_name),
      recipient_bank: decrypt(tx.recipient_bank),
      recipient_account: decrypt(tx.recipient_account),
      recipient_id: decrypt(tx.recipient_id),
    }));

    logger.info({ adminId: req.user?.id }, "Transacciones solicitadas por admin");
    res.status(200).json(decryptedData);
  } catch (error) {
    logger.error({ error, adminId: req.user?.id }, "Error en el endpoint /api/admin/transactions");
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// Ruta para obtener métricas generales
router.get("/metrics", async (req, res) => {
  try {
    const tx = await supabase.from("transactions").select("amount_sent");
    const users = await supabase.from("profiles").select("id");
    const ver = await supabase.from("verification_requests").select("id");
    const totalTransactions = Array.isArray(tx.data) ? tx.data.length : 0;
    const totalAmountSent = Array.isArray(tx.data) ? tx.data.reduce((s, r) => s + (Number(r.amount_sent) || 0), 0) : 0;
    const totalUsers = Array.isArray(users.data) ? users.data.length : 0;
    const totalVerifications = Array.isArray(ver.data) ? ver.data.length : 0;
    logger.info({ adminId: req.user?.id }, "Métricas solicitadas por admin");
    res.status(200).json({ totalTransactions, totalAmountSent, totalUsers, totalVerifications });
  } catch (error) {
    logger.error({ error, adminId: req.user?.id }, "Error al obtener métricas de admin");
    res.status(500).json({ message: "Error al obtener métricas" });
  }
});

// Ruta para obtener todos los usuarios (perfiles)
router.get("/users", async (req, res) => {
  try {
    const { data: profilesData, error } = await supabase.from("profiles").select("*");
    if (error) {
      logger.error({ error, adminId: req.user?.id }, "Error al obtener usuarios de Supabase");
      return res.status(500).json({ message: "Error al obtener usuarios" });
    }
    logger.info({ adminId: req.user?.id }, "Usuarios solicitados por admin");
    res.status(200).json(profilesData);
  } catch (error) {
    logger.error({ error, adminId: req.user?.id }, "Error al obtener usuarios de admin");
    res.status(500).json({ message: "Error al obtener usuarios" });
  }
});

// Ruta para actualizar un usuario (ej. is_verified)
router.put("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};
    const { error: updateError } = await supabase.from("profiles").update(updates).eq("id", id);

    if (updateError) {
      logger.error({ error: updateError, adminId: req.user?.id, userId: id }, "Error al actualizar usuario");
      return res.status(500).json({ message: "Error al actualizar usuario" });
    }
    logger.info({ adminId: req.user?.id, userId: id, updates }, "Usuario actualizado por admin");
    res.status(200).json({ message: "Usuario actualizado con éxito" });
  } catch (error) {
    logger.error({ error, adminId: req.user?.id, userId: req.params.id }, "Error en el endpoint /api/admin/users/:id");
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// Ruta para eliminar un usuario
router.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error: deleteError } = await supabase.from("profiles").delete().eq("id", id);

    if (deleteError) {
      logger.error({ error: deleteError, adminId: req.user?.id, userId: id }, "Error al eliminar usuario");
      return res.status(500).json({ message: "Error al eliminar usuario" });
    }
    logger.info({ adminId: req.user?.id, userId: id }, "Usuario eliminado por admin");
    res.status(200).json({ message: "Usuario eliminado con éxito" });
  } catch (error) {
    logger.error({ error, adminId: req.user?.id, userId: req.params.id }, "Error en el endpoint /api/admin/users/:id (delete)");
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// Ruta para obtener configuraciones
router.get("/settings", async (req, res) => {
  try {
    const { data: settingsData, error } = await supabase.from("settings").select("*");
    if (error) {
      logger.error({ error, adminId: req.user?.id }, "Error al obtener configuraciones de Supabase");
      return res.status(500).json({ message: "Error al obtener configuraciones" });
    }
    logger.info({ adminId: req.user?.id }, "Configuraciones solicitadas por admin");
    res.status(200).json(settingsData);
  } catch (error) {
    logger.error({ error, adminId: req.user?.id }, "Error al obtener configuraciones de admin");
    res.status(500).json({ message: "Error al obtener configuraciones" });
  }
});

// Ruta para guardar/actualizar configuraciones
router.put("/settings", async (req, res) => {
  try {
    const { key, value } = req.body;
    const payload = { key, value };
    const { error: upsertError } = await supabase.from("settings").upsert(payload, { onConflict: "key" });

    if (upsertError) {
      logger.error({ error: upsertError, adminId: req.user?.id, key: key }, "Error al guardar configuración");
      return res.status(500).json({ message: "Error al guardar configuración" });
    }
    logger.info({ adminId: req.user?.id, key: key, value }, "Configuración guardada por admin");
    res.status(200).json({ message: "Configuración guardada con éxito" });
  } catch (error) {
    logger.error({ error, adminId: req.user?.id, key: req.body.key }, "Error en el endpoint /api/admin/settings");
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// Ruta para obtener actividad (transacciones y verificaciones)
router.get("/activity", async (req, res) => {
  try {
    const tx = await supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(50);
    const ver = await supabase.from("verification_requests").select("*").order("created_at", { ascending: false }).limit(50);
    logger.info({ adminId: req.user?.id }, "Actividad solicitada por admin");
    res.status(200).json({ transactions: tx.data || [], verifications: ver.data || [] });
  } catch (error) {
    logger.error({ error, adminId: req.user?.id }, "Error al obtener actividad de admin");
    res.status(500).json({ message: "Error al obtener actividad" });
  }
});

module.exports = router;

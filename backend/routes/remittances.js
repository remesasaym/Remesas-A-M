const express = require("express");
const router = express.Router();
const { supabase } = require("../supabaseClient");
const logger = require("pino")();
const { encrypt, decrypt } = require("../services/encryptionService");
const { validateThunesWebhook } = require("../middleware/webhookValidator");
const { sendRemittanceUpdateEmail } = require('../services/notificationService');

// Endpoint para enviar una nueva remesa
router.post("/send", async (req, res) => {
  const {
    userId,
    amountSent,
    currencySent,
    amountReceived,
    currencyReceived,
    fee,
    fromCountryCode,
    toCountryCode,
    recipientName,
    recipientBank,
    recipientAccount,
    recipientId,
    receiptUrl
  } = req.body;

  if (!userId || !amountSent || !currencySent || !amountReceived || !currencyReceived || !fee || !fromCountryCode || !toCountryCode || !recipientName || !recipientBank || !recipientId || !recipientAccount) {
    logger.warn({ userId, amountSent, currencySent, fromCountryCode, toCountryCode }, "Faltan campos requeridos para la remesa.");
    return res.status(400).json({ message: "Faltan campos requeridos para la remesa." });
  }

  // Validaciones de negocio
  if (parseFloat(amountSent) <= 0 || parseFloat(amountReceived) <= 0) {
    logger.warn({ userId, amountSent, amountReceived }, "Intento de remesa con montos negativos o cero.");
    return res.status(400).json({ message: "Los montos deben ser mayores a 0." });
  }

  if (parseFloat(fee) < 0) {
    logger.warn({ userId, fee }, "Intento de remesa con comisión negativa.");
    return res.status(400).json({ message: "La comisión no puede ser negativa." });
  }

  if (parseFloat(amountSent) < 10) { // Regla de negocio: Mínimo $10
    logger.warn({ userId, amountSent }, "Intento de remesa menor al mínimo ($10).");
    return res.status(400).json({ message: "El monto mínimo de envío es $10." });
  }

  // VERIFICACIÓN DE SEGURIDAD: El usuario debe estar verificado (KYC)
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_verified')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      logger.error({ userId, profileError }, "Error al verificar estado del usuario");
      return res.status(500).json({ message: "Error al validar estado del usuario." });
    }

    if (!profile.is_verified) {
      logger.warn({ userId }, "Intento de remesa de usuario NO verificado.");
      return res.status(403).json({
        message: "Tu cuenta debe estar verificada para enviar dinero.",
        code: "USER_NOT_VERIFIED"
      });
    }
  } catch (err) {
    logger.error({ err }, "Excepción al verificar perfil de usuario");
    return res.status(500).json({ message: "Error interno de validación." });
  }

  try {
    // Simular procesamiento (ej. validación, comunicación con un banco real, etc.)
    await new Promise(resolve => setTimeout(resolve, 1500)); // Retardo de 1.5 segundos

    const transactionId = `AYM${Date.now()}`; // Generar un ID de transacción
    const newTransaction = {
      user_id: userId,
      transaction_id: transactionId,
      amount_sent: parseFloat(amountSent) || 0,
      currency_sent: currencySent,
      amount_received: parseFloat(amountReceived) || 0,
      currency_received: currencyReceived,
      fee: parseFloat(fee) || 0,
      from_country_code: fromCountryCode,
      to_country_code: toCountryCode,
      recipient_name: encrypt(recipientName),
      recipient_bank: encrypt(recipientBank),
      recipient_account: encrypt(recipientAccount),
      recipient_id: encrypt(recipientId),
      receipt_url: receiptUrl || null,
      status: "PENDIENTE"
      // created_at se genera automáticamente en la base de datos
    };

    const { data, error } = await supabase.from("transactions").insert([newTransaction]);

    if (error) {
      logger.error({ error, userId }, "Error al guardar la transacción en Supabase");
      console.error("Supabase error details:", error);
      return res.status(500).json({ message: "Error interno del servidor al guardar la transacción.", error: error.message });
    }

    logger.info({ userId, transactionId, status: newTransaction.status }, "Nueva remesa creada");

    // Enviar notificación de creación
    // Obtenemos email del usuario
    supabase.from('profiles').select('email, full_name').eq('id', userId).single()
      .then(({ data: user }) => {
        if (user) {
          sendRemittanceUpdateEmail(user, newTransaction).catch(err => logger.error({ err }, "Error enviando email de remesa creada"));
        }
      });

    res.status(200).json({
      message: "Remesa procesada con éxito.",
      transaction_id: transactionId,
      status: newTransaction.status
    });

  } catch (error) {
    logger.error({ error: error.message, stack: error.stack, userId }, "Error en el endpoint /api/remittances/send");
    console.error("Full error details:", error);
    res.status(500).json({ message: "Error interno del servidor.", error: error.message });
  }
});

// Endpoint para obtener el historial de transacciones de un usuario
router.get("/history", async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    logger.warn({ userId: req.user?.id || "unknown" }, "Se requiere el ID del usuario para el historial.");
    return res.status(400).json({ message: "Se requiere el ID del usuario." });
  }

  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error({ error, userId }, "Error al obtener el historial de transacciones de Supabase");
      return res.status(500).json({ message: "Error interno del servidor al obtener el historial." });
    }

    const decryptedData = data.map((tx) => ({
      ...tx,
      recipient_name: decrypt(tx.recipient_name),
      recipient_bank: decrypt(tx.recipient_bank),
      recipient_account: decrypt(tx.recipient_account),
      recipient_id: decrypt(tx.recipient_id),
    }));

    logger.info({ userId }, "Historial de transacciones solicitado");
    res.status(200).json(decryptedData);

  } catch (error) {
    logger.error({ error, userId }, "Error en el endpoint /api/remittances/history");
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

// Webhook endpoint to update transaction status
router.post("/webhook", validateThunesWebhook, async (req, res) => {
  const { transaction_id, status } = req.body;

  if (!transaction_id || !status) {
    logger.warn({ transaction_id, status }, "Faltan campos requeridos para el webhook de estado.");
    return res.status(400).json({ message: "Transaction ID and status are required." });
  }

  const validStatuses = ["PROCESANDO", "COMPLETADO", "FALLIDO"];
  if (!validStatuses.includes(status)) {
    logger.warn({ transaction_id, status }, "Estado inválido proporcionado para el webhook.");
    return res.status(400).json({ message: "Invalid status provided." });
  }

  try {
    const { data, error } = await supabase
      .from("transactions")
      .update({ status: status, processed_at: new Date().toISOString() })
      .eq("transaction_id", transaction_id)
      .select();

    if (error) {
      logger.error({ error, transaction_id, status }, "Error actualizando el estado de la transacción");
      return res.status(500).json({ message: "Failed to update transaction status." });
    }

    if (!data || data.length === 0) {
      logger.warn({ transaction_id }, "Transacción no encontrada para actualizar estado");
      return res.status(404).json({ message: "Transaction not found." });
    }

    // Notificar actualización
    const transaction = data[0];
    supabase.from('profiles').select('email, full_name').eq('id', transaction.user_id).single()
      .then(({ data: user }) => {
        if (user) {
          sendRemittanceUpdateEmail(user, transaction).catch(err => logger.error({ err }, "Error enviando email de actualización"));
        }
      });

    logger.info({ transaction_id, status }, "Estado de transacción actualizado vía webhook");
    res.status(200).json({ message: "Transaction status updated successfully." });

  } catch (error) {
    logger.error({ error, transaction_id }, "Error en el endpoint webhook de remesas");
    res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;

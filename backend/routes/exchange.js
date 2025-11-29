
const express = require("express");
const router = express.Router();
const { getExchangeRates } = require("../services/exchangeRateService");
const logger = require("pino")();

router.get("/rates", async (req, res) => {
  try {
    const rates = await getExchangeRates();
    logger.info("Tasas de cambio solicitadas");
    res.status(200).json(rates);
  } catch (error) {
    logger.error({ error }, "Error al obtener tasas de cambio");
    res.status(500).json({ message: "Error al obtener tasas de cambio" });
  }
});

module.exports = router;

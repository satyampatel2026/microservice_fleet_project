const db = require("../model/db");

async function readCommission(res, missingStatus, missingMessage) {
  try {
    const [rows] = await db.query("SELECT commission_percent FROM finance_settings WHERE id = 1");
    if (!rows.length) return res.status(missingStatus).json({ message: missingMessage });
    return res.json({ commissionPercent: Number(rows[0].commission_percent) });
  } catch (error) {
    console.error("Read commission:", error.message);
    return res.status(500).json({ message: "Unable to read commission" });
  }
}

function getCommission(req, res) {
  return readCommission(res, 404, "Commission setting is missing");
}

function getInternalCommission(req, res) {
  return readCommission(res, 503, "Commission is not configured");
}

async function saveCommission(req, res) {
  const percent = req.body?.commissionPercent;

  if (
    typeof percent !== "number" ||
    !/^\d{1,3}(\.\d{1,2})?$/.test(String(percent)) ||
    percent > 100
  ) {
    return res.status(400).json({
      message: "Commission must be a number from 0 to 100 with up to two decimals",
    });
  }

  try {
    await db.execute(
      `INSERT INTO finance_settings (id, commission_percent)
       VALUES (1, ?)
       ON DUPLICATE KEY UPDATE commission_percent = ?`,
      [percent, percent]
    );

    res.json({ commissionPercent: percent });
  } catch (error) {
    console.error("Save commission failed", error);
    res.status(500).json({ message: "Unable to save commission" });
  }
}
module.exports = { getCommission, saveCommission, getInternalCommission };

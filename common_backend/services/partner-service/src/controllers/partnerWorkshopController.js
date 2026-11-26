const db = require("../model/db");

async function getWorkshopDetails(req, res) {
  const partnerId = Number(req.params.partnerId);

  if (!Number.isSafeInteger(partnerId) || partnerId <= 0) {
    return res.status(400).json({ message: "Invalid partner ID" });
  }

  try {
    const [rows]= await db.execute(
      `SELECT k.business_name AS businessName,
              k.business_address AS businessAddress
       FROM partner_kyc k
       JOIN partners p ON p.partner_id = k.partner_id
       WHERE k.partner_id = ?
         AND k.kyc_status = 'verified'
         AND p.status = 'active'
       LIMIT 1`,
      [partnerId]
    );
    const workshop = rows[0];

    if (!workshop?.businessName || !workshop?.businessAddress) {
      return res.status(404).json({ message: "Workshop details are unavailable" });
    }

    return res.json({ success: true, workshop });
  } catch (error) {
    console.error("Load workshop details:", error.message);
    return res.status(500).json({ message: "Unable to load workshop details" });
  }
}

module.exports = { getWorkshopDetails };
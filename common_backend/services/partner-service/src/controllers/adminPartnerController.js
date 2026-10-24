const connection = require("../model/db");

// ================= GET ALL PARTNERS =================

const getPartners = async (req, res) => {
  const search =
    typeof req.query.search === "string"
      ? req.query.search.trim()
      : "";

  const status = req.query.status || "";
  let page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);

  // Galat page, limit ya status reject karo
  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > 100 ||
    search.length > 100 ||
    !["", "active", "inactive"].includes(status)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid search, status or page",
    });
  }

  // WHERE 1=1 hamesha true hai.
  // Iske baad zaroorat ke hisaab se AND conditions jodenge.
  let where = "WHERE 1=1";
  const values = [];

  if (search) {
    where += ` AND (
      p.partner_name LIKE ? ESCAPE '!'
      OR p.email LIKE ? ESCAPE '!'
      OR p.mobile LIKE ? ESCAPE '!'
    )`;

    const text = `%${search.replace(/[!%_]/g, "!$&")}%`;
    values.push(text, text, text);
  }

  if (status) {
    where += " AND p.status = ?";
    values.push(status);
  }

  try {
    // 1. Matching partners kitne hain?
    const [counts] = await connection.query(
      `SELECT COUNT(*) AS total
       FROM partners p
       ${where}`,
      values
    );

    const total = Number(counts[0].total);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    // Last available page se aage nahi jaana
    page = Math.min(page, totalPages);

    const offset = (page - 1) * limit;

    // 2. Current page ke partners laao.
    // Har partner ki latest KYC row li hai, taaki duplicate rows na aayein.
    const [partners] = await connection.query(
      `SELECT
         p.partner_id,
         p.partner_name,
         p.email,
         p.mobile,
         p.status,
         p.created_at,
         k.kyc_id,
         k.kyc_status
       FROM partners p
       LEFT JOIN partner_kyc k
         ON k.kyc_id = (
           SELECT MAX(kyc_id)
           FROM partner_kyc
           WHERE partner_id = p.partner_id
         )
       ${where}
       ORDER BY p.created_at DESC, p.partner_id DESC
       LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );

    // 3. Sirf is page ke partners ki services laao
    let partnerServices = [];

    if (partners.length > 0) {
      const partnerIds = partners.map(
        (partner) => partner.partner_id
      );

      const [services] = await connection.query(
        `SELECT partner_id, service_id
         FROM partner_services
         WHERE partner_id IN (?)`,
        [partnerIds]
      );

      partnerServices = services;
    }

    // Har partner ke saath uski service IDs jodo
    for (const partner of partners) {
      partner.service_ids = [];

      for (const service of partnerServices) {
        if (service.partner_id === partner.partner_id) {
          partner.service_ids.push(service.service_id);
        }
      }
    }

    return res.status(200).json({
      success: true,
      data: partners,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Get Partners Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch partners",
    });
  }
};

// ================= UPDATE PARTNER STATUS =================

const updatePartnerStatus = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const { status } = req.body;


    // Validate status
    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid partner status",
      });
    }


    // Check partner exists
    const [partners] = await connection.query(
      `
      SELECT
        partner_id,
        partner_name,
        status
      FROM partners
      WHERE partner_id = ?
      LIMIT 1
      `,
      [partnerId]
    );


    if (partners.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }


    // Update status
    await connection.query(
      `
      UPDATE partners
      SET status = ?
      WHERE partner_id = ?
      `,
      [status, partnerId]
    );


    // Get updated partner
    const [updatedPartner] = await connection.query(
      `
      SELECT
        partner_id,
        partner_name,
        email,
        mobile,
        status,
        created_at
      FROM partners
      WHERE partner_id = ?
      LIMIT 1
      `,
      [partnerId]
    );


    return res.status(200).json({
      success: true,

      message:
        status === "active"
          ? "Partner activated successfully"
          : "Partner deactivated successfully",

      data: updatedPartner[0],
    });

  } catch (error) {
    console.error(
      "Update Partner Status Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update partner status",
    });
  }
};

// ================= TOTAL PARTNERS =================

const getTotalPartners = async (req, res) => {
  try {
    const [result] = await connection.query(`
      SELECT COUNT(*) AS total_partners
      FROM partners
    `);

    return res.status(200).json({
      success: true,
      data: {
        total_partners: result[0].total_partners,
      },
    });

  } catch (error) {
    console.error("Total Partners Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch total partners",
    });
  }
};

module.exports = {
  getPartners,
  updatePartnerStatus,getTotalPartners
};
const db = require("../model/db");
const clientTerms = require("../config/clientTerms");

const createClient = async (req, res) => {
  const {
    name,
    email,
    mobile,
    termsAccepted,
    termsVersion,registrationToken,
  } = req.body || {};

  // Profile details validate karo
  if (
    typeof name !== "string" ||
    name.trim().length < 3 ||
    name.trim().length > 100
  ) {
    return res.status(400).json({
      success: false,
      message: "Name must contain 3 to 100 characters",
    });
  }

  if (
    typeof email !== "string" ||
    email.trim().length > 100 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    return res.status(400).json({
      success: false,
      message: "Valid email is required",
    });
  }

  if (
    typeof mobile !== "string" ||
    !/^[6-9][0-9]{9}$/.test(mobile)
  ) {
    return res.status(400).json({
      success: false,
      message: "Valid 10-digit mobile number is required",
    });
  }

  // Backend mein final terms available honi chahiye
  if (!clientTerms.content.trim()) {
    return res.status(503).json({
      success: false,
      message: "Terms and Conditions are not configured",
    });
  }

  // Client ne displayed version accept ki honi chahiye
  if (termsAccepted !== true) {
    return res.status(400).json({
      success: false,
      message: "Please accept Terms and Conditions",
    });
  }

  if (termsVersion !== clientTerms.version) {
    return res.status(409).json({
      success: false,
      message: "Terms have changed. Please read and accept them again",
    });
  }
   if (
  typeof registrationToken !== "string" ||
  !/^[a-f0-9]{64}$/.test(registrationToken)
) {
  return res.status(400).json({
    success: false,
    message: "Valid registration token is required",
  });
}
  let profileConnection;
  try {
    const [existing] = await db.query(
  `SELECT client_id, name, email, mobile, status, terms_version
   FROM clients
   WHERE registration_token = ?
   LIMIT 1`,
  [registrationToken]
);

if (existing.length > 0) {
  const client = existing[0];

  // Same token ke saath alag details accept nahi karni
  if (
    client.email !== email.trim().toLowerCase() ||
    client.mobile !== mobile ||
    client.name !== name.trim() ||
    client.terms_version !== termsVersion
  ) {
    return res.status(409).json({
      success: false,
      message: "Registration token does not match these details",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Client profile already created",
    data: {
      client_id: client.client_id,
      status: client.status,
    },
  });
}
    profileConnection = await db.getConnection();
    await profileConnection.beginTransaction();
    const [result] = await profileConnection.query(
      `INSERT INTO clients
       (
         name, email, mobile,
         terms_accepted, terms_version,
         terms_content, terms_accepted_at, registration_token
       )
       VALUES (?, ?, ?, 1, ?, ?, UTC_TIMESTAMP(), ?)`,
      [
        name.trim(),
        email.trim().toLowerCase(),
        mobile,
        clientTerms.version,
        clientTerms.content,registrationToken,
      ]
    );

    const clientCode = `FR-C-${String(result.insertId).padStart(4, "0")}`;
    await profileConnection.query("UPDATE clients SET client_code = ? WHERE client_id = ?", [clientCode, result.insertId]);
    await profileConnection.commit();

    return res.status(201).json({
      success: true,
      message: "Client profile created",
      data: {
        client_id: result.insertId,
        client_code: clientCode,
        status: "inactive",
      },
    });
  } catch (error) {
    if (profileConnection) await profileConnection.rollback().catch(() => {});
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Email or mobile already registered",
      });
    }

    console.error("Create client error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to create client profile",
    });
  } finally {
    if (profileConnection) profileConnection.release();
  }
};

// Client profile dekhna
const getClientProfile = async (req, res) => {
  const clientId = Number(req.params.clientId);

  if (!Number.isSafeInteger(clientId) || clientId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid client ID",
    });
  }

  try {
    const [clients] = await db.query(
      `SELECT client_id, name, email, mobile, status
       FROM clients
       WHERE client_id = ?
       LIMIT 1`,
      [clientId]
    );

    if (clients.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: clients[0],
    });
  } catch (error) {
    console.error("Get client error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch client profile",
    });
  }
};

// Client profile activate karna
const activateClient = async (req, res) => {
  const clientId = Number(req.params.clientId);
  const { email } = req.body || {};

  if (
    !Number.isSafeInteger(clientId) ||
    clientId <= 0 ||
    typeof email !== "string" ||
    !email.trim()
  ) {
    return res.status(400).json({
      success: false,
      message: "Valid client ID and email are required",
    });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();

    // ID aur email dono se correct profile check karo
    const [clients] = await db.query(
      `SELECT client_id, status
       FROM clients
       WHERE client_id = ? AND email = ?
       LIMIT 1`,
      [clientId, normalizedEmail]
    );

    if (clients.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    // Already active ho to bhi success return hoga
    if (clients[0].status !== "active") {
      await db.query(
        `UPDATE clients
         SET status = 'active'
         WHERE client_id = ? AND email = ?`,
        [clientId, normalizedEmail]
      );
    }

    return res.status(200).json({
      success: true,
      message: "Client profile activated",
    });
  } catch (error) {
    console.error("Activate client error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to activate client",
    });
  }
};

const getClients = async (req, res) => {
  const search =
    typeof req.query.search === "string"
      ? req.query.search.trim()
      : "";

  const status = req.query.status || "";
  const sort = req.query.sort || "";
  const businessStatus = req.query.businessStatus || "";
  const vehicleApproval = req.query.vehicleApproval || "";
  let page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);

  if (
    search.length > 100 ||
    !["", "pending", "verified", "rejected"].includes(businessStatus) ||
    !["", "pending", "verified", "rejected"].includes(vehicleApproval) ||
    !["", "asc", "desc"].includes(sort) ||
    !["", "active", "inactive"].includes(status) ||
    !Number.isSafeInteger(page) ||
    page < 1 ||
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid search or pagination",
    });
  }

  // Raw query input ko SQL mein nahi lagana; sirf fixed order strings.
  let orderBy = "client_id DESC";
  if (sort === "asc") orderBy = "name ASC, client_id ASC";
  if (sort === "desc") orderBy = "name DESC, client_id DESC";

  let where = "WHERE 1=1";
  const values = [];

  // Name, email, mobile aur saved client code mein search
  if (search) {
    const text = `%${search.replace(/[!%_]/g, "!$&")}%`;

    where += ` AND (
      name LIKE ? ESCAPE '!'
      OR email LIKE ? ESCAPE '!'
      OR mobile LIKE ? ESCAPE '!'
      OR client_code LIKE ? ESCAPE '!'
    )`;

    values.push(text, text, text, text);
  }

  if (status) {
    where += " AND status = ?";
    values.push(status);
  }

  if (businessStatus) {
    where += " AND business_verification_status = ?";
    values.push(businessStatus);
  }

  // Sirf woh clients jinke paas selected approval status ki vehicle hai.
  if (vehicleApproval) {
    where += ` AND EXISTS (
      SELECT 1 FROM vehicles v
      WHERE v.client_id = clients.client_id AND v.approval_status = ?
    )`;
    values.push(vehicleApproval);
  }

  try {
    // Matching clients ki ginti
    const [counts] = await db.query(
      `SELECT COUNT(*) AS total
       FROM clients
       ${where}`,
      values
    );

    const total = Number(counts[0].total);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    page = Math.min(page, totalPages);

    const offset = (page - 1) * limit;

    // Sirf current page ke records
    const [clients] = await db.query(
      `SELECT client_id, client_code, name, email, mobile, photo_url, status, created_at,
         company_name, business_verification_status,
         (SELECT COUNT(*) FROM vehicles v WHERE v.client_id = clients.client_id) AS vehicle_count,
         (SELECT COUNT(*) FROM vehicles v WHERE v.client_id = clients.client_id AND v.approval_status = 'pending') AS pending_vehicle_count
       FROM clients
       ${where}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );

    // Cards ki ginti poore database ki hai; search/status/page se nahi badlegi.
    const [stats] = await db.query(`
      SELECT COUNT(*) AS total,
        COALESCE(SUM(status = 'active'), 0) AS active,
        COALESCE(SUM(status = 'inactive'), 0) AS inactive,
        COALESCE(SUM(business_verification_status = 'pending'), 0) AS pending_clients
      FROM clients
    `);

    // Pending vehicles ka total, sirf current table page ka count nahi.
    const [vehicleStats] = await db.query(
      "SELECT COUNT(*) AS pending_vehicles FROM vehicles WHERE approval_status = 'pending'"
    );

    return res.status(200).json({
      success: true,
      data: clients,
      stats: {
        total: Number(stats[0].total),
        active: Number(stats[0].active),
        inactive: Number(stats[0].inactive),
        pending_clients: Number(stats[0].pending_clients),
        pending_vehicles: Number(vehicleStats[0].pending_vehicles),
      },
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Get clients error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch clients",
    });
  }
};

const getClientDetails = async (req, res) => {
  const clientId = Number(req.params.clientId);

  if (!Number.isSafeInteger(clientId) || clientId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid client ID",
    });
  }

  try {
    const [clients] = await db.query(
      `SELECT
         client_id, client_code, name, email, mobile, photo_url, personal_address, gender, status, created_at,
         company_name, business_type, gstin, pan_number, aadhaar_last4,
         business_verification_status, business_rejection_reason, business_reviewed_at,
         terms_accepted, terms_version,
         terms_content, terms_accepted_at
       FROM clients
       WHERE client_id = ?
       LIMIT 1`,
      [clientId]
    );

    if (clients.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: clients[0],
    });
  } catch (error) {
    console.error("Client details error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch client details",
    });
  }
};

const updateClientStatus = async (req, res) => {
  const clientId = Number(req.params.clientId);
  const { status, email } = req.body || {};

  if (!Number.isSafeInteger(clientId) || clientId <= 0 ||
      !["active", "inactive"].includes(status) ||
      typeof email !== "string" || !email.trim()) {
    return res.status(400).json({ success: false, message: "Invalid client status details" });
  }

  try {
    const [clients] = await db.query(
      "SELECT client_id FROM clients WHERE client_id = ? AND email = ? LIMIT 1",
      [clientId, email.trim().toLowerCase()]
    );

    if (clients.length === 0) {
      return res.status(404).json({ success: false, message: "Client profile not found" });
    }

    await db.query("UPDATE clients SET status = ? WHERE client_id = ?", [status, clientId]);
    return res.status(200).json({ success: true, message: "Client profile status updated" });
  } catch (error) {
    console.error("Client profile status error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to update client profile status" });
  }
};

module.exports = { createClient,getClientProfile,activateClient,getClients,getClientDetails,updateClientStatus };
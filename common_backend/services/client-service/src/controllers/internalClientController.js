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
    const [result] = await db.query(
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

    return res.status(201).json({
      success: true,
      message: "Client profile created",
      data: {
        client_id: result.insertId,
        status: "inactive",
      },
    });
  } catch (error) {
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

module.exports = { createClient,getClientProfile,activateClient };
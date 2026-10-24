const authDb = require("../model/authDb");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const axios = require("axios");

const CLIENT_SERVICE_URL =
  process.env.CLIENT_SERVICE_URL || "http://localhost:5004";

const registerClient = async (req, res) => {
  const {
    name,
    email,
    mobile,
    password,
    termsAccepted,
    termsVersion,
  } = req.body || {};

  // 1. Details check karo
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
      message: "Valid 10-digit mobile is required",
    });
  }

  if (
    typeof password !== "string" ||
    password.length < 8 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return res.status(400).json({
      success: false,
      message: "Password must have at least 8 characters and at most 72 bytes",
    });
  }

  if (
    termsAccepted !== true ||
    typeof termsVersion !== "string" ||
    !termsVersion.trim()
  ) {
    return res.status(400).json({
      success: false,
      message: "Please accept Terms and Conditions",
    });
  }

  if (!process.env.INTERNAL_SERVICE_KEY) {
    return res.status(500).json({
      success: false,
      message: "Internal service key is not configured",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Har internal request ke saath ye settings bhejenge
  const options = {
    headers: {
      "x-internal-service-key": process.env.INTERNAL_SERVICE_KEY,
    },
    timeout: 5000,
  };

  try {
    // 2. Existing login account check karo
    const [accounts] = await authDb.query(
      `SELECT client_id, password_hash, status
       FROM client_accounts
       WHERE email = ?
       LIMIT 1`,
      [normalizedEmail]
    );

    let clientId;

    if (accounts.length > 0) {
      const account = accounts[0];

      if (account.status === "active") {
        return res.status(409).json({
          success: false,
          message: "Email already registered. Please login",
        });
      }

      // Incomplete registration ko sirf same password se resume karo
      const passwordMatches = await bcrypt.compare(
        password,
        account.password_hash
      );

      if (!passwordMatches) {
        return res.status(409).json({
          success: false,
          message: "Unable to resume registration with these details",
        });
      }

      const profileResponse = await axios.get(
        `${CLIENT_SERVICE_URL}/internal/clients/${account.client_id}/profile`,
        options
      );

      const profile = profileResponse.data.data;

      if (
        profileResponse.data.success !== true ||
        profile?.email !== normalizedEmail ||
        profile?.name !== name.trim() ||
        profile?.mobile !== mobile
      ) {
        return res.status(409).json({
          success: false,
          message: "Details do not match the incomplete registration",
        });
      }

      clientId = account.client_id;
    } else {
      // 3. Nayi registration ki pehchaan
      const registrationToken = crypto.randomBytes(32).toString("hex");

      const profileData = {
        name: name.trim(),
        email: normalizedEmail,
        mobile,
        termsAccepted,
        termsVersion,
        registrationToken,
      };

      let profileResponse;

      try {
        profileResponse = await axios.post(
          `${CLIENT_SERVICE_URL}/internal/clients`,
          profileData,
          options
        );
      } catch (error) {
        // Server ka response mila, to wahi error handle karo.
        // Response nahi mila, to same token se ek baar retry karo.
        if (error.response) throw error;

        profileResponse = await axios.post(
          `${CLIENT_SERVICE_URL}/internal/clients`,
          profileData,
          options
        );
      }

      clientId = profileResponse.data?.data?.client_id;

      if (
        profileResponse.data.success !== true ||
        !Number.isSafeInteger(clientId) ||
        clientId <= 0
      ) {
        throw new Error("Invalid client profile response");
      }

      // 4. Password hash karke inactive login account save karo
      const passwordHash = await bcrypt.hash(password, 10);

      await authDb.query(
        `INSERT INTO client_accounts
         (client_id, email, password_hash, status)
         VALUES (?, ?, ?, 'inactive')`,
        [clientId, normalizedEmail, passwordHash]
      );
    }

    // 5. Client Service ki profile activate karo
    const activationResponse = await axios.patch(
      `${CLIENT_SERVICE_URL}/internal/clients/${clientId}/activate`,
      { email: normalizedEmail },
      options
    );

    if (activationResponse.data.success !== true) {
      throw new Error("Client activation failed");
    }

    // 6. Login account bhi activate karo
    await authDb.query(
      `UPDATE client_accounts
       SET status = 'active'
       WHERE client_id = ? AND email = ?`,
      [clientId, normalizedEmail]
    );

    return res.status(201).json({
      success: true,
      message: "Client registered successfully",
      data: {
        client_id: clientId,
      },
    });
  } catch (error) {
    console.error("Client registration error:", error.message);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Account already exists. Please login or retry registration",
      });
    }

    if (
      error.response &&
      [400, 409, 503].includes(error.response.status)
    ) {
      return res.status(error.response.status).json({
        success: false,
        message:
          error.response.data?.message || "Client registration failed",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Registration could not be completed",
    });
  }
};

module.exports = { registerClient };
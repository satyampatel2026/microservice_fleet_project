const authDb = require("../model/authDb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const CLIENT_SERVICE_URL =
  process.env.CLIENT_SERVICE_URL || "http://localhost:5004";

const loginClient = async (req, res) => {
  const { email, password } = req.body || {};

  if (
    typeof email !== "string" ||
    !email.trim() ||
    typeof password !== "string" ||
    !password
  ) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  try {
    // 1. Login account dhoondo
    const [accounts] = await authDb.query(
      `SELECT client_id, email, password_hash, status
       FROM client_accounts
       WHERE email = ?
       LIMIT 1`,
      [email.trim().toLowerCase()]
    );

    if (accounts.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const account = accounts[0];

    // 2. Password check karo
    const passwordMatches = await bcrypt.compare(
      password,
      account.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (account.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Client account is inactive",
      });
    }

    // 3. Client Service se profile lo
    const response = await axios.get(
      `${CLIENT_SERVICE_URL}/internal/clients/${account.client_id}/profile`,
      {
        headers: {
          "x-internal-service-key": process.env.INTERNAL_SERVICE_KEY,
        },
        timeout: 5000,
      }
    );

    const client = response.data?.data;

    if (
      response.data?.success !== true ||
      client?.client_id !== account.client_id ||
      client?.email !== account.email ||
      client?.status !== "active"
    ) {
      return res.status(403).json({
        success: false,
        message: "Client profile is inactive or inconsistent",
      });
    }

    // 4. Login token banao
    const token = jwt.sign(
      {
        id: client.client_id,
        email: client.email,
        type: "client",
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // 5. Token cookie mein bhejo
    res.cookie("client_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Client login successful",
      client: {
        id: client.client_id,
        name: client.name,
        email: client.email,
        mobile: client.mobile,
      },
    });
  } catch (error) {
    console.error("Client login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Client login failed",
    });
  }
};

module.exports = { loginClient };
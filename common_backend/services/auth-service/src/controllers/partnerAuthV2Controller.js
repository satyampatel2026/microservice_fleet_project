const authDb = require("../model/authDb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const loginPartnerV2 = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Step 1: Credentials auth_db se check karo
    const [accounts] = await authDb.query(
       `SELECT partner_id AS account_id, email, password_hash, status
       FROM partner_accounts
       WHERE email = ?
       LIMIT 1`,
      [email]
    );

    if (accounts.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const account = accounts[0];

    if (account.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Partner account is inactive",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      account.password_hash
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Step 2: Partner Service se current profile lo
    const partnerResponse = await axios.get(
      `http://localhost:5003/internal/partners/${account.account_id}/profile`,
      {
        headers: {
          "x-internal-service-key":
            process.env.INTERNAL_SERVICE_KEY,
        },
        timeout: 5000,
      }
    );

    const partner = partnerResponse.data.data;
    

    if (
      partner.status !== "active" ||
      partner.email !== account.email
    ) {
      return res.status(403).json({
        success: false,
        message: "Partner account is inactive or inconsistent",
      });
    }

    // Step 3: Existing JWT format maintain karo
    const token = jwt.sign(
      {
        id: partner.partner_id,
        email: partner.email,
        type: "partner",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.cookie("partner_token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      partner: {
        id: partner.partner_id,
        partner_name: partner.partner_name,
        email: partner.email,
        mobile: partner.mobile,
      },
    });
  } catch (error) {
    console.error("Partner Login V2 Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Partner login failed",
    });
  }
};

module.exports = { loginPartnerV2 };
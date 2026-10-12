const authDb = require("../model/authDb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const loginUserV2 = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email aur password required hai",
    });
  }

  try {
    // STEP 1: Credentials Auth Database se fetch karo
    const [accounts] = await authDb.query(
      `SELECT account_id, password_hash, status
       FROM auth_accounts
       WHERE account_type = 'admin' AND email = ?`,
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
        message: "User account is inactive",
      });
    }

    // STEP 2: Password verify karo
    const passwordMatch = await bcrypt.compare(
      password,
      account.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // STEP 3: Admin Service se authorization check karo
    const response = await fetch(
      `http://localhost:5002/internal/admin/users/${account.account_id}/authorization`,
      {
        headers: {
          "x-internal-service-key": process.env.INTERNAL_SERVICE_KEY,
        },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!response.ok) {
      return res.status(503).json({
        success: false,
        message: "Admin authorization service unavailable",
      });
    }

    const authorization = await response.json();

    if (authorization.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "User account is inactive",
      });
    }

    // STEP 4: Admin role check
    if (!authorization.roles?.includes("Admin")) {
      return res.status(403).json({
        success: false,
        message: "Only Admin can login",
      });
    }

    // STEP 5: JWT generate karo
    const token = jwt.sign(
      {
        id: account.account_id,
        type: "admin",
        role: "Admin",
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: account.account_id,
        role: "Admin",
      },
    });

  } catch (error) {
    console.error("Admin Login V2 Error:", error);

    return res.status(503).json({
      success: false,
      message: "Login service temporarily unavailable",
    });
  }
};

module.exports = { loginUserV2 };
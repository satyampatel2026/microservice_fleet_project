const authDb = require("../model/authDb");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const forgotClientPassword = async (req, res) => {
  const { email } = req.body || {};

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

  const normalizedEmail = email.trim().toLowerCase();
  let connection;

  try {
    const [accounts] = await authDb.query(
      `SELECT client_id
       FROM client_accounts
       WHERE email = ? AND status = 'active'
       LIMIT 1`,
      [normalizedEmail]
    );

    // Registered email disclose nahi karna
    if (accounts.length === 0) {
      return res.status(200).json({
        success: true,
        message: "If an active account exists, an OTP will be sent",
      });
    }

    const clientId = accounts[0].client_id;

    connection = await authDb.getConnection();
    await connection.beginTransaction();

    // Ek client ki simultaneous requests ko ek-ek karke process karo
    await connection.query(
      `SELECT client_id
       FROM client_accounts
       WHERE client_id = ?
       FOR UPDATE`,
      [clientId]
    );

    const [records] = await connection.query(
      `SELECT
         last_sent_at > UTC_TIMESTAMP() - INTERVAL 1 MINUTE
           AS recently_sent
       FROM client_password_reset_otp
       WHERE client_id = ?`,
      [clientId]
    );

    // Dobara OTP bhejne se pehle 1 minute wait
    if (records.length > 0 && records[0].recently_sent) {
      await connection.rollback();

      return res.status(200).json({
        success: true,
        message: "If an active account exists, an OTP will be sent",
      });
    }

    const otp = String(crypto.randomInt(100000, 1000000));

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    // Purana OTP hatao aur naya save karo
    await connection.query(
      `DELETE FROM client_password_reset_otp
       WHERE client_id = ?`,
      [clientId]
    );

    await connection.query(
      `INSERT INTO client_password_reset_otp
       (client_id, otp_hash, expires_at, attempts, last_sent_at)
       VALUES (
         ?, ?,
         UTC_TIMESTAMP() + INTERVAL 10 MINUTE,
         0,
         UTC_TIMESTAMP()
       )`,
      [clientId, otpHash]
    );

    await connection.commit();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: normalizedEmail,
      subject: "Client Password Reset OTP",
      text: `Your OTP is ${otp}. It expires in 10 minutes. If you did not request it, ignore this email.`,
    });

    return res.status(200).json({
      success: true,
      message: "If an active account exists, an OTP will be sent",
    });
  } catch (error) {
    if (connection) {
      await connection.rollback().catch(() => {});
    }

    console.error("Client forgot password error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to process password reset request",
    });
  } finally {
    if (connection) connection.release();
  }
};

const verifyClientOtp = async (req, res) => {
  const { email, otp } = req.body || {};

  if (
    typeof email !== "string" ||
    !email.trim() ||
    typeof otp !== "string" ||
    !/^[0-9]{6}$/.test(otp)
  ) {
    return res.status(400).json({
      success: false,
      message: "Email and valid 6-digit OTP are required",
    });
  }

  let connection;

  try {
    connection = await authDb.getConnection();
    await connection.beginTransaction();

    // Email se client ka current OTP record dhoondo
    const [records] = await connection.query(
      `SELECT
         o.id,
         o.otp_hash,
         o.attempts,
         o.reset_token_hash,
         o.expires_at <= UTC_TIMESTAMP() AS expired
       FROM client_password_reset_otp o
       INNER JOIN client_accounts a
         ON a.client_id = o.client_id
       WHERE a.email = ? AND a.status = 'active'
       LIMIT 1
       FOR UPDATE`,
      [email.trim().toLowerCase()]
    );

    if (records.length === 0) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    const record = records[0];

    // Expired ya already used OTP accept nahi karna
    if (record.expired || record.reset_token_hash !== null) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "OTP expired or already used. Request a new OTP",
      });
    }

    if (record.attempts >= 5) {
      await connection.rollback();

      return res.status(429).json({
        success: false,
        message: "Too many attempts. Request a new OTP",
      });
    }

    // Diye hue OTP ka hash banao
    const receivedHash = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    const expected = Buffer.from(record.otp_hash, "hex");
    const received = Buffer.from(receivedHash, "hex");

    const otpMatches =
      expected.length === received.length &&
      crypto.timingSafeEqual(expected, received);

    if (!otpMatches) {
      await connection.query(
        `UPDATE client_password_reset_otp
         SET attempts = attempts + 1
         WHERE id = ?`,
        [record.id]
      );

      // Wrong attempt ki ginti save karo
      await connection.commit();

      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // OTP sahi hai: temporary reset token banao
    const resetToken = crypto.randomBytes(32).toString("hex");

    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    await connection.query(
      `UPDATE client_password_reset_otp
       SET reset_token_hash = ?,
           reset_token_expires_at =
             UTC_TIMESTAMP() + INTERVAL 10 MINUTE
       WHERE id = ?`,
      [resetTokenHash, record.id]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      resetToken,
    });
  } catch (error) {
    if (connection) {
      await connection.rollback().catch(() => {});
    }

    console.error("Client OTP verification error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to verify OTP",
    });
  } finally {
    if (connection) connection.release();
  }
};

const resetClientPassword = async (req, res) => {
  const { resetToken, newPassword } = req.body || {};

  if (
    typeof resetToken !== "string" ||
    !/^[a-f0-9]{64}$/.test(resetToken)
  ) {
    return res.status(400).json({
      success: false,
      message: "Valid reset token is required",
    });
  }

  if (
    typeof newPassword !== "string" ||
    newPassword.length < 8 ||
    Buffer.byteLength(newPassword, "utf8") > 72
  ) {
    return res.status(400).json({
      success: false,
      message: "Password must have at least 8 characters and at most 72 bytes",
    });
  }

  let connection;

  try {
    // Received token ka hash database wale hash se match hoga
    const tokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const passwordHash = await bcrypt.hash(newPassword, 10);

    connection = await authDb.getConnection();
    await connection.beginTransaction();

    const [records] = await connection.query(
      `SELECT
         id,
         client_id,
         reset_token_expires_at <= UTC_TIMESTAMP() AS expired
       FROM client_password_reset_otp
       WHERE reset_token_hash = ?
       LIMIT 1
       FOR UPDATE`,
      [tokenHash]
    );

    if (records.length === 0) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Invalid or already used reset token",
      });
    }

    const record = records[0];

    if (record.expired !== 0) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Reset token expired. Request a new OTP",
      });
    }

    // Sirf active client ka password update karo
    const [result] = await connection.query(
      `UPDATE client_accounts
       SET password_hash = ?
       WHERE client_id = ? AND status = 'active'`,
      [passwordHash, record.client_id]
    );

    if (result.affectedRows !== 1) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Client account is unavailable",
      });
    }

    // Token ek hi baar use ho sakta hai
    await connection.query(
      `DELETE FROM client_password_reset_otp
       WHERE id = ?`,
      [record.id]
    );

    await connection.commit();

    // Is browser ki existing login cookie clear karo
    res.clearCookie("client_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. Please login",
    });
  } catch (error) {
    if (connection) {
      await connection.rollback().catch(() => {});
    }

    console.error("Client password reset error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to reset password",
    });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = { forgotClientPassword,verifyClientOtp,resetClientPassword };
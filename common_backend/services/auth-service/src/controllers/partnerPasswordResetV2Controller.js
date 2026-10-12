
const authDb = require("../model/authDb");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

const hashOtp = (otp) =>
  crypto.createHash("sha256").update(String(otp)).digest("hex");

const forgotPasswordV2 = async (req, res) => {
  const email = normalizeEmail(req.body?.email);

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }

  try {
    const [accounts] = await authDb.query(
      `SELECT partner_id, email
       FROM partner_accounts
       WHERE email = ? AND status = 'active'
       LIMIT 1`,
      [email]
    );

    if (accounts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Email not registered",
      });
    }

    const account = accounts[0];
    const otp = String(crypto.randomInt(100000, 1000000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const connection = await authDb.getConnection();

    try {
      await connection.beginTransaction();

      await connection.query(
        "DELETE FROM password_reset_otp WHERE partner_id = ?",
        [account.partner_id]
      );

      await connection.query(
        `INSERT INTO password_reset_otp
         (partner_id, email, otp_hash, expires_at, verified, attempts)
         VALUES (?, ?, ?, ?, 0, 0)`,
        [account.partner_id, email, hashOtp(otp), expiresAt]
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset OTP",
      text: `Your password reset OTP is ${otp}. It expires in 10 minutes.`,
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Forgot Password V2 Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const verifyOtpV2 = async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const otp = String(req.body?.otp ?? "");

  if (!email || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({
      success: false,
      message: "Valid email and OTP are required",
    });
  }

  const connection = await authDb.getConnection();

  try {
    await connection.beginTransaction();

    const [records] = await connection.query(
      `SELECT id, otp_hash, expires_at, verified, attempts
       FROM password_reset_otp
       WHERE email = ?
       ORDER BY id DESC
       LIMIT 1
       FOR UPDATE`,
      [email]
    );

    if (records.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "OTP not found",
      });
    }

    const record = records[0];

    if (new Date() > new Date(record.expires_at)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    if (record.attempts >= 5) {
      await connection.rollback();
      return res.status(429).json({
        success: false,
        message: "Too many OTP attempts",
      });
    }

    const expected = Buffer.from(record.otp_hash, "hex");
    const actual = Buffer.from(hashOtp(otp), "hex");

    if (
      expected.length !== actual.length ||
      !crypto.timingSafeEqual(expected, actual)
    ) {
      await connection.query(
        `UPDATE password_reset_otp
         SET attempts = attempts + 1
         WHERE id = ?`,
        [record.id]
      );

      await connection.commit();

      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    await connection.query(
      `UPDATE password_reset_otp
       SET verified = 1
       WHERE id = ?`,
      [record.id]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Verify OTP V2 Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  } finally {
    connection.release();
  }
};

const resetPasswordV2 = async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const newPassword = req.body?.newPassword;

  if (!email || typeof newPassword !== "string") {
    return res.status(400).json({
      success: false,
      message: "Email and new password are required",
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters",
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const connection = await authDb.getConnection();

    try {
      await connection.beginTransaction();

      const [records] = await connection.query(
        `SELECT id, partner_id, verified, expires_at
         FROM password_reset_otp
         WHERE email = ?
         ORDER BY id DESC
         LIMIT 1
         FOR UPDATE`,
        [email]
      );

      if (records.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: "Please request OTP first",
        });
      }

      const record = records[0];

      if (!record.verified) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: "Please verify OTP first",
        });
      }

      if (new Date() > new Date(record.expires_at)) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: "OTP has expired",
        });
      }

      const [result] = await connection.query(
        `UPDATE partner_accounts
         SET password_hash = ?
         WHERE partner_id = ? AND email = ? AND status = 'active'`,
        [hashedPassword, record.partner_id, email]
      );

      if (result.affectedRows !== 1) {
        throw new Error("Partner auth account not found");
      }

      await connection.query(
        "DELETE FROM password_reset_otp WHERE id = ?",
        [record.id]
      );

      await connection.commit();

      return res.status(200).json({
        success: true,
        message: "Password reset successfully",
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Reset Password V2 Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  forgotPasswordV2,
  verifyOtpV2,
  resetPasswordV2,
};

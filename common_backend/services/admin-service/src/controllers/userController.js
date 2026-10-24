const connection = require("../model/db");
const bcrypt = require("bcrypt");


// ================= TOTAL USERS =================

const totalUsers = async (req, res) => {
  try {
    const query = `
      SELECT COUNT(*) AS total_users
      FROM users
    `;

    const [result] = await connection.query(query);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Total Users Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ================= ADD USER =================

const postUser = async (req, res) => {
  const {
    full_name,
    email,
    mobile,
    password,
    department_id,
  } = req.body;

  if (
    !full_name?.trim() ||
    !email?.trim() ||
    !mobile ||
    typeof password !== "string" ||
    password.length < 8
  ) {
    return res.status(400).json({
      success: false,
      message: "Valid name, email, mobile and password (minimum 8 characters) required",
    });
  }

  let userId = null;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await connection.query(
      `INSERT INTO users
       (full_name, email, mobile, password, department_id)
       VALUES (UPPER(?), ?, ?, ?, ?)`,
      [
        full_name.trim(),
        email.trim().toLowerCase(),
        mobile,
        hashedPassword,
        department_id || null,
      ]
    );

    userId = result.insertId;

    // Auth Service me employee ka login account create karo
    const response = await fetch(
      "http://localhost:5001/internal/auth/admin-accounts",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-service-key":
            process.env.INTERNAL_SERVICE_KEY,
        },
        body: JSON.stringify({
          admin_id: userId,
          email: email.trim().toLowerCase(),
          password_hash: hashedPassword,
          status: "active",
        }),
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      console.error(
        "Auth account provisioning failed:",
        response.status,
        errorData.message
      );

      return res.status(502).json({
        success: false,
        message:
          "Employee created, but login account provisioning failed. Retry or reconcile the account before creating another user.",
        user_id: userId,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Employee and login account created successfully",
      user_id: userId,
    });
  } catch (error) {
    console.error("Add User Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create employee",
      ...(userId ? { user_id: userId } : {}),
    });
  }
};


// ================= GET USERS =================

const getUser = async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const status = req.query.status || "all";
  const department = req.query.department || "all";
  let page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);

  if (!Number.isSafeInteger(page) || page < 1 ||
      !Number.isSafeInteger(limit) || limit < 1 || limit > 100 ||
      search.length > 100 || !["all", "active", "inactive"].includes(status) ||
      (department !== "all" && (!Number.isSafeInteger(Number(department)) || Number(department) <= 0))) {
    return res.status(400).json({ success: false, message: "Invalid search or pagination values" });
  }

  // Har selected filter ke liye SQL condition aur value jodo.
  const conditions = [];
  const values = [];

  if (search) {
    // ! escape character hai. User ka % ya _ normal text ki tarah search hoga.
    const text = `%${search.replace(/[!%_]/g, "!$&")}%`;
    conditions.push(`(u.full_name LIKE ? ESCAPE '!' OR u.email LIKE ? ESCAPE '!'
      OR u.mobile LIKE ? ESCAPE '!' OR CAST(u.user_id AS CHAR) LIKE ? ESCAPE '!')`);
    values.push(text, text, text, text);
  }
  if (status !== "all") {
    conditions.push("u.status = ?");
    values.push(status);
  }
  if (department !== "all") {
    conditions.push("u.department_id = ?");
    values.push(Number(department));
  }

  const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

  try {
    // Matching records count karo; sirf current page ka count nahi.
    const [counts] = await connection.query(
      `SELECT COUNT(*) AS total FROM users u ${where}`, values
    );
    const total = Number(counts[0].total);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    page = Math.min(page, totalPages);
    const offset = (page - 1) * limit;

    const [users] = await connection.query(
      `SELECT u.user_id, u.full_name, u.email, u.mobile,
              u.department_id, u.status, u.created_at, d.department_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.department_id
       ${where}
       ORDER BY u.user_id DESC
       LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );

    // Full database stats: page/search badalne se ye counts nahi badlenge.
    const [stats] = await connection.query(
      `SELECT COUNT(*) AS total,
         COALESCE(SUM(status = 'active'), 0) AS active,
         COALESCE(SUM(status = 'inactive'), 0) AS inactive
       FROM users`
    );

    return res.status(200).json({
      success: true, users,
      pagination: { page, limit, total, totalPages },
      stats: {
        total: Number(stats[0].total),
        active: Number(stats[0].active),
        inactive: Number(stats[0].inactive),
      },
    });
  } catch (error) {
    console.error("Get Users Error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load users" });
  }
};

// ================= UPDATE USER =================
const updateUser = async (req, res) => {
  const userId = Number(req.query.user_id);
  const { full_name, email, department_id, status } = req.body;

  if (!Number.isSafeInteger(userId) || userId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid user ID",
    });
  }

  if (
    typeof full_name !== "string" ||
    !full_name.trim() ||
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    !["active", "inactive"].includes(status)
  ) {
    return res.status(400).json({
      success: false,
      message: "Valid name, email and status required",
    });
  }

  try {
    // Existing employee details
    const [users] = await connection.query(
      `SELECT user_id, email, status
       FROM users
       WHERE user_id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    if (Number(req.userId) === userId && status === "inactive") {
      return res.status(403).json({
        success: false,
        message: "You cannot deactivate your own account",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Pehle Auth Service update karo
    const response = await fetch(
      `http://localhost:5001/internal/auth/admin-accounts/${userId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-internal-service-key": process.env.INTERNAL_SERVICE_KEY,
        },
        body: JSON.stringify({
          email: normalizedEmail,
          status,
        }),
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!response.ok) {
      return res.status(502).json({
        success: false,
        message:
          "Login account update failed. Employee details were not changed.",
      });
    }

    // Auth update successful, ab Admin DB update karo
    const [result] = await connection.query(
      `UPDATE users
       SET full_name = UPPER(?),
           email = ?,
           department_id = ?,
           status = ?
       WHERE user_id = ?`,
      [
        full_name.trim(),
        normalizedEmail,
        department_id || null,
        status,
        userId,
      ]
    );

    return res.status(200).json({
      success: true,
      message: "Employee and login account updated successfully",
      affectedRows: result.affectedRows,
    });
  } catch (error) {
    console.error("Update User Error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Employee update failed. Check whether account synchronization is required.",
    });
  }
};

// ================= DELETE USER =================

const deleteUser = async (req, res) => {
  const userId = Number(req.query.user_id);

  if (!Number.isSafeInteger(userId) || userId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid user ID",
    });
  }

  if (Number(req.userId) === userId) {
    return res.status(403).json({
      success: false,
      message: "You cannot delete your own account",
    });
  }

  try {
    const [users] = await connection.query(
      "SELECT user_id FROM users WHERE user_id = ?",
      [userId]
    );

    if (!users.length) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Pehle login account disable karo.
    // Isse deletion ke beech employee login nahi kar payega.
    const disableResponse = await fetch(
      `http://localhost:5001/internal/auth/admin-accounts/${userId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-internal-service-key": process.env.INTERNAL_SERVICE_KEY,
        },
        body: JSON.stringify({
          email: await (async () => {
            const [[user]] = await connection.query(
              "SELECT email FROM users WHERE user_id = ?",
              [userId]
            );
            return user.email;
          })(),
          status: "inactive",
        }),
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!disableResponse.ok) {
      return res.status(502).json({
        success: false,
        message: "Unable to disable employee login",
      });
    }

    // Delete ke badle soft-delete: employee inactive rahega.
    // Isse role_assign aur doosre foreign-key relations safe rahenge.
    await connection.query(
      "UPDATE users SET status = 'inactive' WHERE user_id = ?",
      [userId]
    );

    return res.status(200).json({
      success: true,
      message: "Employee deactivated successfully",
    });
  } catch (error) {
    console.error("Delete User Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to deactivate employee",
    });
  }
};

// ================= UPDATE USER STATUS =================

const updateUserStatus = async (req, res) => {
  const userId = Number(req.params.userId);
  const { status } = req.body;

  if (!Number.isSafeInteger(userId) || userId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid user ID",
    });
  }

  if (!["active", "inactive"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid status",
    });
  }

  try {
    const actorId = Number(req.userId);

if (!Number.isSafeInteger(actorId) || actorId <= 0) {
  return res.status(401).json({
    success: false,
    message: "Authentication required",
  });
}

const [actorRoles] = await connection.query(
  `SELECT r.role_name
   FROM role_assign ra
   INNER JOIN roles r ON r.role_id = ra.role_id
   WHERE ra.user_id = ?`,
  [actorId]
);

const canManageUsers = actorRoles.some(
  ({ role_name }) =>
    ["Admin", "SUPER ADMIN"].includes(role_name)
);

if (!canManageUsers) {
  return res.status(403).json({
    success: false,
    message: "You do not have permission to change user status",
  });
}
    // Apna account inactive karne se prevent karo
    if (Number(req.userId) === userId && status === "inactive") {
      return res.status(403).json({
        success: false,
        message: "You cannot deactivate your own account",
      });
    }

    // Employee ka current email aur status nikalo
const [users] = await connection.query(
  "SELECT email, status FROM users WHERE user_id = ?",
  [userId]
);

if (users.length === 0) {
  return res.status(404).json({
    success: false,
    message: "User not found",
  });
}

// Auth Service ko update karo
const response = await fetch(
  `http://localhost:5001/internal/auth/admin-accounts/${userId}`,
  {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-internal-service-key": process.env.INTERNAL_SERVICE_KEY,
    },
    body: JSON.stringify({
      email: users[0].email,
      status,
    }),
    signal: AbortSignal.timeout(5000),
  }
);

if (!response.ok) {
  return res.status(502).json({
    success: false,
    message: "Login account status update failed",
  });
}

// Auth Service update hone ke baad Admin DB update karo
const [result] = await connection.query(
  "UPDATE users SET status = ? WHERE user_id = ?",
  [status, userId]
);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `User ${status} successfully`,
      user_id: userId,
      status,
    });
  } catch (error) {
    console.error("Update User Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update user status",
    });
  }
};

module.exports = {
  totalUsers,
  postUser,
  getUser,
  updateUser,
  deleteUser,updateUserStatus
};
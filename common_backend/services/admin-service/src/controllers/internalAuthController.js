const connection = require("../model/db");

const getUserAuthorization = async (req, res) => {
  const userId = Number(req.params.userId);

  if (!Number.isSafeInteger(userId) || userId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid user ID",
    });
  }

  try {
    const [users] = await connection.query(
      `SELECT user_id, status
       FROM users
       WHERE user_id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const [roles] = await connection.query(
      `SELECT r.role_name
       FROM role_assign ra
       INNER JOIN roles r
         ON ra.role_id = r.role_id
       WHERE ra.user_id = ?`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      user_id: users[0].user_id,
      status: users[0].status,
      roles: roles.map((role) => role.role_name),
    });

  } catch (error) {
    console.error("Internal Authorization Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  getUserAuthorization,
};
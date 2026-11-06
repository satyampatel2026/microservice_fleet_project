const connection = require("../model/db");

// ================= ADD ROLE =================
const postRole = async (req, res) => {
  const roleName = req.body?.role_name;
  let dbConnection;

  if (typeof roleName !== "string" || !roleName.trim()) {
    return res.status(400).json({ success: false, message: "Role name is required" });
  }

  try {
    dbConnection = await connection.getConnection();
    await dbConnection.beginTransaction();

    // Existing role names ka case nahi badalna: permissions inhe use karti hain.
    const [result] = await dbConnection.query(
      "INSERT INTO roles (role_name) VALUES (?)",
      [roleName]
    );

    const roleCode = "role" + String(result.insertId).padStart(2, "0");

    await dbConnection.query(
      "UPDATE roles SET role_code = ? WHERE role_id = ?",
      [roleCode, result.insertId]
    );

    await dbConnection.commit();
    return res.status(201).json({ ...result, role_code: roleCode });
  } catch (error) {
    if (dbConnection) await dbConnection.rollback().catch(() => {});
    console.error("Add Role Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    if (dbConnection) dbConnection.release();
  }
};

// ================= GET ROLES =================
const getRole = async (req, res) => {
  try {
    const [result] = await connection.query(
      "SELECT role_id, role_code, role_name FROM roles"
    );
    return res.status(200).json(result);
  } catch (error) {
    console.error("Get Roles Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Existing update flow same hai; role_code change nahi hota.
const updateRole = async (req, res) => {
  const { role_name } = req.body;
  const role_id = req.query.role_id;
  try {
    const [result] = await connection.query(
      "UPDATE roles SET role_name = UPPER(?) WHERE role_id = ?",
      [role_name, role_id]
    );
    return res.status(200).json(result);
  } catch (error) {
    console.error("Update Role Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteRole = async (req, res) => {
  const role_id = req.query.role_id;
  try {
    const [result] = await connection.query("DELETE FROM roles WHERE role_id = ?", [role_id]);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Delete Role Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getUserRole = async (req, res) => {
  const user_id = req.query.user_id;
  try {
    const [result] = await connection.query(
      `SELECT roles.role_id, roles.role_name
       FROM role_assign
       INNER JOIN roles ON role_assign.role_id = roles.role_id
       WHERE role_assign.user_id = ?`,
      [user_id]
    );
    return res.status(200).json(result);
  } catch (error) {
    console.error("Get User Role Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const postUserRole = async (req, res) => {
  try {
    const [result] = await connection.query("INSERT INTO role_assign SET ?", req.body);
    return res.status(201).json(result);
  } catch (error) {
    console.error("Assign Role Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteUserRole = async (req, res) => {
  const user_id = req.query.user_id;
  const role_id = req.query.role_id;
  try {
    const [result] = await connection.query(
      "DELETE FROM role_assign WHERE user_id = ? AND role_id = ?",
      [user_id, role_id]
    );
    return res.status(200).json(result);
  } catch (error) {
    console.error("Delete User Role Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { postRole, getRole, updateRole, deleteRole, getUserRole, postUserRole, deleteUserRole };

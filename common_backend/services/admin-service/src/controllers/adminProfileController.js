const db = require("../model/db");
const { cloudinary, uploadFile } = require("../config/cloudinary");

const profileColumns = `user_id, employee_code, department_id, full_name, email, mobile,
  personal_address, gender, photo_url, status, created_at`;

// Login ki ID se sirf apni profile milegi.
const getMyProfile = async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT ${profileColumns} FROM users WHERE user_id = ? LIMIT 1`,
      [req.userId]
    );

    if (!users.length || users[0].status !== "active") {
      return res.status(403).json({ success: false, message: "User account is unavailable" });
    }

    return res.json({ success: true, data: { ...users[0], roles: req.userRoles || [] } });
  } catch (error) {
    console.error("Get user profile:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load profile" });
  }
};

const updateMyProfile = async (req, res) => {
  const name = typeof req.body.full_name === "string" ? req.body.full_name.trim() : "";
  const mobile = typeof req.body.mobile === "string" ? req.body.mobile.trim() : "";
  const address = typeof req.body.personal_address === "string" ? req.body.personal_address.trim() : "";

  const protectedFields = ["roles", "role", "role_id", "department_id", "status", "user_id", "employee_code"];
  if (protectedFields.some((field) => req.body[field] !== undefined)) {
    return res.status(400).json({ success: false, message: "Role, department, status and employee ID cannot be changed from profile" });
  }
  const gender = req.body.gender;
  if (gender !== undefined && !["", "male", "female", "other"].includes(gender)) {
    return res.status(400).json({ success: false, message: "Select a valid gender" });
  }

  if (name.length < 3 || name.length > 100) {
    return res.status(400).json({ success: false, message: "Name must be 3 to 100 characters" });
  }
  if (!/^[6-9][0-9]{9}$/.test(mobile)) {
    return res.status(400).json({ success: false, message: "Enter a valid 10 digit mobile number" });
  }
  if (address.length > 1000) {
    return res.status(400).json({ success: false, message: "Address cannot exceed 1000 characters" });
  }

  // Email login se judi hai. Is API mein sirf name/mobile/address/photo update honge.
  if (req.body.email !== undefined) {
    return res.status(400).json({ success: false, message: "Email cannot be changed from this form" });
  }

  let connection;
  let uploadedPhoto;
  let oldPhotoId;
  let profile;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [users] = await connection.query(
      "SELECT photo_url, photo_public_id, status, gender FROM users WHERE user_id = ? FOR UPDATE",
      [req.userId]
    );

    if (!users.length || users[0].status !== "active") {
      await connection.rollback();
      return res.status(403).json({ success: false, message: "User account is unavailable" });
    }

    const user = users[0];
    let photoUrl = user.photo_url;
    let photoId = user.photo_public_id;

    // Photo optional hai. Na bhejne par existing photo rahegi.
    if (req.file) {
      uploadedPhoto = await uploadFile(req.file.buffer, `fleetrova/admin/users/${req.userId}/profile`);
      photoUrl = uploadedPhoto.secure_url;
      photoId = uploadedPhoto.public_id;
      oldPhotoId = user.photo_public_id;
    }

    await connection.query(
      `UPDATE users SET full_name = ?, mobile = ?, personal_address = ?, gender = ?,
       photo_url = ?, photo_public_id = ? WHERE user_id = ?`,
      [name, mobile, address || null, gender === undefined ? user.gender : (gender || null), photoUrl, photoId, req.userId]
    );

    const [updated] = await connection.query(
      `SELECT ${profileColumns} FROM users WHERE user_id = ?`,
      [req.userId]
    );
    profile = updated[0];
    await connection.commit();
  } catch (error) {
    if (connection) await connection.rollback().catch(() => {});

    // DB mein save na ho to abhi upload hui photo bhi remove karo.
    if (uploadedPhoto) {
      await cloudinary.uploader.destroy(uploadedPhoto.public_id)
        .catch((cleanupError) => console.error("New photo cleanup:", cleanupError.message));
    }

    console.error("Update user profile:", error.message);
    return res.status(error.code === "ER_DUP_ENTRY" ? 409 : 500).json({
      success: false,
      message: error.code === "ER_DUP_ENTRY" ? "Mobile number is already registered" : "Unable to update profile",
    });
  } finally {
    if (connection) connection.release();
  }

  // Nayi photo DB mein save hone ke baad hi purani photo delete karo.
  if (uploadedPhoto && oldPhotoId && oldPhotoId !== uploadedPhoto.public_id) {
    await cloudinary.uploader.destroy(oldPhotoId)
      .catch((error) => console.error("Old photo cleanup:", error.message));
  }

  return res.json({ success: true, message: "Profile updated successfully", data: { ...profile, roles: req.userRoles || [] } });
};



// Ye function sirf photo badlega; name/mobile/address ko touch nahi karega.
const updateMyPhoto = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "Please select a photo" });
  }
  let connection;
  let uploaded;
  let oldPhotoId;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    const [users] = await connection.query(
      "SELECT photo_public_id, status FROM users WHERE user_id = ? FOR UPDATE", [req.userId]
    );
    if (!users.length || users[0].status !== "active") {
      await connection.rollback();
      return res.status(403).json({ success: false, message: "User account is unavailable" });
    }
    oldPhotoId = users[0].photo_public_id;
    uploaded = await uploadFile(req.file.buffer, `fleetrova/admin/users/${req.userId}/profile`);
    await connection.query("UPDATE users SET photo_url = ?, photo_public_id = ? WHERE user_id = ?",
      [uploaded.secure_url, uploaded.public_id, req.userId]);
    await connection.commit();
  } catch (error) {
    if (connection) await connection.rollback().catch(() => {});
    if (uploaded) await cloudinary.uploader.destroy(uploaded.public_id)
      .catch((err) => console.error("New photo cleanup:", err.message));
    console.error("Photo upload:", error.message);
    return res.status(500).json({ success: false, message: "Unable to upload photo" });
  } finally {
    if (connection) connection.release();
  }
  if (oldPhotoId && oldPhotoId !== uploaded.public_id) {
    await cloudinary.uploader.destroy(oldPhotoId)
      .catch((error) => console.error("Old photo cleanup:", error.message));
  }
  return res.json({ success: true, message: "Image uploaded successfully", data: { photo_url: uploaded.secure_url } });
};

module.exports = { getMyProfile, updateMyProfile, updateMyPhoto };

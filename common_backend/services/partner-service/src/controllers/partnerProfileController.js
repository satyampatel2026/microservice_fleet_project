const db = require("../model/db");
const { cloudinary, uploadFile } = require("../config/cloudinary");

const profileColumns = `partner_id, partner_name, email, mobile,
  personal_address, gender, photo_url, status, created_at`;

// Login ki ID se sirf apni profile milegi.
const getMyProfile = async (req, res) => {
  try {
    const [partners] = await db.query(
      `SELECT ${profileColumns} FROM partners WHERE partner_id = ? LIMIT 1`,
      [req.partnerId]
    );

    if (!partners.length || partners[0].status !== "active") {
      return res.status(403).json({ success: false, message: "Partner account is unavailable" });
    }

    return res.json({ success: true, data: partners[0] });
  } catch (error) {
    console.error("Get partner profile:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load profile" });
  }
};

const updateMyProfile = async (req, res) => {
  const name = typeof req.body.partner_name === "string" ? req.body.partner_name.trim() : "";
  const mobile = typeof req.body.mobile === "string" ? req.body.mobile.trim() : "";
  const address = typeof req.body.personal_address === "string" ? req.body.personal_address.trim() : "";

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

    const [partners] = await connection.query(
      "SELECT photo_url, photo_public_id, status, gender FROM partners WHERE partner_id = ? FOR UPDATE",
      [req.partnerId]
    );

    if (!partners.length || partners[0].status !== "active") {
      await connection.rollback();
      return res.status(403).json({ success: false, message: "Partner account is unavailable" });
    }

    const partner = partners[0];
    let photoUrl = partner.photo_url;
    let photoId = partner.photo_public_id;

    // Photo optional hai. Na bhejne par existing photo rahegi.
    if (req.file) {
      uploadedPhoto = await uploadFile(req.file.buffer, `fleetrova/partners/${req.partnerId}/profile`);
      photoUrl = uploadedPhoto.secure_url;
      photoId = uploadedPhoto.public_id;
      oldPhotoId = partner.photo_public_id;
    }

    await connection.query(
      `UPDATE partners SET partner_name = ?, mobile = ?, personal_address = ?, gender = ?,
       photo_url = ?, photo_public_id = ? WHERE partner_id = ?`,
      [name, mobile, address || null, gender === undefined ? partner.gender : (gender || null), photoUrl, photoId, req.partnerId]
    );

    const [updated] = await connection.query(
      `SELECT ${profileColumns} FROM partners WHERE partner_id = ?`,
      [req.partnerId]
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

    console.error("Update partner profile:", error.message);
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

  return res.json({ success: true, message: "Profile updated successfully", data: profile });
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
    const [partners] = await connection.query(
      "SELECT photo_public_id, status FROM partners WHERE partner_id = ? FOR UPDATE", [req.partnerId]
    );
    if (!partners.length || partners[0].status !== "active") {
      await connection.rollback();
      return res.status(403).json({ success: false, message: "Partner account is unavailable" });
    }
    oldPhotoId = partners[0].photo_public_id;
    uploaded = await uploadFile(req.file.buffer, `fleetrova/partners/${req.partnerId}/profile`);
    await connection.query("UPDATE partners SET photo_url = ?, photo_public_id = ? WHERE partner_id = ?",
      [uploaded.secure_url, uploaded.public_id, req.partnerId]);
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

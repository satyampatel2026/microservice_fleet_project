const db = require("../model/db");
const {prepareBusiness} = require("../utils/clientBusiness");

const {cloudinary,uploadFile} = require("../config/cloudinary");

const profileColumns = `client_id, name, email, mobile,
  personal_address, gender, photo_url, status, created_at, company_name, business_type, gstin, pan_number,
  CASE WHEN aadhaar_last4 IS NOT NULL THEN CONCAT('XXXXXXXX',aadhaar_last4) ELSE NULL END AS aadhaar_masked,
  business_verification_status, business_rejection_reason`;

// Login ki ID se sirf apni profile milegi.
const getMyProfile = async (req, res) => {
  try {
    const [clients] = await db.query(`SELECT ${profileColumns} FROM clients WHERE client_id = ? LIMIT 1`, [req.clientId]);
    if (!clients.length || clients[0].status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Client account is unavailable"
      });
    }
    return res.json({
      success: true,
      data: clients[0]
    });
  } catch (error) {
    console.error("Get client profile:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load profile"
    });
  }
};
const updateMyProfile = async (req, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const mobile = typeof req.body.mobile === "string" ? req.body.mobile.trim() : "";
  const address = typeof req.body.personal_address === "string" ? req.body.personal_address.trim() : "";
  const gender = req.body.gender;
  if (gender !== undefined && !["", "male", "female", "other"].includes(gender)) {
    return res.status(400).json({
      success: false,
      message: "Select a valid gender"
    });
  }
  if (name.length < 3 || name.length > 100) {
    return res.status(400).json({
      success: false,
      message: "Name must be 3 to 100 characters"
    });
  }
  if (!/^[6-9][0-9]{9}$/.test(mobile)) {
    return res.status(400).json({
      success: false,
      message: "Enter a valid 10 digit mobile number"
    });
  }
  if (address.length > 1000) {
    return res.status(400).json({
      success: false,
      message: "Address cannot exceed 1000 characters"
    });
  }

  // Email login se judi hai. Is API mein sirf name/mobile/address/photo update honge.
  if (req.body.email !== undefined) {
    return res.status(400).json({
      success: false,
      message: "Email cannot be changed from this form"
    });
  }
  let connection;
  let uploadedPhoto;
  let oldPhotoId;
  let profile;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    const [clients] = await connection.query("SELECT * FROM clients WHERE client_id = ? FOR UPDATE", [req.clientId]);
    if (!clients.length || clients[0].status !== "active") {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: "Client account is unavailable"
      });
    }
    const client = clients[0];
    const business = prepareBusiness(req.body, client);
    let photoUrl = client.photo_url;
    let photoId = client.photo_public_id;

    // Photo optional hai. Na bhejne par existing photo rahegi.
    if (req.file) {
      uploadedPhoto = await uploadFile(req.file.buffer, `fleetrova/clients/${req.clientId}/profile`);
      photoUrl = uploadedPhoto.secure_url;
      photoId = uploadedPhoto.public_id;
      oldPhotoId = client.photo_public_id;
    }
    await connection.query(`UPDATE clients SET name = ?, mobile = ?, personal_address = ?, gender = ?,
       photo_url = ?, photo_public_id = ?, company_name=?, business_type=?, gstin=?, pan_number=?, aadhaar_hash=?, aadhaar_last4=?,
       business_verification_status=?, business_rejection_reason=?, business_reviewed_by=?, business_reviewed_at=? WHERE client_id = ?`, [name, mobile, address || null, gender === undefined ? client.gender : gender || null, photoUrl, photoId, business.company_name || null, business.business_type || null, business.gstin || null, business.pan_number || null, business.aadhaar_hash, business.aadhaar_last4, business.changed ? "pending" : client.business_verification_status, business.changed ? null : client.business_rejection_reason, business.changed ? null : client.business_reviewed_by, business.changed ? null : client.business_reviewed_at, req.clientId]);
    const [updated] = await connection.query(`SELECT ${profileColumns} FROM clients WHERE client_id = ?`, [req.clientId]);
    profile = updated[0];
    await connection.commit();
  } catch (error) {
    if (connection) await connection.rollback().catch(() => {});

    // DB mein save na ho to abhi upload hui photo bhi remove karo.
    if (uploadedPhoto) {
      await cloudinary.uploader.destroy(uploadedPhoto.public_id).catch(cleanupError => console.error("New photo cleanup:", cleanupError.message));
    }
    console.error("Update client profile:", error.message);
    return res.status(error.status || (error.code === "ER_DUP_ENTRY" ? 409 : 500)).json({
      success: false,
      message: error.status ? error.message : error.code === "ER_DUP_ENTRY" ? "Mobile number is already registered" : "Unable to update profile"
    });
  } finally {
    if (connection) connection.release();
  }

  // Nayi photo DB mein save hone ke baad hi purani photo delete karo.
  if (uploadedPhoto && oldPhotoId && oldPhotoId !== uploadedPhoto.public_id) {
    await cloudinary.uploader.destroy(oldPhotoId).catch(error => console.error("Old photo cleanup:", error.message));
  }
  return res.json({
    success: true,
    message: "Profile updated successfully",
    data: profile
  });
};

// Ye function sirf photo badlega; name/mobile/address ko touch nahi karega.
const updateMyPhoto = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Please select a photo"
    });
  }
  let connection;
  let uploaded;
  let oldPhotoId;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    const [clients] = await connection.query("SELECT photo_public_id, status FROM clients WHERE client_id = ? FOR UPDATE", [req.clientId]);
    if (!clients.length || clients[0].status !== "active") {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: "Client account is unavailable"
      });
    }
    oldPhotoId = clients[0].photo_public_id;
    uploaded = await uploadFile(req.file.buffer, `fleetrova/clients/${req.clientId}/profile`);
    await connection.query("UPDATE clients SET photo_url = ?, photo_public_id = ? WHERE client_id = ?", [uploaded.secure_url, uploaded.public_id, req.clientId]);
    await connection.commit();
  } catch (error) {
    if (connection) await connection.rollback().catch(() => {});
    if (uploaded) await cloudinary.uploader.destroy(uploaded.public_id).catch(err => console.error("New photo cleanup:", err.message));
    console.error("Photo upload:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to upload photo"
    });
  } finally {
    if (connection) connection.release();
  }
  if (oldPhotoId && oldPhotoId !== uploaded.public_id) {
    await cloudinary.uploader.destroy(oldPhotoId).catch(error => console.error("Old photo cleanup:", error.message));
  }
  return res.json({
    success: true,
    message: "Image uploaded successfully",
    data: {
      photo_url: uploaded.secure_url
    }
  });
};
module.exports = {
  getMyProfile,
  updateMyProfile,
  updateMyPhoto
};

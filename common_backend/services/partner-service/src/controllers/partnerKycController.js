const connection = require("../model/db");
const { validateKycNumbers } = require("../utils/kycValidation");
const { cloudinary, uploadFile } = require("../config/cloudinary");

const documentFields = ["pan_document", "aadhaar_document", "gst_document"];

// Purana Cloudinary document remove karo. Local files migration tak rakhenge.
const removeCloudDocument = async (document) => {
  await cloudinary.uploader.destroy(document.public_id, {
    resource_type: document.resource_type,
    type: "authenticated",
  });
};

const submitKyc = async (req, res) => {
  const partnerId = Number(req.partnerId);
  const fields = ["owner_name", "business_name", "business_address", "pan_number", "gst_number", "aadhaar_number"];
  const limits = [100, 150, 5000, 20, 20, 20];
  const details = fields.map((field) => typeof req.body[field] === "string" ? req.body[field].trim() : "");

  if (!Number.isSafeInteger(partnerId) || partnerId <= 0 || !details[0]) {
    return res.status(400).json({ success: false, message: "Valid partner and owner name are required" });
  }
  if (details.some((value, index) => value.length > limits[index])) {
    return res.status(400).json({ success: false, message: "One or more KYC details exceed the allowed length" });
  }

  // PAN/GST uppercase karke save karo. Validation upload/transaction se pehle hogi.
  details[3] = details[3].toUpperCase();
  details[4] = details[4].toUpperCase();
  const validationError = await validateKycNumbers({
    pan_number: details[3],
    gst_number: details[4],
    aadhaar_number: details[5],
  });
  if (validationError) {
    return res.status(validationError.status || 400).json({
      success: false,
      message: validationError.message,
      field: validationError.field,
    });
  }

  let db;
  let kycId;
  let isNew;
  const newDocuments = [];
  const oldDocuments = [];

  try {
    db = await connection.getConnection();
    await db.beginTransaction();

    // Ek partner ki do simultaneous requests ko ek saath update nahi karna.
    const [partners] = await db.query("SELECT status FROM partners WHERE partner_id = ? FOR UPDATE", [partnerId]);
    if (!partners.length || partners[0].status !== "active") {
      await db.rollback();
      return res.status(403).json({ success: false, message: "Partner account is unavailable" });
    }

    const [rows] = await db.query("SELECT * FROM partner_kyc WHERE partner_id = ?", [partnerId]);
    const oldKyc = rows[0] || {};
    const metadata = typeof oldKyc.cloud_documents === "string" ? JSON.parse(oldKyc.cloud_documents) : (oldKyc.cloud_documents || {});
    const paths = [];

    // Sirf nayi bheji hui files upload hongi; baaki documents same rahenge.
    for (const field of documentFields) {
      const file = req.files?.[field]?.[0];
      if (!file) {
        paths.push(oldKyc[field] || null);
        continue;
      }
      const uploaded = await uploadFile(file.buffer, `fleetrova/partners/${partnerId}/kyc/${field}`, true);
      const document = {
        public_id: uploaded.public_id,
        resource_type: uploaded.resource_type,
        format: uploaded.format || "",
      };
      newDocuments.push(document);
      if (metadata[field]) oldDocuments.push(metadata[field]);
      metadata[field] = document;
      paths.push(uploaded.secure_url);
    }

    isNew = rows.length === 0;
    const values = [...details.map((value) => value || null), ...paths, JSON.stringify(metadata)];
    if (isNew) {
      const [result] = await db.query(
        `INSERT INTO partner_kyc
         (owner_name, business_name, business_address, pan_number, gst_number, aadhaar_number,
          pan_document, aadhaar_document, gst_document, cloud_documents, partner_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [...values, partnerId]
      );
      kycId = result.insertId;
    } else {
      await db.query(
        `UPDATE partner_kyc SET owner_name = ?, business_name = ?, business_address = ?,
         pan_number = ?, gst_number = ?, aadhaar_number = ?, pan_document = ?,
         aadhaar_document = ?, gst_document = ?, cloud_documents = ?,
         kyc_status = 'pending', rejection_reason = NULL, verified_at = NULL
         WHERE partner_id = ?`,
        [...values, partnerId]
      );
      kycId = oldKyc.kyc_id;
    }
    await db.commit();
  } catch (error) {
    if (db) await db.rollback().catch(() => {});
    // Koi upload/DB step fail ho to is request ki nayi files clean karo.
    for (const document of newDocuments) {
      await removeCloudDocument(document).catch((err) => console.error("New KYC cleanup:", err.message));
    }
    console.error("Submit KYC:", error.message);
    return res.status(error.code === "ER_DUP_ENTRY" ? 409 : 500).json({
      success: false,
      message: error.code === "ER_DUP_ENTRY" ? "PAN, Aadhaar or GST number is already registered" : "Unable to save KYC",
    });
  } finally {
    if (db) db.release();
  }

  // DB save hone ke baad purane cloud documents delete honge.
  for (const document of oldDocuments) {
    await removeCloudDocument(document).catch((error) => console.error("Old KYC cleanup:", error.message));
  }
  return res.status(isNew ? 201 : 200).json({
    success: true,
    message: isNew ? "KYC submitted successfully" : "KYC updated successfully",
    kyc_id: kycId,
  });
};

const getKycByPartnerId = async (req, res) => {
  try {
    const partner_id = req.partnerId;
    const [rows] = await connection.execute(
      `SELECT kyc_id, partner_id, owner_name, business_name, business_address, pan_number,gst_number,aadhaar_number,
      pan_document,aadhaar_document,gst_document,kyc_status,rejection_reason,submitted_at,verified_at
      FROM partner_kyc WHERE partner_id = ?`,[partner_id]
     );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "KYC not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: rows[0],
    });

  } catch (error) {
    console.error("Get KYC Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


module.exports = {
  submitKyc,
  getKycByPartnerId,
};
const crypto = require("crypto");

// Aadhaar ka Verhoeff checksum. Fixed mathematical tables hain, client data nahi.
const multiplication = [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 0, 6, 7, 8, 9, 5], [2, 3, 4, 0, 1, 7, 8, 9, 5, 6], [3, 4, 0, 1, 2, 8, 9, 5, 6, 7], [4, 0, 1, 2, 3, 9, 5, 6, 7, 8], [5, 9, 8, 7, 6, 0, 4, 3, 2, 1], [6, 5, 9, 8, 7, 1, 0, 4, 3, 2], [7, 6, 5, 9, 8, 2, 1, 0, 4, 3], [8, 7, 6, 5, 9, 3, 2, 1, 0, 4], [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]];
const permutation = [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 5, 7, 6, 2, 8, 3, 0, 9, 4], [5, 8, 0, 3, 7, 9, 6, 1, 4, 2], [8, 9, 1, 6, 0, 4, 3, 5, 2, 7], [9, 4, 5, 3, 1, 2, 6, 8, 7, 0], [4, 2, 8, 6, 5, 7, 3, 9, 0, 1], [2, 7, 9, 3, 8, 0, 6, 4, 1, 5], [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]];
function hasValidAadhaarChecksum(number) {
  if (typeof number !== "string" || !/^[2-9][0-9]{11}$/.test(number)) return false;
  let checksum = 0;
  const digits = number.split("").reverse();
  for (let index = 0; index < digits.length; index++) {
    const digit = Number(digits[index]);
    checksum = multiplication[checksum][permutation[index % 8][digit]];
  }
  return checksum === 0;
}

function createError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

// Field request mein na bheji ho to purani value preserve karo.
function readText(body, old, field) {
  if (body[field] === undefined) return old[field] || "";
  if (typeof body[field] !== "string") throw createError("Invalid " + field);
  return body[field].trim();
}

// Hash one-way hai. Isse original Aadhaar wapas nahi nikal sakte.
function hashAadhaar(aadhaar) {
  return crypto.createHash("sha256").update(aadhaar).digest("hex");
}

function prepareBusiness(body, old) {
  const companyName = readText(body, old, "company_name");
  const businessType = readText(body, old, "business_type");
  const gstin = readText(body, old, "gstin").toUpperCase();
  const pan = readText(body, old, "pan_number").toUpperCase();

  if (companyName && (companyName.length < 2 || companyName.length > 150)) {
    throw createError("Company name must be 2 to 150 characters");
  }
  if (businessType.length > 60) throw createError("Business type cannot exceed 60 characters");
  if (gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin)) {
    throw createError("Enter a valid GSTIN");
  }
  if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) throw createError("Enter a valid PAN");

  // Blank input keeps existing Aadhaar. Raw Aadhaar is not returned to the UI.
  const aadhaar = readText(body, {}, "aadhaar_number");
  let aadhaarHash = old.aadhaar_hash || null;
  let last4 = old.aadhaar_last4 || null;
  if (aadhaar) {
    if (!hasValidAadhaarChecksum(aadhaar)) throw createError("Enter a valid Aadhaar number (checksum failed)");
    aadhaarHash = hashAadhaar(aadhaar);
    last4 = aadhaar.slice(-4);
  }

  const changed =
    companyName !== (old.company_name || "") ||
    businessType !== (old.business_type || "") ||
    gstin !== (old.gstin || "") ||
    pan !== (old.pan_number || "") ||
    aadhaar !== "";

  return {
    company_name: companyName,
    business_type: businessType,
    gstin,
    pan_number: pan,
    aadhaar_hash: aadhaarHash,
    aadhaar_last4: last4,
    changed,
  };
}
module.exports = { prepareBusiness };

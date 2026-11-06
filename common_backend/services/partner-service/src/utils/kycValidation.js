const axios = require("axios");

// These tables implement the Aadhaar Verhoeff checksum.
const multiplication = [
  [0,1,2,3,4,5,6,7,8,9], [1,2,3,4,0,6,7,8,9,5],
  [2,3,4,0,1,7,8,9,5,6], [3,4,0,1,2,8,9,5,6,7],
  [4,0,1,2,3,9,5,6,7,8], [5,9,8,7,6,0,4,3,2,1],
  [6,5,9,8,7,1,0,4,3,2], [7,6,5,9,8,2,1,0,4,3],
  [8,7,6,5,9,3,2,1,0,4], [9,8,7,6,5,4,3,2,1,0],
];
const permutation = [
  [0,1,2,3,4,5,6,7,8,9], [1,5,7,6,2,8,3,0,9,4],
  [5,8,0,3,7,9,6,1,4,2], [8,9,1,6,0,4,3,5,2,7],
  [9,4,5,3,1,2,6,8,7,0], [4,2,8,6,5,7,3,9,0,1],
  [2,7,9,3,8,0,6,4,1,5], [7,0,4,6,9,1,3,2,5,8],
];

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


// GSTIN uses a base-36 checksum, NOT Verhoeff.
function hasValidGstChecksum(gst) {
  if (typeof gst !== "string" || !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gst)) return false;
  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let sum = 0;
  for (let index = 0; index < 14; index++) {
    const value = alphabet.indexOf(gst[index]);
    const product = value * (index % 2 === 0 ? 1 : 2);
    sum += Math.floor(product / 36) + product % 36;
  }
  return alphabet[(36 - sum % 36) % 36] === gst[14];
}

// Basic formats remain even when external verification is off.
function checkLocalNumbers(pan, gst, aadhaar, sandboxMode) {
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan || "")) {
    return { field: "pan_number", message: "Enter a valid PAN number." };
  }
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gst || "")) {
    return { field: "gst_number", message: "Enter a valid GST number." };
  }
  if (!/^[2-9][0-9]{11}$/.test(aadhaar || "")) {
    return { field: "aadhaar_number", message: "Aadhaar must have 12 digits and start with 2 to 9." };
  }
  if (process.env.KYC_AADHAAR_CHECKSUM !== "false" && !hasValidAadhaarChecksum(aadhaar)) {
    return { field: "aadhaar_number", message: "Aadhaar checksum is invalid. Please check the number." };
  }
  // Only sandbox may skip this: StampMitra's synthetic fixtures may fail checksum.
  const skipGstChecksum = sandboxMode && process.env.KYC_GST_CHECKSUM === "false";
  if (!skipGstChecksum && !hasValidGstChecksum(gst)) {
    return { field: "gst_number", message: "GST checksum is invalid. Please check the number." };
  }
  return null;
}

// This integration accepts TEST keys only, so it cannot make paid live calls.
async function callStampMitra(document, body, key) {
  const response = await axios.post(
    `https://api-b2b.stampmitra.in/v1/verify/${document}`,
    body,
    { headers: { Authorization: `Bearer ${key}` }, timeout: 8000, maxRedirects: 0 }
  );
  return response.data;
}

async function validateKycNumbers({ pan_number: pan, gst_number: gst, aadhaar_number: aadhaar }) {
  const mode = process.env.KYC_DOCUMENT_MODE || "off";
  const sandboxMode = mode === "stampmitra-sandbox";
  const localError = checkLocalNumbers(pan, gst, aadhaar, sandboxMode);
  if (localError) return localError;
  if (mode === "off") return null;
  if (!sandboxMode) {
    return { status: 503, message: "Invalid KYC_DOCUMENT_MODE. Use off or stampmitra-sandbox." };
  }
  if (process.env.NODE_ENV === "production") {
    return { status: 503, message: "Sandbox KYC checks are disabled in production. Set KYC_DOCUMENT_MODE=off." };
  }
  const key = (process.env.STAMPMITRA_API_KEY || "").trim();
  if (!key.startsWith("sk_test_") || key.length <= 8) {
    return { status: 503, message: "Configure a StampMitra sandbox API key in the backend." };
  }

  try {
    const panResult = await callStampMitra("pan", { pan }, key);
    if (typeof panResult?.valid !== "boolean") {
      return { status: 503, message: "Unexpected PAN verification response. Please try again later." };
    }
    if (!panResult.valid) {
      return { field: "pan_number", message: "PAN was not found by the sandbox verification." };
    }

    const gstResult = await callStampMitra("gstin", { gstin: gst }, key);
    if (typeof gstResult?.valid !== "boolean") {
      return { status: 503, message: "Unexpected GST verification response. Please try again later." };
    }
    if (!gstResult.valid) {
      return { field: "gst_number", message: "GSTIN was not found by the sandbox verification." };
    }
    const gstStatus = gstResult.gstinStatus || gstResult.registrationStatus;
    if (typeof gstStatus !== "string" || !gstStatus.trim()) {
      return { status: 503, message: "GST verification did not return registration status." };
    }
    if (gstStatus.trim().toLowerCase() !== "active") {
      return { field: "gst_number", message: "GST registration must be active." };
    }
    return null;
  } catch (error) {
    // Never log the Axios error object: it contains the secret header and document numbers.
    console.error("StampMitra verification unavailable:", error.response?.status || error.code || "unknown");
    return { status: 503, message: "Document verification is unavailable. Please try again later." };
  }
}

module.exports = { validateKycNumbers, hasValidAadhaarChecksum, hasValidGstChecksum };

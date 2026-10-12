
const API_URL = "http://localhost:5000/api/admin";

// Common API request function
async function request(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    throw new Error(
      data.message || "Something went wrong"
    );
  }

  return data;
}

// ================= PARTNERS =================

export async function getPartners() {
  return request("/partners");
}

export async function updatePartnerStatus(partnerId, status) {
  return request(`/partners/${partnerId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });
}

// ================= ADMIN KYC =================

export async function getKycList() {
  return request("/kyc");
}

export async function getKycDetails(kycId) {
  return request(`/kyc/${kycId}`);
}

export async function verifyKyc(kycId) {
  return request(`/kyc/${kycId}/verify`, {
    method: "PATCH",
  });
}

export async function rejectKyc(kycId, rejectionReason) {
  return request(`/kyc/${kycId}/reject`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      rejectionReason,
    }),
  });
}

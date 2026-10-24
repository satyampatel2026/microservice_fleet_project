
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

export async function getPartners(search, status, page, limit) {
  const query = new URLSearchParams({
    search,
    status,
    page: String(page),
    limit: String(limit),
  });

  return request(`/partners?${query.toString()}`);
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

// ================= SERVICE CATEGORIES =================

// Get all categories
export async function getCategories() {
  return request("/categories");
}

// Create category
export async function createCategory(categoryData) {
  return request("/categories", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(categoryData),
  });
}

// Update category
export async function updateCategory(categoryId, categoryData) {
  return request(`/categories/${categoryId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(categoryData),
  });
}

// ================= CATEGORY SERVICES =================

// Get all services
export async function getServices() {
  return request("/services");
}

// Create service
export async function createService(serviceData) {
  return request("/services", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(serviceData),
  });
}

// Update service
export async function updateService(serviceId, serviceData) {
  return request(`/services/${serviceId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(serviceData),
  });
}

// ================= PARTNER SERVICE CATALOG =================

export async function getPartnerServiceCatalog() {
  const response = await fetch(
    "http://localhost:5000/api/partner/service-catalog",
    {
      method: "GET",
      credentials: "include",
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    throw new Error(
      data.message || "Failed to load service catalog"
    );
  }

  return data;
}
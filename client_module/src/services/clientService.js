const BASE_URL = "/api/client";

// Ye common function backend ko request bhejta hai.
async function request(path, method, body) {
  const options = {
    method: method,
    credentials: "include", // Login cookie bhi bhejo
  };

  if (body instanceof FormData) {
    // Browser khud multipart Content-Type/boundary set karega.
    options.body = body;
  } else if (body) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(body);
  }

  const response = await fetch(BASE_URL + path, options);
  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success !== true) {
    const error = new Error(result.message || "Request failed. Please try again.");
    error.status = response.status;
    throw error;
  }

  return result;
}

export async function registerClient(data) {
  return request("/register", "POST", data);
}

export async function loginClient(data) {
  return request("/login", "POST", data);
}

export async function checkClientAuth() {
  return request("/auth", "GET");
}

export async function logoutClient() {
  return request("/logout", "POST");
}

export async function forgotClientPassword(data) {
  return request("/forgot-password", "POST", data);
}

export async function verifyClientOtp(data) {
  return request("/verify-otp", "POST", data);
}

export async function resetClientPassword(data) {
  return request("/reset-password", "POST", data);
}

export async function getClientTerms() {
  return request("/terms", "GET");
}

export async function getClientProfile() {
  return request("/profile", "GET");
}
export async function updateClientProfile(formData) {
  return request("/profile", "PUT", formData);
}
export async function uploadClientPhoto(formData) {
  return request("/profile/photo", "POST", formData);
}

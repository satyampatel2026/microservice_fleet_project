const API_URL = "http://localhost:5000/api/admin/profile";

async function request(path = "", method = "GET", body) {
  const response = await fetch(API_URL + path, {
    method,
    credentials: "include",
    ...(body ? { body } : {}),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success !== true) {
    throw new Error(result.message || "Unable to process profile request");
  }
  return result;
}

export function getAdminProfile() {
  return request();
}

export function updateAdminProfile(formData) {
  return request("", "PUT", formData);
}

export function uploadAdminPhoto(formData) {
  return request("/photo", "POST", formData);
}

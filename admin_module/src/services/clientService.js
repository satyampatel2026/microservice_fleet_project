const API_URL = "http://localhost:5000/api/admin/clients";

async function request(url, method = "GET", body) {
  const options = { method, credentials: "include" };
  if (body) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(body);
  }
  const response = await fetch(url, options);
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success !== true) {
    throw new Error(result.message || "Unable to complete client request.");
  }
  return result;
}

export async function getClients(search, status, page, limit, sort = "", businessStatus = "", vehicleApproval = "") {
  const query = new URLSearchParams({ search, status, sort, businessStatus, vehicleApproval, page: String(page), limit: String(limit) });
  return request(`${API_URL}?${query.toString()}`);
}

export async function getClientDetails(clientId) {
  return request(`${API_URL}/${clientId}`);
}

export async function updateClientStatus(clientId, status) {
  return request(`${API_URL}/${clientId}/status`, "PATCH", { status });
}

const API_URL = "http://localhost:5000/api/admin";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success !== true) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export async function getPendingServiceRequests({
  status = "all",
  search = "",
  page = 1,
  limit = 10,
} = {}) {
  const params = new URLSearchParams({
    status,
    search,
    page: String(page),
    limit: String(limit),
  });

  return request(`/service-requests?${params.toString()}`);
}

export function assignServiceRequest(requestId, partnerId) {
  return request(`/service-requests/${requestId}/assign`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      partner_id: Number(partnerId),
    }),
  });
}

export function cancelServiceRequest(requestId, reason) {
  return request(`/service-requests/${requestId}/cancel`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cancellation_reason: reason,
    }),
  });
}
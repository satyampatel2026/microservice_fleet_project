const API_URL = "/api/client/trips";

async function request(path = "", method = "GET", body) {
  const response = await fetch(API_URL + path, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success !== true) throw new Error(result.message || "Trip request failed");
  return result;
}

export const getTrips = () => request();
export const getTripOptions = () => request("/options");
export const createTrip = data => request("", "POST", data);
export const updateTripStatus = (id, status) => request(`/${id}/status`, "PATCH", { status });

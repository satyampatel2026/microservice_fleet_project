const API_URL = "/api/client/drivers";

async function request(path = "", method = "GET", body) {
  const response = await fetch(API_URL + path, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success !== true) {
    throw new Error(result.message || "Driver request failed");
  }
  return result;
}

export const getDrivers = () => request();
export const addDriver = data => request("", "POST", data);
export const updateDriver = (id, data) => request(`/${id}`, "PUT", data);
export const updateDriverStatus = (id, status) => request(`/${id}/status`, "PATCH", { status });

const API_URL = "";
async function request(path, method = "GET", body) {
  const isFile = body instanceof FormData;
  const response = await fetch(API_URL + path, {
    method,
    credentials: "include",
    headers: body && !isFile ? {
      "Content-Type": "application/json"
    } : undefined,
    body: body ? isFile ? body : JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000)
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success !== true) throw new Error(result.message || "Request failed");
  return result;
}
export const getVehicles = () => request("/api/client/vehicles");
export const addVehicle = data => request("/api/client/vehicles", "POST", data);
export const updateVehicle = (id, data) => request(`/api/client/vehicles/${id}`, "PUT", data);
export const updateVehicleStatus = (id, status) => request(`/api/client/vehicles/${id}/status`, "PATCH", {
  status
});
export const createTrackingLink = id => request(`/api/client/vehicles/${id}/tracking-link`, "POST");

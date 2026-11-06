const BASE = "http://localhost:5000/api/admin/verification";
async function request(path, method = "GET", body, signal) {
  const response = await fetch(BASE + path, {
    method,
    credentials: "include",
    signal,
    headers: body ? {
      "Content-Type": "application/json"
    } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success !== true) throw new Error(result.message || "Unable to load verification data");
  return result;
}
export const getVerificationList = (kind, filters, signal) => request(`/${kind}?${new URLSearchParams(filters)}`, "GET", undefined, signal);
export const saveVerification = (kind, id, status, reason) => request(`/${kind}/${id}`, "PATCH", {
  status,
  reason
});

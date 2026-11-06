const API_URL = "";

async function trackingRequest(sessionId, token, action, body) {
  const response = await fetch(
    `${API_URL}/api/tracking/sessions/${sessionId}/${action}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000),
    }
  );
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success !== true) {
    const error = new Error(result.message || "Tracking request failed");
    error.status = response.status;
    throw error;
  }
  return result;
}

export const startTracking = (id, token) => trackingRequest(id, token, "start");
export const stopTracking = (id, token) => trackingRequest(id, token, "stop");
export const sendLocation = (id, token, location) => trackingRequest(id, token, "location", location);

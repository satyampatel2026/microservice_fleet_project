const API_URL = "http://localhost:5000/api/admin";

export async function sendClientNotification(clientId, { title, message }) {
  const response = await fetch(
    `${API_URL}/clients/${clientId}/notifications`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, message }),
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success !== true) {
    throw new Error(data.message || "Unable to send notification");
  }

  return data;
}

export async function sendBroadcastNotification({ title, message }) {
  const response = await fetch(
    `${API_URL}/notifications/broadcast`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, message }),
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success !== true) {
    throw new Error(data.message || "Unable to send broadcast notification");
  }

  return data;
}
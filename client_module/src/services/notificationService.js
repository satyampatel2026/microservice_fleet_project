async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success !== true) {
    throw new Error(result.message || "Notification request failed");
  }

  return result;
}

export function getClientNotifications() {
  return request("/api/client/notifications");
}

export function markClientNotificationRead(notificationId) {
  return request(
    `/api/client/notifications/${notificationId}/read`,
    { method: "PATCH" }
  );
}
const API_URL ="http://localhost:5000/api/tracking/admin/vehicles";

export async function getAdminTracking(signal) {
  const response = await fetch(API_URL, {
    credentials: "include",
    cache: "no-store",
    signal,
  });

  const result = await response.json();

  if (!response.ok || result.success !== true) {
    throw new Error(
      result.message || "Unable to load vehicle tracking"
    );
  }

  return result;
}
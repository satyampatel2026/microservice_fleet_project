export async function getClientTracking(signal) {
  const response = await fetch("/api/tracking/client/vehicles", {
    credentials: "include",
    cache: "no-store",
    signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success !== true) {
    throw new Error(result.message || "Unable to load tracking map");
  }
  return result;
}

// Selected vehicle ki pichhle 24 ghante ki history.
export async function getVehicleHistory(vehicleId, signal) {
  const response = await fetch(`/api/tracking/client/vehicles/${vehicleId}/history`, {
    credentials: "include",
    cache: "no-store",
    signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]),
  });
  const result = await response.json();
  if (!response.ok || result.success !== true) throw new Error(result.message || "Unable to load vehicle history");
  return result;
}

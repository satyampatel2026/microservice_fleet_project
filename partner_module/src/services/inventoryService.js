const inventoryUrl = "http://localhost:5000/api/partners/me/inventory";

async function request(path, options = {}) {
  const response = await fetch(inventoryUrl + path, {
    ...options,
    credentials: "include",
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Inventory request failed");
  return result;
}

export async function getInventory(signal) {
  const result = await request("", { signal });
  return result.data;
}

function post(path, data) {
  return request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function createInventoryItem(item) {
  return post("", item);
}

export function addStock(itemId, quantity) {
  return post("/" + itemId + "/stock", { quantity });
}

export function usePart(requestId, itemId, quantity, operationId) {
  return post("/jobs/" + requestId + "/use-part", {
    itemId,
    quantity,
    operationId,
  });
}

export function useParts(requestId, parts) {
  return post("/jobs/" + requestId + "/use-part", { parts });
}
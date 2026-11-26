const db = require("../model/db");

function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

function readParts(body) {
  const parts = body?.parts === undefined ? [body] : body.parts;
  if (!Array.isArray(parts) || !parts.length) fail(400, "Select at least one part");
  const items = new Set();
  const operations = new Set();
  for (const part of parts) {
    if (!part || !Number.isSafeInteger(part.itemId) || part.itemId < 1 ||
        typeof part.operationId !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(part.operationId) ||
        !["number", "string"].includes(typeof part.quantity) ||
        !/^\d{1,7}(\.\d{1,3})?$/.test(String(part.quantity)) || Number(part.quantity) <= 0) {
      fail(400, "Invalid part, quantity or save ID");
    }
    if (items.has(part.itemId) || operations.has(part.operationId.toLowerCase())) fail(400, "Duplicate part or save ID");
    items.add(part.itemId);
    operations.add(part.operationId.toLowerCase());
  }
  return [...parts].sort((a, b) => a.itemId - b.itemId);
}

async function savedIds(parts, partnerId, requestId) {
  const [rows] = await db.query(
    `SELECT u.*, i.partner_id FROM job_parts_used u
     JOIN partner_inventory i ON i.item_id = u.item_id WHERE u.operation_id IN (?)`,
    [parts.map(p => p.operationId)]
  );
  if (!rows.length) return null;
  const ids = [];
  for (const part of parts) {
    const row = rows.find(r => r.operation_id.toLowerCase() === part.operationId.toLowerCase());
    if (!row || Number(row.partner_id) !== Number(partnerId) || Number(row.request_id) !== requestId ||
        Number(row.item_id) !== part.itemId || Number(row.quantity_used) !== Number(part.quantity)) {
      fail(409, "Save IDs do not match the selected parts");
    }
    ids.push(row.usage_id);
  }
  return ids;
}

async function saveParts(conn, parts, partnerId, requestId) {
  const ids = [];
  for (const part of parts) {
    const [items] = await conn.execute(
      "SELECT name, unit FROM partner_inventory WHERE item_id = ? AND partner_id = ? FOR UPDATE",
      [part.itemId, partnerId]
    );
    if (!items.length) fail(404, "Inventory item not found");
    if (items[0].unit !== "litre" && !Number.isInteger(Number(part.quantity))) fail(400, "Pieces and sets require whole quantities");
    const [entry] = await conn.execute(
      "INSERT INTO job_parts_used (request_id, item_id, quantity_used, operation_id) VALUES (?, ?, ?, ?)",
      [requestId, part.itemId, part.quantity, part.operationId]
    );
    const [stock] = await conn.execute(
      "UPDATE partner_inventory SET quantity = quantity - ? WHERE item_id = ? AND partner_id = ? AND quantity >= ?",
      [part.quantity, part.itemId, partnerId, part.quantity]
    );
    if (!stock.affectedRows) fail(409, "Insufficient stock for " + items[0].name);
    ids.push(entry.insertId);
  }
  return ids;
}

async function useJobPart(req, res) {
  try {
    const requestId = Number(req.params.requestId);
    if (!Number.isSafeInteger(requestId) || requestId < 1) fail(400, "Invalid job");
    const parts = readParts(req.body);
    const partnerId = req.partnerId;
    let ids = await savedIds(parts, partnerId, requestId);
    if (ids) return res.json({ success: true, usageId: ids[0], usageIds: ids });

    const base = process.env.CLIENT_SERVICE_URL || "http://localhost:5004";
    const key = process.env.INTERNAL_SERVICE_KEY;
    if (!key) throw new Error("Missing internal service key");
    const response = await fetch(base + "/internal/partners/" + partnerId + "/service-requests", {
      headers: { "x-internal-service-key": key }, signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error("Job lookup failed");
    const result = await response.json();
    const job = result.data.find(row => Number(row.request_id) === requestId);
    if (!job) fail(404, "Job not found");
    if (job.status !== "in_progress") fail(409, "Job must be in progress");

    let duplicate = false;
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      ids = await saveParts(conn, parts, partnerId, requestId);
      await conn.commit();
    } catch (error) {
      await conn.rollback();
      if (error.code !== "ER_DUP_ENTRY") throw error;
      duplicate = true;
    } finally {
      conn.release();
    }
    if (duplicate) {
      ids = await savedIds(parts, partnerId, requestId);
      if (!ids) fail(409, "Conflicting save ID");
    }
    return res.status(duplicate ? 200 : 201).json({ success: true, usageId: ids[0], usageIds: ids });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error("Record job parts:", error.message);
    return res.status(503).json({ message: "Unable to confirm usage. Retry the same selection." });
  }
}

module.exports = { useJobPart };

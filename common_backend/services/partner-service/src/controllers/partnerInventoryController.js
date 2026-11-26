const db = require("../model/db");

function validQuantity(value, unit) {
  const pattern = unit === "litre" ? /^\d{1,7}(\.\d{1,3})?$/ : /^\d{1,7}$/;
  return (typeof value === "number" || typeof value === "string") && pattern.test(String(value));
}

async function getInventory(req, res) {
  try {
    const [items] = await db.execute(
      "SELECT item_id, name, unit, quantity, low_stock_level FROM partner_inventory WHERE partner_id = ? ORDER BY name",
      [req.partnerId]
    );
    res.json({ data: items });
  } catch (error) {
    console.error("Load inventory:", error.message);
    res.status(500).json({ message: "Unable to load inventory" });
  }
}

async function createItem(req, res) {
  const { name, unit, quantity, lowStockLevel } = req.body || {};
  if (typeof name !== "string" || !name.trim() || name.trim().length > 100 ||
      !["piece", "set", "litre"].includes(unit) ||
      !validQuantity(quantity, unit) || !validQuantity(lowStockLevel, unit)) {
    return res.status(400).json({ message: "Check the item name, unit and quantities" });
  }
  try {
    await db.execute(
      "INSERT INTO partner_inventory (partner_id, name, unit, quantity, low_stock_level) VALUES (?, ?, ?, ?, ?)",
      [req.partnerId, name.trim(), unit, quantity, lowStockLevel]
    );
    res.status(201).json({ message: "Item added" });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "This item already exists. Use Add stock." });
    console.error("Create inventory item:", error.message);
    res.status(500).json({ message: "Unable to add item" });
  }
}

async function addStock(req, res) {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ message: "Invalid item" });
  try {
    const [items] = await db.execute(
      "SELECT unit FROM partner_inventory WHERE item_id = ? AND partner_id = ?", [id, req.partnerId]
    );
    if (!items.length) return res.status(404).json({ message: "Item not found" });
    const added = req.body?.quantity;
    if (!validQuantity(added, items[0].unit) || Number(added) <= 0) {
      return res.status(400).json({ message: "Enter a positive quantity in the item's unit" });
    }
    const [result] = await db.execute(
      `UPDATE partner_inventory SET quantity = quantity + ?
       WHERE item_id = ? AND partner_id = ? AND quantity + ? <= 9999999.999`,
      [added, id, req.partnerId, added]
    );
    if (!result.affectedRows) return res.status(409).json({ message: "Stock exceeds the maximum quantity" });
    res.json({ message: "Stock added" });
  } catch (error) {
    console.error("Add stock:", error.message);
    res.status(500).json({ message: "Unable to add stock" });
  }
}
module.exports = { getInventory, createItem, addStock };

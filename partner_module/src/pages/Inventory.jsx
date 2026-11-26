import { useRef } from "react";
import { useEffect, useState } from "react";
import Layout from "../layouts/Layout";
import { getInventory, createInventoryItem, addStock } from "../services/inventoryService";

const panel = "rounded-xl border border-slate-200 bg-white shadow-sm";
const field = "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-teal-600";
const primary = "rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50";

function StockForm({ item, onClose, onSaved }) {
  const [unit, setUnit] = useState(item?.unit || "piece");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const step = unit === "litre" ? "0.001" : "1";

  async function save(event) {
    event.preventDefault();
    if (saving) return;
    const fields = new FormData(event.currentTarget);
    setError("");
    setSaving(true);
    try {
      let result;
      if (item) {
        result = await addStock(item.item_id, fields.get("quantity"));
      } else {
        result = await createInventoryItem({
          name: fields.get("name").trim(),
          unit,
          quantity: fields.get("quantity"),
          lowStockLevel: fields.get("lowStockLevel"),
        });
      }
      onSaved(result.message);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <form className={panel + " p-4"} onSubmit={save}>
      <h2 className="font-semibold">{item ? "Add stock · " + item.name : "Add inventory item"}</h2>
      {item && <p className="mt-1 text-sm text-slate-600">Currently available: {Number(item.quantity)} ({unit})</p>}
      <fieldset disabled={saving} className="mt-3 grid max-w-3xl gap-3 text-sm sm:grid-cols-2">
        {!item && <>
          <label>Item name<input autoFocus className={field} name="name" required maxLength={100} /></label>
          <label>Unit
            <select className={field} value={unit} onChange={event => setUnit(event.target.value)}>
              <option value="piece">Piece</option>
              <option value="set">Set</option>
              <option value="litre">Litre</option>
            </select>
          </label>
        </>}
        <label>{item ? "Quantity received" : "Opening stock"}
          <input autoFocus={Boolean(item)} className={field} name="quantity" type="number" min={item ? step : 0} step={step} required />
        </label>
        {!item && <label>Low-stock level
          <input className={field} name="lowStockLevel" type="number" min="0" step={step} required />
        </label>}
      </fieldset>
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
      <div className="mt-4 flex items-center gap-4">
        <button disabled={saving} className={primary}>{saving ? "Saving…" : "Save"}</button>
        <button disabled={saving} type="button" onClick={onClose} className="text-sm text-slate-600">Cancel</button>
      </div>
    </form>
  );
}

function StockTable({ items, onAddStock, disabled }) {
  return (
    <div className={panel + " overflow-x-auto"}>
      <table className="w-full min-w-[540px] text-left text-sm">
        <thead className="bg-slate-50 text-xs text-slate-600">
          <tr>{["Item", "Available", "Low-stock level", "Status", "Action"].map(title =>
            <th key={title} className="px-4 py-3">{title}</th>
          )}</tr>
        </thead>
        <tbody>{items.map(item => {
          const low = Number(item.quantity) <= Number(item.low_stock_level);
          const badge = low ? "bg-amber-50 text-amber-800" : "bg-teal-50 text-teal-800";
          return (
            <tr key={item.item_id} className="border-t border-slate-100">
              <td className="px-4 py-3 font-semibold">{item.name}<small className="block font-normal text-slate-500">{item.unit}</small></td>
              <td className="px-4 tabular-nums">{Number(item.quantity)}</td>
              <td className="px-4 tabular-nums">{Number(item.low_stock_level)}</td>
              <td className="px-4"><span className={"rounded-full px-2 py-1 text-xs " + badge}>{low ? "Low stock" : "In stock"}</span></td>
              <td className="px-4"><button disabled={disabled} onClick={() => onAddStock(item)} className="font-medium text-teal-700 disabled:opacity-40">Add stock</button></td>
            </tr>
          );
        })}</tbody>
      </table>
    </div>
  );
}

export default function Inventory() {
  const requestedStock = useRef(new URLSearchParams(window.location.search).get("stock"));
  const [items, setItems] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      try {
        const rows = await getInventory(controller.signal);
        if (controller.signal.aborted) return;
        setItems(rows);
        if (requestedStock.current) {
          const item = rows.find(row => String(row.item_id) === requestedStock.current);
          requestedStock.current = null;
          if (item) openForm(item);
        }
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [reload]);

  function openForm(item) {
    setSelectedItem(item);
    setFormOpen(true);
    setNotice("");
  }

  function afterSave(message) {
    setNotice(message);
    setFormOpen(false);
    setReload(value => value + 1);
  }

  return (
    <Layout activePath="/partner/inventory">
      <section className="space-y-4 text-slate-800">
        <header className="flex items-center justify-between gap-3">
          <h3 className="text-2xl font-semibold tracking-tight">Inventory</h3>
          <button disabled={formOpen} className={primary} onClick={() => openForm(null)}>+ Add item</button>
        </header>
        {notice && <p role="status" className="text-sm text-teal-800">{notice}</p>}
        {formOpen && <StockForm item={selectedItem} onClose={() => setFormOpen(false)} onSaved={afterSave} />}
        {loading && <p role="status">Loading inventory…</p>}
        {error && <p role="alert" className="text-red-700">{error} <button className="underline" onClick={() => setReload(value => value + 1)}>Retry</button></p>}
        {!loading && !error && (items.length > 0
          ? <StockTable items={items} onAddStock={openForm} disabled={formOpen} />
          : <p className={panel + " p-5 text-sm text-slate-600"}>No items yet. Use Add item to record your opening stock.</p>)}
      </section>
    </Layout>
  );
}


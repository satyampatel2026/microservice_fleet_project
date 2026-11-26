import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getPartners } from "../../services/partnerService";

const base = "http://localhost:5000/api/admin/finance/payouts";
const field = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800";
const primary = "rounded-lg bg-violet-700 px-3 py-2 text-sm text-white disabled:opacity-50";
const rupees = value => Number(value).toLocaleString("en-IN", { style: "currency", currency: "INR" });

async function request(path, body) {
  const options = { credentials: "include", cache: "no-store" };
  if (body) {
    options.method = "POST";
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(body);
  }
  const response = await fetch(base + path, options);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Payout request failed");
  return result;
}

async function partnerNames() {
  const names = {};
  let page = 1;
  let pages;
  do {
    const result = await getPartners("", "", page, 100);
    for (const partner of result.data) names[partner.partner_id] = partner.business_name || partner.partner_name;
    pages = result.pagination.totalPages;
    page++;
  } while (page <= pages);
  return names;
}

export default function AdminPayouts() {
  const [rows, setRows] = useState([]);
  const [names, setNames] = useState({});
  const [filter, setFilter] = useState("pending");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const result = await request("");
        const partners = await partnerNames().catch(() => ({}));
        if (active) { setRows(result.data); setNames(partners); }
      } catch (err) {
        if (active) { setRows([]); setError(err.message); }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [refresh]);

  async function save(event) {
    event.preventDefault();
    if (saving) return;
    const form = new FormData(event.currentTarget);
    const date = new Date(form.get("date") + ":00+05:30");
    if (!Number.isFinite(date.getTime()) || date > new Date()) {
      setError("Enter a past or current transfer time in IST.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await request("/" + selected.quoteId, {
        transferReference: form.get("reference").trim(),
        transferredAt: date.toISOString(),
      });
      setSelected(null);
      setNotice("Transfer recorded for " + selected.job + ".");
      setFilter("transferred");
      setRefresh(n => n + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const visible = rows.filter(row => Boolean(row.transferredAt) === (filter === "transferred"));
  function partner(row) { return names[row.partnerId] || "Partner #" + row.partnerId; }
  const panel = "overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#171b29]";
  const muted = "text-xs text-slate-500 dark:text-slate-400";

  return <section className="mx-auto max-w-5xl space-y-4 text-slate-900 dark:text-slate-100">
    <Link to="/admin/settings" className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium !text-slate-700 !no-underline hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-violet-500 dark:border-slate-600 dark:bg-slate-800 dark:!text-slate-100 dark:hover:bg-slate-700">← Back</Link>
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <h3 className="text-2xl font-semibold tracking-tight">Partner payouts</h3>
        <span className="rounded-md bg-amber-100 px-2 py-1 text-xs text-amber-900">Test mode</span>
      </div>
      <button className={field} disabled={loading || Boolean(selected)} onClick={() => setRefresh(n => n + 1)}>Refresh</button>
    </header>

    {selected && <form onSubmit={save} className={panel}>
      <div className="border-b border-slate-200 px-5 py-4 dark:border-white/10">
        <h2 className="font-semibold">New payout entry</h2>
        <p className={muted}>Record the details of the transfer made to this partner.</p>
      </div>
      <div className="grid gap-4 bg-slate-50 px-5 py-4 sm:grid-cols-[1fr_1fr_auto] dark:bg-white/5">
        <div><p className={muted}>Payee</p><strong>{partner(selected)}</strong></div>
        <div><p className={muted}>Service job</p><b>{selected.job}</b><p className={muted}>{selected.vehicle} · {selected.service}</p></div>
        <div><p className={muted}>Partner amount</p><strong className="text-xl tabular-nums">{rupees(selected.amount)}</strong></div>
      </div>
      <fieldset disabled={saving} className="grid gap-4 px-5 py-4 text-sm sm:grid-cols-2">
        <label className="grid content-start gap-1">Transfer reference
          <input autoFocus required maxLength={100} name="reference" className={field} aria-describedby="reference-help"/>
          <small id="reference-help" className={muted}>Bank transaction reference or UPI UTR.</small>
        </label>
        <label className="grid content-start gap-1">Transfer date &amp; time (IST)
          <input type="datetime-local" required name="date" className={field}/>
        </label>
      </fieldset>
      {error && <p role="alert" className="px-5 pb-3 text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3 dark:border-white/10">
        <button type="button" className={field} disabled={saving} onClick={() => { setSelected(null); setError(""); }}>Cancel</button>
        <button className={primary} disabled={saving}>{saving ? "Saving…" : "Save payout entry"}</button>
      </div>
    </form>}

    {notice && <p role="status" className="text-sm text-teal-700 dark:text-teal-300">{notice}</p>}
    {!selected && error && <p role="alert">{error}</p>}
    <section className={panel}>
      <header className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <h3 className="font-semibold">Payout register</h3>
        <select aria-label="Payout status" className={field} value={filter} disabled={Boolean(selected)}
          onChange={e => { setFilter(e.target.value); setNotice(""); }}>
          <option value="pending">Awaiting payout</option><option value="transferred">Transferred</option>
        </select>
      </header>
      {loading ? <p className="p-4" role="status">Loading payouts…</p> :
        <div className="overflow-x-auto"><table className="w-full min-w-[570px] text-left text-sm">
          <thead className="bg-slate-50 text-xs dark:bg-white/5"><tr>
            {["Partner / Job", "Vehicle / Service", "Partner amount", filter === "pending" ? "Entry" : "Transfer details"].map(h =>
              <th key={h} className="px-4 py-2">{h}</th>)}
          </tr></thead>
          <tbody>{visible.map(row => <tr key={row.quoteId} className="border-t border-slate-200 dark:border-white/10">
            <td className="px-4 py-3"><b>{partner(row)}</b><p className={muted}>{row.job}</p></td>
            <td className="px-4">{row.vehicle}<p className={muted}>{row.service}</p></td>
            <td className="px-4 font-medium tabular-nums">{rupees(row.amount)}</td>
            <td className="px-4">{row.transferredAt ? <>
              <span className="font-mono text-xs">{row.reference}</span>
              <p className={muted}>{new Date(row.transferredAt).toLocaleString("en-IN", {timeZone:"Asia/Kolkata"})} IST</p>
            </> : <button className={primary} disabled={Boolean(selected)}
              onClick={() => {setSelected(row); setError(""); setNotice("");}}>Record transfer</button>}</td>
          </tr>)}</tbody>
        </table>{!visible.length && !error && <p className="p-4 text-sm">No entries for this status.</p>}</div>}
    </section>
  </section>;
}

import Chart from "react-apexcharts";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Wrench, Wallet, Package, ArrowUpRight, RefreshCw } from "lucide-react";
import Layout from "../layouts/Layout";
import { getMyAssignedJobs } from "../services/partnerService";
import { getInventory } from "../services/inventoryService";

const panel = "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5";
const link = "inline-flex items-center gap-1 text-sm font-semibold !text-teal-700 !no-underline hover:!underline";
const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
const money = paise => currency.format(paise / 100);
const dayKey = new Intl.DateTimeFormat("en-CA", {
  year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Kolkata",
});

function PageLink({ to, children }) {
  return <Link className={link} to={to}>{children}<ArrowUpRight size={15} /></Link>;
}

function Metric({ label, value, icon: Icon, to }) {
  return <Link to={to} className={panel + " !text-slate-800 !no-underline hover:border-teal-400"}>
    <div className="flex items-center justify-between gap-2 text-sm text-slate-600">{label}<Icon size={17} /></div>
    <strong className="mt-2 block text-2xl tabular-nums">{value}</strong>
  </Link>;
}

function PayoutSummary({ jobs, verified }) {
  const totals = { pendingWork: 0, awaiting: 0, transferred: 0 };
  let valid = verified;
  for (const job of jobs) {
    if (!job.can_start) continue;
    const paise = job.transferredAt ? Number(job.transferredPaise) : Math.round(Number(job.partner_amount) * 100);
    if (!Number.isSafeInteger(paise) || paise <= 0) { valid = false; continue; }
    if (job.transferredAt) totals.transferred += paise;
    else if (job.status === "completed") totals.awaiting += paise;
    else totals.pendingWork += paise;
  }
  const labels = ["Awaiting payout", "Transferred", "Work pending"];
  const colors = ["#d59930", "#147970", "#7790a2"];
  const amounts = [totals.awaiting, totals.transferred, totals.pendingWork];
  const options = {
    chart: { sparkline: { enabled: true }, fontFamily: "inherit" },
    labels, colors, legend: { show: false }, dataLabels: { enabled: false },
    stroke: { width: 2, colors: ["#fff"] },
    plotOptions: { pie: { donut: { size: "77%" } } },
    tooltip: { y: { formatter: value => money(value) } },
  };
  return <section className={panel + " min-w-0 self-start"}>
    <div className="flex items-center justify-between gap-2">
      <h2 className="!mb-0 !text-base font-semibold">Earnings &amp; payouts</h2>
      <PageLink to="/partner/payments">Details</PageLink>
    </div>
    <p className="mb-2 text-xs text-slate-500">All time · Test mode</p>
    {!valid ? <p className="text-sm text-slate-500">Payment totals unavailable.</p> :
      <div className="flex flex-wrap items-center gap-4">
        {amounts.some(value => value > 0)
          ? <Chart type="donut" options={options} series={amounts} width={112} height={112}/>
          : <p className="text-sm text-slate-500">No verified payments yet.</p>}
        <dl className="m-0 min-w-36 flex-1 space-y-2">
          {labels.map((label, i) => <div key={label} className="flex items-center justify-between gap-2 text-xs">
            <dt className="flex items-center gap-2 font-normal text-slate-600">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors[i] }}/>{label}
            </dt>
            <dd className="m-0 font-semibold tabular-nums">{money(amounts[i])}</dd>
          </div>)}
        </dl>
      </div>}
  </section>;
}

function Activity({ jobs }) {
  const [days, setDays] = useState(7);
  const counts = new Map();
  const today = Date.parse(dayKey.format(new Date()) + "T00:00:00Z");
  for (let offset = days - 1; offset >= 0; offset--) {
    const key = new Date(today - offset * 86400000).toISOString().slice(0, 10);
    counts.set(key, 0);
  }
  for (const job of jobs) {
    if (job.status !== "completed" || job.completed_at_ms == null) continue;
    const date = new Date(Number(job.completed_at_ms));
    if (!Number.isFinite(date.getTime())) continue;
    const key = dayKey.format(date);
    if (counts.has(key)) counts.set(key, counts.get(key) + 1);
  }
  const entries = Array.from(counts);
  const values = entries.map(([, count]) => count);
  const total = values.reduce((sum, count) => sum + count, 0);
  const undated = jobs.filter(job => job.status === "completed" && job.completed_at_ms == null).length;
  const categories = entries.map(([key]) => new Date(key + "T12:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric", month: "short", timeZone: "Asia/Kolkata",
  }));
  const options = { 
    chart: { toolbar: { show: false }, fontFamily: "inherit", zoom: { enabled: false } },
    colors: ["#147970"], grid: { borderColor: "#e3ebe8", strokeDashArray: 3 },
    plotOptions: { bar: { borderRadius: 4, columnWidth: days === 7 ? "38%" : "65%" } },
    dataLabels: { enabled: false },
    xaxis: { categories, tickAmount: 6, axisTicks: { show: false } },
    yaxis: { min: 0, decimalsInFloat: 0, forceNiceScale: true },
  };
  return <section className={panel + " min-w-0"}>
    <div className="flex items-center justify-between gap-2">
      <h2 className="!mb-0 !text-base font-semibold">Workshop activity</h2>
      <select aria-label="Activity period" className="rounded-lg border px-2 py-1 text-xs"
        value={days} onChange={event => setDays(Number(event.target.value))}>
        <option value={7}>Last 7 days</option><option value={30}>Last 30 days</option>
      </select>
    </div>
    <p className="mb-0 mt-1 text-sm text-slate-600">{total} completed {total === 1 ? "job" : "jobs"} in this period</p>
    {total > 0 ? <Chart type="bar" height={160} options={options} series={[{ name: "Completed jobs", data: values }]}/>
      : <p className="my-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">No dated completions in the selected period.</p>}
    {undated > 0 && <p className="mb-0 text-xs text-amber-800">Completed jobs with no recorded date: {undated}.</p>}
  </section>;
}

function jobStage(job) {
  if (job.status === "in_progress") return "In service";
  if (job.can_start) return "Paid · Awaiting start";
  if (!Number(job.has_active_quote)) return "Estimate required";
  return "Quote submitted";
}

export default function Dashboard() {
  const [jobs, setJobs] = useState(null);
  const [items, setItems] = useState(null);
  const [errors, setErrors] = useState({});
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      const [work, stock] = await Promise.allSettled([getMyAssignedJobs(), getInventory(controller.signal)]);
      if (!active) return;
      setJobs(work.status === "fulfilled" ? work.value.data : null);
      setItems(stock.status === "fulfilled" ? stock.value : null);
      setErrors({ jobs: work.status === "rejected", inventory: stock.status === "rejected" });
      setLoading(false);
    }
    load();
    return () => { active = false; controller.abort(); };
  }, [refresh]);

  const work = jobs || [];
  const assigned = work.filter(job => job.status === "assigned");
  const quotes = assigned.filter(job => !Number(job.has_active_quote));
  const verified = jobs !== null && work.every(job => job.payment_status_available !== false);
  const paid = assigned.filter(job => job.can_start);
  const ongoing = work.filter(job => job.status === "in_progress");
  const queue = [...quotes, ...paid, ...ongoing, ...assigned.filter(job => Number(job.has_active_quote) && !job.can_start)];
  const low = (items || []).filter(item => Number(item.quantity) <= Number(item.low_stock_level))
    .sort((a, b) => Number(a.quantity) - Number(b.quantity));

  return <Layout activePath="/dashboard"><main className="mx-auto max-w-7xl space-y-4 text-slate-800">
    <header className="flex items-center justify-between gap-2">
      <h3 className="text-2xl font-semibold tracking-tight">Garage overview</h3>
      <div className="flex flex-wrap items-center gap-3"><PageLink to="/partner/jobs">Open job cards</PageLink>
      <button disabled={loading} onClick={() => setRefresh(n => n + 1)} className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm disabled:opacity-50">
        <RefreshCw size={14}/>{loading ? "Loading…" : "Refresh"}
      </button>
      </div>
    </header>
    {errors.jobs && <p role="alert">Job data unavailable. Use Refresh to retry.</p>}
    {errors.inventory && <p role="alert">Inventory unavailable. Use Refresh to retry.</p>}
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Metric label="Quotes to send" value={jobs ? quotes.length : "—"} icon={ClipboardList} to="/partner/jobs"/>
      <Metric label="Paid · Awaiting start" value={verified ? paid.length : "—"} icon={Wallet} to="/partner/jobs"/>
      <Metric label="In service" value={jobs ? ongoing.length : "—"} icon={Wrench} to="/partner/jobs"/>
      <Metric label="Low-stock items" value={items ? low.length : "—"} icon={Package} to="/partner/inventory"/>
    </div>

    {jobs && <section className={panel}>
      <div className="flex items-center justify-between gap-2"><h4 className="font-semibold">Jobs needing action</h4><PageLink to="/partner/jobs">View all jobs</PageLink></div>
      {queue.length === 0 ? <p className="mt-4 text-sm text-slate-500">No open jobs.</p> :
      <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[440px] text-left text-sm">
        <thead className="bg-slate-50 text-xs text-slate-600"><tr>{["Vehicle / Job", "Service", "Current stage", "Action"].map(h => <th key={h} className="p-2">{h}</th>)}</tr></thead>
        <tbody>{queue.slice(0, 5).map(job => <tr key={job.request_id} className="border-t border-slate-100">
          <td className="p-2"><strong>{job.vehicle_number}</strong><small className="block text-slate-500">{job.request_code}</small></td>
          <td className="p-2">{job.service_name}</td><td className="p-2">{jobStage(job)}</td>
          <td className="p-2"><PageLink to={"/partner/jobs?request=" + job.request_id + (jobStage(job) === "Estimate required" ? "&action=quote" : "")}>
            {jobStage(job) === "Estimate required" ? "Send quote" : "Open job"}
          </PageLink></td>
        </tr>)}</tbody></table></div>}
    </section>}
    <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr_1fr]">
      {jobs && <Activity jobs={jobs}/>}
      {items && <section className={panel}>
        <div className="flex items-center justify-between"><h4 className="font-semibold">Inventory alerts</h4><PageLink to="/partner/inventory">Inventory</PageLink></div>
        {low.length === 0 && <p className="mt-4 text-sm text-slate-500">No low-stock items.</p>}
        {low.slice(0, 5).map(item => <div key={item.item_id} className="flex items-center justify-between gap-2 border-b border-slate-100 py-3 text-sm">
          <span>{item.name}</span><span className="rounded bg-amber-50 px-2 py-1 text-amber-900">{Number(item.quantity)} {item.unit} left</span><PageLink to={"/partner/inventory?stock=" + item.item_id}>Add stock</PageLink>
        </div>)}
      </section>}
    {jobs && <PayoutSummary jobs={jobs} verified={verified}/>}
    </div>

  </main></Layout>;
}
import { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { getTrips } from "../../services/tripService";
import { getVehicles } from "../../services/vehicleService";
import { getMyServiceRequests } from "../../services/serviceRequestService";
import { paymentReceiptUrl } from "../../services/paymentService";

const panel = "rounded-xl border border-white/10 bg-[#141824] p-4";
const control = "rounded-md border border-white/15 bg-[#191e2d] px-3 py-2 text-sm";
const dayFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
});
const money = paise => (paise / 100).toLocaleString("en-IN", { style: "currency", currency: "INR" });

function monthRange(previous = false) {
  const [year, month] = dayFormat.format(new Date()).split("-").map(Number);
  const index = month - 1 - Number(previous);
  return {
    from: dayFormat.format(Date.UTC(year, index, 1)),
    to: dayFormat.format(Date.UTC(year, index + 1, 0)),
  };
}

function duration(minutes) {
  if (minutes == null) return "—";
  return Math.floor(minutes / 60) + "h " + minutes % 60 + "m";
}

function tripRow(trip) {
  const start = Date.parse(trip.actual_start);
  const end = Date.parse(trip.actual_end);
  return {
    id: trip.trip_id, vehicle: String(trip.vehicle_id), plate: trip.vehicle_number,
    day: dayFormat.format(end), driver: trip.driver_name,
    route: trip.start_location + " → " + trip.end_location,
    start: trip.actual_start, end: trip.actual_end,
    minutes: Number.isFinite(start) && end >= start ? Math.round((end - start) / 60000) : null,
  };
}

async function loadExpenses(signal) {
  const result = await getMyServiceRequests(signal);
  const rows = [];
  for (const request of result.data) {
    if (!request.paidOrderId) continue;
    const url = paymentReceiptUrl(request.paidOrderId);
    const response = await fetch(url + "?format=json", { credentials: "include", signal });
    if (!response.ok) throw new Error("Unable to load payment details");
    const payment = await response.json();
    rows.push({
      id: request.paidOrderId, vehicle: String(request.vehicle_id), plate: request.vehicle_number,
      day: dayFormat.format(new Date(payment.paymentDate)), amount: payment.amountPaise,
      service: request.service_name, code: request.request_code, receipt: url,
    });
  }
  return rows;
}

function downloadCsv(headers, rows, filename) {
  function escapeCell(value) {
    let text = String(value ?? "");
    if (/^\s*[=+@-]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  }
  const lines = [headers, ...rows].map(row => row.map(escapeCell).join(","));
  const url = URL.createObjectURL(new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function stamp(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "short", timeStyle: "short" });
}

export default function ClientReports() {
  const [tab, setTab] = useState("trips");
  const [period, setPeriod] = useState("this");
  const [range, setRange] = useState(monthRange);
  const [vehicle, setVehicle] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [records, setRecords] = useState({});
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const trips = tab === "trips";
  const data = records[tab];

  useEffect(() => {
    if (data) return;
    const controller = new AbortController();
    async function load() {
      try {
        const [fleet, rows] = await Promise.all([
          getVehicles(),
          trips ? getTrips().then(result => result.data
            .filter(t => t.status === "completed" && Number.isFinite(Date.parse(t.actual_end)))
            .map(tripRow)) : loadExpenses(controller.signal),
        ]);
        if (controller.signal.aborted) return;
        setVehicles(fleet.data);
        setRecords(current => ({ ...current, [tab]: rows }));
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message);
      }
    }
    load();
    return () => controller.abort();
  }, [tab, trips, data, retry]);

  function selectPeriod(value) {
    setPeriod(value);
    if (value !== "custom") setRange(monthRange(value === "last"));
  }

  const valid = range.from && range.to && range.from <= range.to;
  const rows = (data || []).filter(row => valid && row.day >= range.from && row.day <= range.to &&
    (!vehicle || row.vehicle === vehicle)).sort((a, b) => b.day.localeCompare(a.day));
  const used = new Set(rows.map(row => row.vehicle)).size;
  const timed = rows.filter(row => row.minutes != null);
  const average = timed.length ? Math.round(timed.reduce((sum, row) => sum + row.minutes, 0) / timed.length) : null;
  const total = rows.reduce((sum, row) => sum + (row.amount || 0), 0);
  const summary = trips ? [["Completed trips", rows.length], ["Vehicles used", used], ["Avg. trip duration", duration(average)]]
    : [["Total paid", money(total)], ["Paid receipts", rows.length], ["Vehicles with payments", used]];

  const groups = new Map();
  for (const row of rows) {
    const key = trips ? row.day : vehicle ? row.service : row.plate;
    groups.set(key, (groups.get(key) || 0) + (trips ? 1 : row.amount));
  }
  const bars = Array.from(groups);
  if (trips) bars.sort((a, b) => a[0].localeCompare(b[0]));
  else bars.sort((a, b) => b[1] - a[1]);
  const headers = trips ? ["Date (IST)", "Vehicle", "Driver", "Route", "Start (IST)", "End (IST)", "Duration"]
    : ["Date (IST)", "Vehicle", "Service", "Request", "Amount (INR)"];
  function cells(row) {
    return trips ? [row.day, row.plate, row.driver, row.route, stamp(row.start), stamp(row.end), duration(row.minutes)]
      : [row.day, row.plate, row.service, row.code, (row.amount / 100).toFixed(2)];
  }

  return <div className="space-y-4 text-slate-100">
    <h1 className="text-2xl font-semibold">Reports</h1>
    <div className="flex gap-5 border-b border-white/10">
      {[["trips", "Trip report"], ["expenses", "Service & expenses"]].map(([id, title]) =>
        <button key={id} aria-pressed={tab === id} onClick={() => { setError(""); setTab(id); }}
          className={"border-b-2 pb-2 text-sm " + (tab === id ? "border-violet-400 text-violet-300" : "border-transparent")}>{title}</button>)}
    </div>
    <div className="flex flex-wrap items-end gap-3">
      <label className="grid gap-1 text-xs">Period<select className={control} value={period} onChange={e => selectPeriod(e.target.value)}>
        <option value="this">This month</option><option value="last">Last month</option><option value="custom">Custom range</option></select></label>
      {period === "custom" && ["from", "to"].map(key => <label key={key} className="grid gap-1 text-xs capitalize">{key}
        <input className={control} type="date" value={range[key]} onChange={e => setRange({ ...range, [key]: e.target.value })} /></label>)}
      <label className="grid gap-1 text-xs">Vehicle<select className={control} value={vehicle} onChange={e => setVehicle(e.target.value)}>
        <option value="">All vehicles</option>{vehicles.map(v => <option key={v.vehicle_id} value={v.vehicle_id}>{v.vehicle_number}</option>)}</select></label>
      <button className={control + " disabled:opacity-40"} disabled={!rows.length} onClick={() =>
        downloadCsv(headers, rows.map(cells), tab + "-" + range.from + "-" + range.to + ".csv")}>Download CSV</button>
    </div>
    <p className="text-xs text-slate-400">{trips ? "Based on trip completion date" : "Based on payment transaction date"} · IST</p>
    {error ? <p role="alert">{error} <button className="underline" onClick={() => { setError(""); setRetry(retry + 1); }}>Retry</button></p>
      : !valid ? <p>Select a valid date range.</p> : !data ? <p>Loading report…</p> : <>
      <div className={panel + " grid gap-3 sm:grid-cols-3"}>{summary.map(([label, value]) =>
        <div key={label}><p className="text-xs text-slate-400">{label}</p><strong className="text-xl">{value}</strong></div>)}</div>
      {rows.length > 0 && <section className={panel}>
        <h2>{trips ? "Completed trips by day" : vehicle ? "Spend by service" : "Spend by vehicle"}</h2>
        <Chart type="bar" height={trips ? 220 : Math.max(160, bars.length * 32)} options={{
          theme: { mode: "dark" }, chart: { background: "transparent", toolbar: { show: false } },
          colors: ["#a78bfa"], dataLabels: { enabled: false }, grid: { borderColor: "#34394a" },
          plotOptions: { bar: { horizontal: !trips, borderRadius: 3 } },
          xaxis: { categories: bars.map(item => item[0]) },
        }} series={[{ name: trips ? "Trips" : "Paid (₹)", data: bars.map(item => trips ? item[1] : item[1] / 100) }]} />
      </section>}
      <section className={panel}>
        <h2>{trips ? "Trip details" : "Payment history"}</h2>
        {!rows.length ? <p className="mt-3 text-sm text-slate-400">No matching records for this period and vehicle.</p> :
          <div className="mt-3 overflow-x-auto"><table className={"w-full text-left text-sm " + (!trips ? "hidden sm:table" : "")}>
            <thead><tr>{headers.map(h => <th key={h} className="p-2">{h}</th>)}{!trips && <th>Receipt</th>}</tr></thead>
            <tbody>{rows.map(row => <tr key={row.id} className="border-t border-white/10">
              {cells(row).map((v, i) => <td key={i} className="p-2">{v}</td>)}
              {!trips && <td><a className="text-violet-300" href={row.receipt}>Download</a></td>}
            </tr>)}</tbody></table>
            {!trips && <div className="sm:hidden">{rows.map(row => <div key={row.id} className="border-t border-white/10 py-3">
              <div className="flex justify-between"><b>{row.plate}</b>{money(row.amount)}</div>
              <p className="text-xs text-slate-400">{row.service} · {row.day}</p>
              <a href={row.receipt} className="text-sm text-violet-300">Download receipt</a>
            </div>)}</div>}
          </div>}
      </section>
    </>}
  </div>;
}

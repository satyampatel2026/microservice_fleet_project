import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Chart from "react-apexcharts";
import Swal from "sweetalert2";
import { Truck, ShieldCheck, Users, Wrench } from "lucide-react";
import { getVehicles } from "../../services/vehicleService";
import { getDrivers } from "../../services/driverService";
import { getTrips } from "../../services/tripService";
import { getClientTracking } from "../../services/trackingMapService";
import { getMyServiceRequests } from "../../services/serviceRequestService";
import { payForQuote, getPaidOrderWorkshop } from "../../services/paymentService";

const panel = "min-w-0 rounded-xl border border-white/10 bg-[#141824] p-4";
const link = "text-sm font-medium text-violet-300 hover:underline";
const chartStyle = {
  chart: { background: "transparent", toolbar: { show: false }, fontFamily: "inherit" },
  theme: { mode: "dark" },
  dataLabels: { enabled: false },
};

function Metric({ title, value, note, to, icon: Icon }) {
  return <Link to={to} className={panel + " hover:border-violet-400/60"}>
    <span className="flex items-center justify-between text-sm text-slate-300">{title}<Icon size={16} /></span>
    <strong className="mt-1 block text-2xl">{value}</strong>
    <span className="text-xs text-slate-400">{note}</span>
  </Link>;
}

function TripActivity({ trips }) {
  const [days, setDays] = useState(7);
  const counts = new Map();
  const dateLabel = date => date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  for (let offset = days - 1; offset >= 0; offset--) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    counts.set(dateLabel(date), 0);
  }
  for (const trip of trips) {
    if (trip.status !== "completed" || !trip.actual_end) continue;
    const day = dateLabel(new Date(trip.actual_end));
    if (counts.has(day)) counts.set(day, counts.get(day) + 1);
  }
  const values = Array.from(counts.values());
  const options = {
    ...chartStyle, colors: ["#a78bfa"],
    plotOptions: { bar: { borderRadius: 3, columnWidth: "48%" } },
    grid: { borderColor: "#34394a", strokeDashArray: 4 },
    xaxis: { categories: Array.from(counts.keys()), tickAmount: 6, labels: { formatter: value => String(value).split(" ").slice(0, 2).join(" ") } },
    yaxis: { min: 0, decimalsInFloat: 0, forceNiceScale: true },
  };
  return <section className={panel}>
    <div className="flex items-start justify-between gap-2">
      <div><h2 className="font-semibold">Trip activity</h2>
        <p className="text-sm text-slate-400">{values.reduce((sum, n) => sum + n, 0)} completed trips</p></div>
      <select aria-label="Trip period" value={days} onChange={e => setDays(Number(e.target.value))}
        className="rounded-md border border-white/15 bg-[#191e2d] px-2 py-1 text-sm">
        <option value={7}>Last 7 days</option><option value={30}>Last 30 days</option>
      </select>
    </div>
    <Chart type="bar" height={215} options={options} series={[{ name: "Completed trips", data: values }]} />
  </section>;
}

function LiveFleet({ vehicles, tracking }) {
  const byId = new Map(tracking.map(row => [row.vehicle_id, row]));
  const counts = [0, 0, 0, 0];
  for (const vehicle of vehicles) {
    const row = byId.get(vehicle.vehicle_id);
    const speed = row?.lastLocation?.speed;
    if (row?.trackingStatus !== "online") counts[3]++;
    else if (!Number.isFinite(speed) || speed < 0) counts[2]++;
    else if (speed > 0) counts[0]++;
    else counts[1]++;
  }
  const labels = ["Moving", "Stopped", "Live · speed unknown", "No live signal"];
  const colors = ["#2dd4bf", "#fbbf24", "#60a5fa", "#64748b"];
  const options = { ...chartStyle, labels, colors, stroke: { width: 0 },
    legend: { show: false }, plotOptions: { pie: { donut: { size: "74%" } } } };
  return <section className={panel}>
    <h2 className="font-semibold">Live fleet status</h2>
    <p className="text-sm text-slate-400">{vehicles.length - counts[3]} of {vehicles.length} vehicles reporting</p>
    <div className="flex flex-wrap items-center justify-around gap-2">
      {vehicles.length > 0 && <Chart type="donut" width={155} height={155} series={counts} options={options} />}
      <ul className="min-w-36 flex-1 space-y-2 text-sm">{labels.map((label, i) =>
        <li key={label} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: colors[i] }} />
          {label}<b className="ml-auto">{counts[i]}</b>
        </li>)}</ul>
    </div>
    <Link className={link} to="/client/tracking">Open live map →</Link>
  </section>;
}

function Attention({ requests, reload }) {
  const lock = useRef(false);
  const [busy, setBusy] = useState(null);
  const rows = requests.filter(row =>  row.status === "pending" || row.status === "assigned" );
  function getUpdateText(row) {
  if (row.status === "pending") return "Awaiting partner assignment";
  if (row.paidOrderId) return "Paid · Awaiting vehicle drop-off";
  if (row.acceptedQuoteId) return "Quote accepted · Payment pending";
  if (row.pendingQuoteId) return "Quote ready for review";

  return "Partner assigned · Awaiting estimate";
  }
  async function act(row) {
    if (lock.current) return;
    lock.current = true;
    setBusy(row.request_id);
    try {
      if (row.paidOrderId) {
        const garage = await getPaidOrderWorkshop(row.paidOrderId);
        await Swal.fire({ title: "Vehicle drop-off", text: "Please take your vehicle to " + garage.businessName + ". Address: " + garage.businessAddress });
      } else {
        const payment = await payForQuote(row.acceptedQuoteId);
        await Swal.fire({ title: payment.status === "paid" ? "Payment confirmed" : "Payment not confirmed", text: row.vehicle_number });
        reload();
      }
    } catch (err) {
      await Swal.fire({ icon: "error", title: "Unable to complete action", text: err.message });
    } finally {
      lock.current = false;
      setBusy(null);
    }
  }
  return (
  <section className={panel}>
    <div className="flex items-center justify-between gap-3">
      <h2 className="font-semibold">Service updates</h2>

      <Link to="/client/services" className={link}>
        All services
      </Link>
    </div>

    {rows.length === 0 && (
      <p className="mt-3 text-sm text-slate-400">
        No requests awaiting assignment, quote or drop-off.
      </p>
    )}

    {rows.slice(0, 5).map(row => (
      <div
        key={row.request_id}
        className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3"
      >
        <div>
          <p className="text-sm">
            <strong>{row.vehicle_number}</strong> · {row.service_name}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {getUpdateText(row)}
          </p>
        </div>

        {row.status === "assigned" && (row.paidOrderId || row.acceptedQuoteId) ? (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => act(row)}
            className={link + " disabled:opacity-50"}
          >
            {busy === row.request_id
              ? "Processing…"
              : row.paidOrderId
                ? "Garage details"
                : "Pay now"}
          </button>
        ) : row.status === "assigned" && row.pendingQuoteId ? (
          <Link
            to={"/client/services?request=" + encodeURIComponent(
              row.request_code || row.vehicle_number
            )}
            className={link}
          >
            Review quote →
          </Link>
        ) : null}
      </div>
    ))}
  </section>
);
}

export default function ClientDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  function reload() { setRefresh(value => value + 1); }

  useEffect(() => {
    let active = true;
    let timer;
    const controller = new AbortController();
    async function load() {
      try {
        const [vehicles, drivers, trips, tracking, services] = await Promise.all([
          getVehicles(), getDrivers(), getTrips(), getClientTracking(controller.signal), getMyServiceRequests(controller.signal),
        ]);
        if (active) {
          setData({ vehicles: vehicles.data, drivers: drivers.data, trips: trips.data,tracking: tracking.data, services: services.data });
          setError("");
        }
      } catch (err) {
        if (active) setError(err.message || "Unable to load fleet overview");
      } finally {
        if (active) timer = setTimeout(load, 15000);
      }
    }
    load();
    return () => { active = false; controller.abort(); clearTimeout(timer); };
  }, [refresh]);

  if (error) return <div role="alert">{error} <button className={link} onClick={reload}>Retry</button></div>;
  if (!data) return <p role="status">Loading fleet overview…</p>;
  const { vehicles, drivers, trips, tracking, services } = data;
  const verified = vehicles.filter(v => v.approval_status === "verified").length;
  const pending = vehicles.filter(v => v.approval_status === "pending").length;
  const open = services.filter(r => ["pending", "assigned", "in_progress"].includes(r.status));
  const recent = [...trips].sort((a, b) => b.trip_id - a.trip_id).slice(0, 5);
  return <div className="space-y-4 text-slate-100">
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      <Metric title="Total vehicles" icon={Truck} value={vehicles.length} note={vehicles.length ? "View vehicles" : "Add your first vehicle"} to="/client/vehicles" />
      <Metric title="Verified vehicles" icon={ShieldCheck} value={verified + " / " + vehicles.length} note={pending + " awaiting review"} to="/client/vehicles" />
      <Metric title="Total drivers" icon={Users} value={drivers.length} note="View drivers" to="/client/drivers" />
      <Metric title="Active services" icon={Wrench} value={open.length} note="View requests" to="/client/services" />
    </div>
    <div className="flex flex-col gap-4">
      <div className="order-2 grid gap-4 lg:order-1 lg:grid-cols-[3fr_2fr]">
        <TripActivity trips={trips} /><LiveFleet vehicles={vehicles} tracking={tracking} />
      </div>
      <div className="order-1 lg:order-2"><Attention requests={services} reload={reload} /></div>
    </div>
    <section className={panel}>
      <div className="flex justify-between"><h2 className="font-semibold">Recent trips</h2><Link className={link} to="/client/trips">View trips →</Link></div>
      {!recent.length ? <p className="mt-3 text-sm text-slate-400">No trips yet.</p> :
        <div className="overflow-x-auto"><table className="mt-3 w-full min-w-[540px] text-left text-sm">
          <thead className="text-slate-400"><tr>{["Vehicle", "Driver", "Route", "Status"].map(title => <th key={title}>{title}</th>)}</tr></thead>
          <tbody>{recent.map(trip => <tr key={trip.trip_id} className="border-t border-white/10">
            <td className="py-2">{trip.vehicle_number}</td><td>{trip.driver_name}</td>
            <td>{trip.start_location} → {trip.end_location}</td><td className="capitalize">{trip.status}</td>
          </tr>)}</tbody></table></div>}
    </section>
  </div>;
}

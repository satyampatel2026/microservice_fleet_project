import { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { getClients } from "../../services/clientService";
import { getPartners } from "../../services/partnerService";
import { Link, useOutletContext } from "react-router-dom";
import DashboardHeader from "../../components/admin/dashboard/DashboardHeader";
import { getPendingServiceRequests } from "../../services/serviceRequestService";

const card = "rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-[#171b29]";
const muted = "text-sm text-slate-600 dark:text-slate-300";
const statuses = [
  ["pending", "Pending", "#e6aa45"],
  ["assigned", "Assigned", "#7094dc"],
  ["in_progress", "In progress", "#48a89b"],
  ["completed", "Completed", "#9777dc"],
  ["cancelled", "Cancelled", "#8992a6"],
];

function Metric({ label, value }) {
  return <div className={card}>
    <p className={muted}>{label}</p>
    <strong className="mt-0.5 block text-xl leading-tight tabular-nums">{value}</strong>
  </div>;
}

function buildMonths(requests) {
  const today = new Date();
  const months = [];
  for (let offset = 5; offset >= 0; offset--) {
    const date = new Date(today.getFullYear(), today.getMonth() - offset, 1);
    months.push({
      year: date.getFullYear(),
      month: date.getMonth(),
      label: date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
      requests: 0,
      paid: 0,
      amountPaise: 0,
      paymentAvailable: true,
    });
  }

  for (const row of requests) {
    const date = new Date(row.created_at);
    const month = months.find(item => item.year === date.getFullYear() && item.month === date.getMonth());
    if (!month) continue;
    month.requests++;
    if (row.paymentStatus === "unavailable") month.paymentAvailable = false;
    if (row.paymentStatus === "paid") {
      month.paid++;
      month.amountPaise += Math.round(Number(row.approved_amount) * 100);
    }
  }
  return months;
}

function ChartCard({ title, description, children }) {
  return <section className={card + " min-w-0"}>
    <h2 className="text-base font-semibold">{title}</h2>
    <p className={muted}>{description}</p>
    <div className="mt-3">{children}</div>
  </section>;
}

function DashboardCharts({ requests, dark }) {
  const months = buildMonths(requests);
  const common = {
    chart: { background: "transparent", toolbar: { show: false }, fontFamily: "inherit" },
    theme: { mode: dark ? "dark" : "light" },
    dataLabels: { enabled: false },
    grid: { borderColor: dark ? "#35394b" : "#e4e7ef", strokeDashArray: 4 },
  };
  const xaxis = { categories: months.map(month => month.label) };
  const donut = {
    ...common,
    labels: statuses.map(status => status[1]),
    colors: statuses.map(status => status[2]),
    stroke: { width: 0 },
    legend: { position: "bottom" },
    plotOptions: { pie: { donut: { size: "73%" } } },
  };
  const bars = {
    ...common, xaxis, colors: ["#8970dd"],
    plotOptions: { bar: { borderRadius: 4, columnWidth: "48%" } },
    yaxis: { min: 0, forceNiceScale: true, decimalsInFloat: 0 },
  };
  const lines = {
    ...common, xaxis, colors: ["#8970dd", "#219687"],
    stroke: { width: 3, curve: "straight" }, markers: { size: 4 },
    yaxis: [
      { title: { text: "Paid quote value (₹)" }, min: 0 },
      { title: { text: "Paid requests" }, opposite: true, min: 0, decimalsInFloat: 0 },
    ],
  };
  const paymentSeries = [
    { name: "Paid quote value (₹)", data: months.map(m => m.paymentAvailable ? m.amountPaise / 100 : null) },
    { name: "Paid requests", data: months.map(m => m.paymentAvailable ? m.paid : null) },
  ];
  return <>
    <ChartCard title="Service request status" description="All requests by current status">
      {requests.length > 0 ? <Chart type="donut" height={220} options={donut}
        series={statuses.map(([key]) => requests.filter(row => row.status === key).length)} />
        : <p className={muted}>No requests yet.</p>}
    </ChartCard>
    <ChartCard title="Monthly requests" description="Requests created in the last six calendar months">
      <Chart type="bar" height={220} options={bars}
        series={[{ name: "Requests", data: months.map(m => m.requests) }]} />
    </ChartCard>
    <div className="min-w-0 lg:col-span-2">
      <ChartCard title="Revenue &amp; payments" description="Paid quote value and paid requests, grouped by request creation month">
        <Chart type="line" height={225} options={lines} series={paymentSeries} />
        {months.some(m => !m.paymentAvailable) && <p className={muted}>Payment totals are unavailable for the months with gaps.</p>}
      </ChartCard>
    </div>
  </>;
}

async function getVehicleTotal() {
  const response = await fetch("http://localhost:5000/api/admin/verification/vehicles?status=all&page=1", {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Vehicle total unavailable");
  const result = await response.json();
  return result.pagination.total;
}

export default function AdminDashboard() {
  const { dark } = useOutletContext();
  const [platform, setPlatform] = useState({});
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const first = await getPendingServiceRequests({ limit: 50 });
        const rows = [...first.data];
        for (let page = 2; page <= first.pagination.totalPages; page++) {
          if (!active) return;
          const next = await getPendingServiceRequests({ page, limit: 50 });
          rows.push(...next.data);
        }
        if (active) {
          setRequests(rows);
          setLastUpdated(new Date());
        }
      } catch (err) {
        if (active) setError(err.message || "Unable to load dashboard");
      } finally {
        if (active) setLoading(false);
      }
    }
    async function loadPlatform() {
      const [clients, partners, vehicles] = await Promise.all([
        getClients("", "", 1, 1).catch(() => null),
        getPartners("", "", 1, 1).catch(() => null),
        getVehicleTotal().catch(() => null),
      ]);
      if (active) {
        setPlatform({
          clients: clients?.pagination.total,
          partners: partners?.pagination.total,
          vehicles,
        });
      }
    }
    loadPlatform();
    load();
    return () => { active = false; };
  }, [refresh]);

  const completed = requests.filter(row => row.status === "completed").length;
  const pending = requests.filter(row => row.status === "pending").length;
  const awaitingPayment = requests.filter(row => row.paymentStatus === "pending").length;
  const paid = requests.filter(row => row.paymentStatus === "paid");
  const missingPayment = requests.some(row => row.paymentStatus === "unavailable");
  const paidPaise = paid.reduce((sum, row) => sum + Math.round(Number(row.approved_amount) * 100), 0);
  const amount = (paidPaise / 100).toLocaleString("en-IN", { style: "currency", currency: "INR" });

  return <main className="space-y-3 text-slate-900 dark:text-slate-100">
    <DashboardHeader refreshing={loading} lastUpdated={lastUpdated} onRefresh={() => setRefresh(refresh + 1)} />
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <Metric label="Total clients" value={platform.clients ?? "—"} />
      <Metric label="Total partners" value={platform.partners ?? "—"} />
      <Metric label="Total vehicles" value={platform.vehicles ?? "—"} />
    </div>
    {error && <p role="alert">{error}</p>}
    {loading && <p role="status">Loading requests…</p>}
    {!loading && !error && <>
      <h2 className={muted}>Service overview · All time</h2>
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        <Metric label="Service requests" value={requests.length} />
        <Metric label="Completed services" value={completed} />
        <Metric label="Paid quote value" value={missingPayment ? "Unavailable" : amount} />
        <Metric label="Paid requests" value={missingPayment ? "Unavailable" : paid.length} />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <DashboardCharts requests={requests} dark={dark} />
        
        <section className={card}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">Recent service requests</h2>
            <Link to="/admin/service-requests" className="text-sm underline">View all</Link>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr><th>Request</th><th>Service</th><th>Status</th></tr></thead>
              <tbody>{requests.slice(0, 5).map(row => <tr key={row.request_id} className="border-t dark:border-white/10">
                <td className="py-2 pr-3">{row.request_code || row.request_id}</td>
                <td className="pr-3">{row.service_name}</td>
                <td className="capitalize">{row.status.replaceAll("_", " ")}</td>
              </tr>)}</tbody>
            </table>
            {!requests.length && <p className={muted}>No service requests yet.</p>}
          </div>
        </section>
        <section className={card}>
          <h2 className="font-semibold">Needs attention</h2>
          <p className="mt-4 flex justify-between gap-2">Awaiting assignment <strong>{pending}</strong></p>
          <p className="mt-3 flex justify-between gap-2">Awaiting payment <strong>{missingPayment ? "Unavailable" : awaitingPayment}</strong></p>
        </section>
      </div>
    </>}
  </main>;
}


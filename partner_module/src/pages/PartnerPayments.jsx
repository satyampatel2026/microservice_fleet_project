import { useEffect, useState } from "react";
import Layout from "../layouts/Layout";
import { getMyAssignedJobs } from "../services/partnerService";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
const card = "rounded-xl border border-slate-200 bg-white p-4 shadow-sm";

function totalAmount(jobs) {
  let paise = 0;
  for (const job of jobs) paise += Math.round(Number(job.partner_amount) * 100);
  return currency.format(paise / 100);
}

export default function PartnerPayments() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All statuses");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const result = await getMyAssignedJobs();
        if (result.data.some(job => job.payment_status_available === false)) {
          throw new Error("Payment verification is temporarily unavailable. Please refresh.");
        }
        const paidJobs = result.data.filter(job => job.can_start === true);
        for (const job of paidJobs) {
          if (job.partner_amount == null || !Number.isFinite(Number(job.partner_amount))) {
            throw new Error("The approved service amount is unavailable.");
          }
        }
        if (active) setJobs(paidJobs);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [refresh]);

  const pending = jobs.filter(job => job.status === "completed" && !job.transferredAt);
  const ongoing = jobs.filter(job => job.status !== "completed");
  function stage(job) {
    if (job.transferredAt) return "Transferred";
    return job.status === "completed" ? "Awaiting payout" : "Work pending";
  }
  const visible = jobs.filter(job => filter === "All statuses" || stage(job) === filter);

  return <Layout activePath="/partner/payments">
    <section className="space-y-4 text-slate-800">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div><h3 className="text-2xl font-semibold">Earnings &amp; payouts</h3>
          <p className="mt-1 text-sm text-slate-500">Test mode · All time</p></div>
      </header>
      {loading && <p role="status">Loading earnings…</p>}
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {!loading && !error && <>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className={card}><p className="text-sm text-slate-600">Paid jobs awaiting completion</p>
            <strong className="text-xl">{totalAmount(ongoing)}</strong></div>
          <div className={card}><p className="text-sm text-slate-600">Awaiting payout</p>
            <strong className="text-xl text-teal-800">{totalAmount(pending)}</strong></div>
          <div className={card}><p className="text-sm text-slate-600">Transferred</p>
            <strong className="text-xl">{currency.format(jobs.reduce((sum, job) => sum + Number(job.transferredPaise || 0), 0) / 100)}</strong></div>
        </div>
        <div className={card}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">Job payments</h3>
            <select aria-label="Payout status" value={filter} onChange={e => setFilter(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm">
              {["All statuses", "Work pending", "Awaiting payout", "Transferred"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          {visible.length === 0 ? <p className="mt-4 text-sm text-slate-500">No verified paid jobs for this selection.</p> :
            <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm">
              <thead className="bg-slate-50"><tr>{["Job / Vehicle", "Service", "Partner amount", "Status"].map(h =>
                <th key={h} className="p-3">{h}</th>)}</tr></thead>
              <tbody>{visible.map(job => <tr key={job.request_id} className="border-t border-slate-100">
                <td className="p-3"><strong>{job.request_code}</strong><div>{job.vehicle_number}</div></td>
                <td className="p-3">{job.service_name}</td>
                <td className="p-3 tabular-nums">{currency.format(Number(job.partner_amount))}</td>
                <td className="p-3">{stage(job)}{job.transferredAt && <small className="block">{job.transferReference} · {new Date(job.transferredAt).toLocaleString("en-IN", {timeZone:"Asia/Kolkata"})} IST</small>}</td>
              </tr>)}</tbody>
            </table></div>}
        </div>
      </>}
    </section>
  </Layout>;
}


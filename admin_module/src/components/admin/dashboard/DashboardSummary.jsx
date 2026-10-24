
import {
  Car,
  ShieldCheck,
  Users,
  Building2,
} from "lucide-react";

export default function DashboardSummary({
  users,
  vehicles,
  partners,
  workshops,
  loading,
}) {
  const total =
    Number(users || 0) +
    Number(vehicles || 0) +
    Number(partners || 0) +
    Number(workshops || 0);

  return (
    <div
      className="
        group overflow-hidden rounded-2xl
        border border-slate-200/80 bg-white
        shadow-[0_6px_24px_rgba(15,23,42,0.10)]
        transition-all duration-300
        hover:-translate-y-0.5
        hover:border-violet-200
        hover:shadow-[0_12px_32px_rgba(15,23,42,0.16)]
        dark:border-white/[0.08]
        dark:bg-[#191e2d]
        dark:shadow-[0_8px_28px_rgba(0,0,0,0.30)]
        dark:hover:border-violet-400/20
        dark:hover:shadow-[0_14px_36px_rgba(0,0,0,0.45)]
      "
    >
      {/* Total Count */}
      <div className="flex items-center justify-between gap-4 p-4 sm:p-5">
        <div className="min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-600 dark:text-violet-400">
            Platform Summary
          </span>

          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {loading ? "—" : total.toLocaleString("en-IN")}
          </h2>

          <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Total resources currently tracked across the system
          </p>
        </div>

        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-violet-200 bg-violet-50 text-violet-600 shadow-sm shadow-violet-200/50 dark:border-violet-400/15 dark:bg-violet-400/10 dark:text-violet-300 dark:shadow-none">
          <ShieldCheck size={26} strokeWidth={1.8} />
        </div>
      </div>

      {/* Sub Metrics */}
      <div className="grid divide-y divide-slate-200/80 border-t border-slate-200/80 bg-slate-50/70 sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:divide-white/[0.08] dark:border-white/[0.08] dark:bg-white/[0.03]">
        <Metric
          label="Users"
          value={users}
          loading={loading}
          icon={<Users size={15} className="text-indigo-600 dark:text-indigo-400" />}
        />

        <Metric
          label="Fleet Assets"
          value={vehicles}
          loading={loading}
          icon={<Car size={15} className="text-amber-500 dark:text-amber-400" />}
        />

        <Metric
          label="Service Network"
          value={Number(partners || 0) + Number(workshops || 0)}
          loading={loading}
          icon={<Building2 size={15} className="text-emerald-600 dark:text-emerald-400" />}
        />
      </div>
    </div>
  );
}

function Metric({ label, value, icon, loading }) {
  return (
    <div className="px-4 py-3.5 transition-colors duration-200 hover:bg-white/70 dark:hover:bg-white/[0.04]">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
        {icon}
        <span>{label}</span>
      </div>

      <p className="mt-1.5 text-lg font-bold tracking-tight text-slate-900 dark:text-white">
        {loading ? "—" : Number(value || 0).toLocaleString("en-IN")}
      </p>
    </div>
  );
}


export default function SystemStatus({ lastUpdated }) {
  const time = lastUpdated
    ? new Intl.DateTimeFormat("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(lastUpdated)
    : "Just now";

  return (
    <div
      className="
        h-full rounded-2xl
        border border-slate-200/80
        bg-white p-4 sm:p-5
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
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-600 dark:text-emerald-400">
            Health Check
          </span>

          <h4 className="mt-0.5 text-base font-bold tracking-tight text-slate-900 dark:text-white">
            System Status
          </h4>

          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Current dashboard connection
          </p>
        </div>

        {/* Online badge */}
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Online
        </span>
      </div>

      {/* Status rows */}
      <div className="mt-5 space-y-3">
        <Row
          label="Backend API"
          value="Connected"
          valueColor="text-emerald-600 dark:text-emerald-400"
        />

        <Row
          label="Dashboard data"
          value="Synchronized"
          valueColor="text-slate-800 dark:text-slate-200"
        />

        <Row
          label="Last refresh"
          value={time}
          valueColor="text-slate-800 dark:text-slate-200"
        />
      </div>
    </div>
  );
}

function Row({ label, value, valueColor }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2.5 text-xs last:border-0 last:pb-0 dark:border-white/[0.08]">
      <span className="text-slate-500 dark:text-slate-400">
        {label}
      </span>

      <span className={`text-right font-semibold ${valueColor}`}>
        {value}
      </span>
    </div>
  );
}

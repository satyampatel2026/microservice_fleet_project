
import {
  Activity,
  BarChart3,
  CalendarDays,
  Loader2,
  RefreshCw,
} from "lucide-react";

export default function DashboardHeader({
  refreshing,
  lastUpdated,
  onRefresh,
}) {
  const formattedDate = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());

  const formattedTime = lastUpdated
    ? new Intl.DateTimeFormat("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(lastUpdated)
    : "Just now";

  return (
    <section className="relative overflow-hidden rounded-2xl border border-violet-400/15 bg-gradient-to-r from-[#151a2b] via-[#211b40] to-[#151a2b] px-5 py-4 shadow-[0_8px_28px_rgba(39,29,90,0.22)] transition-shadow duration-300 hover:shadow-[0_12px_34px_rgba(39,29,90,0.30)] sm:px-6">
      {/* Subtle background accent */}
      <div className="pointer-events-none absolute -right-12 -top-20 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        {/* Header information */}
        <div className="flex items-start gap-3 sm:items-center">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-violet-400/15 bg-violet-400/10 text-violet-300">
            <BarChart3 size={20} strokeWidth={1.8} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-300">
                Admin Control Panel
              </span>

              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </div>

            <h3 className="mt-0.5 text-lg font-bold tracking-tight text-white">
              Fleet Overview
            </h3>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] text-slate-300">
                <CalendarDays size={13} className="text-violet-300" />
                {formattedDate}
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] text-slate-300">
                <Activity size={13} className="text-violet-300" />
                Synced: {formattedTime}
              </span>
            </div>
          </div>
        </div>

        {/* Refresh button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-violet-400/20 bg-violet-500/15 px-4 py-2.5 text-xs font-semibold text-violet-100 shadow-sm transition-all duration-200 hover:border-violet-400/40 hover:bg-violet-500/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
        >
          {refreshing ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <RefreshCw size={15} />
          )}
          Refresh Data
        </button>
      </div>
    </section>
  );
}

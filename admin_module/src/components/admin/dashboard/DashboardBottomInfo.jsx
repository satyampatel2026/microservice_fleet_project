
import { Activity, ArrowUpRight } from "lucide-react";

export default function DashboardBottomInfo() {
  return (
    <section className="mt-5 grid gap-5 lg:grid-cols-2">
      {/* System Notice */}
      <div
        className="
          rounded-2xl
          border border-slate-200/80
          bg-white p-5
          shadow-[0_6px_24px_rgba(15,23,42,0.10)]
          transition-all duration-300
          hover:-translate-y-0.5
          hover:shadow-[0_12px_32px_rgba(15,23,42,0.16)]
          dark:border-white/10
          dark:bg-[#191e2d]
          dark:shadow-[0_8px_28px_rgba(0,0,0,0.30)]
          dark:hover:shadow-[0_14px_36px_rgba(0,0,0,0.45)]
        "
      >
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-cyan-50 p-2.5 text-cyan-600 dark:bg-cyan-400/10 dark:text-cyan-400">
            <Activity size={18} />
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
              System Notice
            </span>

            <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              Live API Status & Sync Info
            </h3>
          </div>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Currently, the{" "}
          <span className="font-medium text-slate-900 dark:text-slate-200">
            users and Partners count API
          </span>{" "}
          is active. vehicle, driver, and workshop counts will sync
          automatically once their respective endpoint URLs are configured.
        </p>
      </div>

      {/* Administrative Control Center */}
      <div
        className="
          relative overflow-hidden
          rounded-2xl border border-indigo-900/40
          bg-gradient-to-br from-[#161b2b] via-[#191d35] to-[#251b49]
          p-5 text-white
          shadow-[0_8px_28px_rgba(39,29,90,0.24)]
          transition-all duration-300
          hover:-translate-y-0.5
          hover:shadow-[0_14px_38px_rgba(39,29,90,0.35)]
          dark:border-violet-400/10
          dark:shadow-[0_8px_28px_rgba(0,0,0,0.35)]
          dark:hover:shadow-[0_14px_38px_rgba(0,0,0,0.50)]
        "
      >
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <span className="inline-block rounded-md border border-violet-400/20 bg-violet-400/10 px-2 py-0.5 text-xs font-semibold text-violet-200">
              Fleet Management
            </span>

            <h3 className="mt-2 text-lg font-bold tracking-tight text-white">
              Administrative Control Center
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Manage platform users, verify access roles, monitor
              departments, and control fleet operations seamlessly.
            </p>
          </div>

          <div className="hidden rounded-xl border border-white/10 bg-white/10 p-3 text-violet-300 sm:block">
            <ArrowUpRight size={22} />
          </div>
        </div>
      </div>
    </section>
  );
}

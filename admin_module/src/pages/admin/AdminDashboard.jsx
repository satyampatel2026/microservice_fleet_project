
import DashboardHeader from "../../components/admin/dashboard/DashboardHeader";
import DashboardSummary from "../../components/admin/dashboard/DashboardSummary";
import DashboardStats from "../../components/admin/dashboard/DashboardStats";
import SystemStatus from "../../components/admin/dashboard/SystemStatus";
import DashboardBottomInfo from "../../components/admin/dashboard/DashboardBottomInfo";

import useDashboard from "../../hooks/useDashboard";

export default function AdminDashboard() {
  const {
    users,
    partners,
    vehicles,
    drivers,
    workshops,
    loading,
    refreshing,
    lastUpdated,
    loadDashboard,
  } = useDashboard();

  const sectionCard =
    "rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/40 transition-colors duration-300 sm:p-5 dark:border-white/[0.08] dark:bg-[#141824] dark:shadow-none";

  return (
    <div className="w-full space-y-5 sm:space-y-6">
      {/* Dashboard Header */}
      <DashboardHeader
        refreshing={refreshing}
        lastUpdated={lastUpdated}
        onRefresh={() => loadDashboard(true)}
      />

      {/* Summary & System Status */}
      <section className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className={sectionCard}>
          <DashboardSummary
            users={users}
            vehicles={vehicles}
            partners={partners}
            workshops={workshops}
            loading={loading}
          />
        </div>

        <div className={sectionCard}>
          <SystemStatus lastUpdated={lastUpdated} />
        </div>
      </section>

      {/* Platform Statistics */}
      <section className={`${sectionCard} space-y-5`}>
        <div className="border-b border-slate-100 pb-4 dark:border-white/[0.08]">
          <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-lg">
            Platform Statistics
          </h2>

          <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Key operational metrics and real-time performance indicators
            for the fleet management system.
          </p>
        </div>

        <DashboardStats
          users={users}
          partners={partners}
          vehicles={vehicles}
          drivers={drivers}
          workshops={workshops}
          loading={loading}
        />

        <div className="border-t border-slate-100 pt-4 dark:border-white/[0.08]">
          <DashboardBottomInfo />
        </div>
      </section>
    </div>
  );
}

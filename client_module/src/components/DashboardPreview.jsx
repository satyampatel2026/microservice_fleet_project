import {Link} from "react-router-dom";
import {
  Truck,
  LayoutDashboard,
  Wrench,
  CalendarDays,
  Settings,
  Bell,
  Search,
  ArrowUpRight,
  TrendingUp,
  CheckCircle2,
  Clock3,
  MoreHorizontal,
} from "lucide-react";

const requests = [
  {
    vehicle: "Tata Ace",
    service: "General Maintenance",
    status: "Completed",
    color: "emerald",
  },
  {
    vehicle: "Mahindra Bolero",
    service: "Engine Inspection",
    status: "In Progress",
    color: "amber",
  },
  {
    vehicle: "Ashok Leyland",
    service: "Brake Service",
    status: "Pending",
    color: "violet",
  },
];

const statusStyles = {
  emerald: "bg-emerald-500/10 text-emerald-400",
  amber: "bg-amber-500/10 text-amber-400",
  violet: "bg-violet-500/10 text-violet-400",
};

export default function DashboardPreview() {
  return (
    <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#10131d] text-left shadow-2xl shadow-violet-950/30">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden w-56 shrink-0 border-r border-white/10 bg-[#0c0f17] p-5 lg:block">
          <div className="mb-12 flex items-center gap-2">
              <Link to="/" className="mb-8 flex items-center justify-center !no-underline">
          <img src="/fleetrova-logo.png" alt="FLEETROVA" className="h-14 w-auto max-w-[240px] object-contain" />
        </Link>
          </div>

          <p className="mb-4 text-xs uppercase tracking-widest text-gray-600">
            Workspace
          </p>

          <div className="space-y-2">
            {[
              [LayoutDashboard, "Overview"],
              [Truck, "My Vehicles"],
              [Wrench, "Services"],
              [CalendarDays, "Bookings"],
              [Settings, "Settings"],
            ].map(([Icon, label], index) => (
              <div
                key={label}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm ${
                  index === 0
                    ? "bg-violet-500/15 text-violet-300"
                    : "text-gray-500"
                }`}
              >
                <Icon size={17} />
                {label}
              </div>
            ))}
          </div>
        </aside>

        {/* Main Dashboard */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-8">
            <div>
              <p className="text-xs text-gray-500">Workspace / Overview</p>
              <h3 className="mt-1 text-base font-semibold sm:text-lg">
                Dashboard Overview
              </h3>
            </div>

            <div className="flex items-center gap-4 text-gray-400">
              <Search size={18} className="hidden sm:block" />
              <Bell size={18} />
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/20 text-xs font-semibold text-violet-300">
                CL
              </div>
            </div>
          </div>

          <div className="space-y-6 p-5 sm:p-8">
            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  title: "Total Vehicles",
                  value: "24",
                  icon: Truck,
                  info: "+12.5%",
                },
                {
                  title: "Active Bookings",
                  value: "08",
                  icon: CalendarDays,
                  info: "+8.2%",
                },
                {
                  title: "Completed Services",
                  value: "156",
                  icon: CheckCircle2,
                  info: "+18.4%",
                },
              ].map(({ title, value, icon: Icon, info }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{title}</span>
                    <Icon size={18} className="text-violet-400" />
                  </div>

                  <div className="mt-5 flex items-end justify-between">
                    <span className="text-3xl font-semibold">{value}</span>
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <TrendingUp size={13} />
                      {info}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Analytics */}
            <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold">Service Activity</h4>
                    <p className="mt-1 text-xs text-gray-500">
                      Monthly service overview
                    </p>
                  </div>
                  <MoreHorizontal size={18} className="text-gray-500" />
                </div>

                <div className="mt-8 flex h-40 items-end justify-between gap-3 border-b border-white/10">
                  {[40, 65, 48, 85, 62, 100, 76, 92, 60, 82, 72, 96].map(
                    (height, index) => (
                      <div
                        key={index}
                        className="group flex h-full flex-1 items-end"
                      >
                        <div
                          className="w-full rounded-t-md bg-gradient-to-t from-violet-700/50 to-violet-400 transition group-hover:to-indigo-300"
                          style={{ height: `${height}%` }}
                        />
                      </div>
                    )
                  )}
                </div>

                <div className="mt-3 flex justify-between text-[10px] text-gray-500">
                  {["Jan", "Mar", "May", "Jul", "Sep", "Dec"].map((month) => (
                    <span key={month}>{month}</span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                <h4 className="text-sm font-semibold">Service Status</h4>
                <p className="mt-1 text-xs text-gray-500">
                  Current service distribution
                </p>

                <div className="mx-auto mt-6 flex h-36 w-36 items-center justify-center rounded-full bg-[conic-gradient(#8b5cf6_0%_60%,#6366f1_60%_85%,#252938_85%_100%)]">
                  <div className="flex h-27 w-27 flex-col items-center justify-center rounded-full bg-[#151823]">
                    <span className="text-2xl font-semibold">85%</span>
                    <span className="text-[10px] text-gray-500">Processed</span>
                  </div>
                </div>

                <div className="mt-6 flex justify-center gap-4 text-[10px] text-gray-400">
                  <span>● Completed</span>
                  <span>● Active</span>
                  <span>● Pending</span>
                </div>
              </div>
            </div>

            {/* Requests Table */}
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
              <div className="flex items-center justify-between border-b border-white/10 p-5">
                <h4 className="text-sm font-semibold">
                  Recent Service Requests
                </h4>
                <ArrowUpRight size={17} className="text-gray-500" />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-xs">
                  <thead className="border-b border-white/10 text-gray-500">
                    <tr>
                      <th className="px-5 py-4 font-medium">Vehicle</th>
                      <th className="px-5 py-4 font-medium">Service</th>
                      <th className="px-5 py-4 font-medium">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {requests.map((request) => (
                      <tr
                        key={request.vehicle}
                        className="border-b border-white/5 last:border-0"
                      >
                        <td className="px-5 py-4 font-medium text-gray-200">
                          {request.vehicle}
                        </td>
                        <td className="px-5 py-4 text-gray-400">
                          {request.service}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1.5 ${
                              statusStyles[request.color]
                            }`}
                          >
                            {request.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-center text-[10px] text-gray-600">
              Dashboard preview uses sample data for demonstration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
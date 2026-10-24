
import {
  CalendarDays,
  Clock3,
  CheckCircle2,
  Activity,
  ArrowUpRight,
  Wrench,
} from "lucide-react";
import { Link } from "react-router-dom";

const stats = [
  { title: "Total Bookings", value: "12", icon: CalendarDays },
  { title: "Pending Requests", value: "03", icon: Clock3 },
  { title: "Completed", value: "08", icon: CheckCircle2 },
  { title: "Active Services", value: "01", icon: Activity },
];

const recentBookings = [
  { id: "BK-1001", service: "Vehicle Maintenance", date: "12 Oct 2026", status: "Completed" },
  { id: "BK-1002", service: "Vehicle Washing", date: "14 Oct 2026", status: "In Progress" },
  { id: "BK-1003", service: "Battery Services", date: "17 Oct 2026", status: "Pending" },
];

const statusStyles = {
  Completed: "bg-emerald-500/10 text-emerald-300",
  "In Progress": "bg-sky-500/10 text-sky-300",
  Pending: "bg-amber-500/10 text-amber-300",
};

export default function ClientDashboard() {
  return (
    <div className="space-y-9">
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div>
          <p className="text-sm text-violet-400">Dashboard Overview</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            Welcome back!
          </h2>
          <p className="mt-3 text-sm text-gray-400">
            Here's an overview of your fleet service activity.
          </p>
        </div>

        <Link
          to="/client/services"
          className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold transition hover:bg-violet-400"
        >
          <Wrench size={18} />
          Explore Services
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ title, value, icon: Icon }) => (
          <div
            key={title}
            className="rounded-2xl border border-white/10 bg-[#111521] p-6"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">{title}</span>
              <span className="rounded-xl bg-violet-500/10 p-3 text-violet-300">
                <Icon size={20} />
              </span>
            </div>

            <p className="mt-6 text-3xl font-semibold">{value}</p>
            <p className="mt-2 text-xs text-gray-500">Sample data</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#111521] xl:col-span-2">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
            <div>
              <h3 className="text-lg font-semibold">Recent Bookings</h3>
              <p className="mt-1 text-xs text-gray-500">
                Your latest service requests
              </p>
            </div>

            <Link
              to="/client/bookings"
              className="flex items-center gap-1 text-sm text-violet-300 hover:text-violet-200"
            >
              View All <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[570px] text-left text-sm">
              <thead className="border-b border-white/10 text-gray-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Booking ID</th>
                  <th className="px-6 py-4 font-medium">Service</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>

              <tbody>
                {recentBookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-white/5 last:border-0">
                    <td className="px-6 py-5 text-violet-300">{booking.id}</td>
                    <td className="px-6 py-5">{booking.service}</td>
                    <td className="px-6 py-5 text-gray-400">{booking.date}</td>
                    <td className="px-6 py-5">
                      <span
                        className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs ${
                          statusStyles[booking.status]
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#111521] p-6">
          <h3 className="text-lg font-semibold">Quick Actions</h3>
          <p className="mt-2 text-sm text-gray-500">
            Access frequently used sections.
          </p>

          <div className="mt-7 space-y-3">
            {[
              { label: "Browse Services", path: "/client/services" },
              { label: "View My Bookings", path: "/client/bookings" },
              { label: "Manage Profile", path: "/client/profile" },
            ].map((action) => (
              <Link
                key={action.path}
                to={action.path}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-sm transition hover:border-violet-400/30 hover:bg-white/10"
              >
                {action.label}
                <ArrowUpRight size={17} className="text-violet-300" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

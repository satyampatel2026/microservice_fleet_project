
import React from "react";
import { Link } from "react-router-dom";
import Layout from "../layouts/Layout";
import {
  Wrench,
  Users,
  CheckCircle2,
  IndianRupee,
  TrendingUp,
  Plus,
  ArrowRight,
  Star,
  Clock,
  Package,
  ClipboardList,
  ArrowUpRight,
  Activity,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

// DASHBOARD STATS - Existing demo data
const stats = [
  {
    title: "Active Services",
    value: "18",
    icon: Wrench,
    trend: "+3 this month",
    color: "teal",
  },
  {
    title: "Total Employees",
    value: "24",
    icon: Users,
    trend: "+2 new hires",
    color: "emerald",
  },
  {
    title: "Jobs Completed",
    value: "342",
    icon: CheckCircle2,
    trend: "+28 this week",
    color: "champagne",
  },
  {
    title: "Revenue",
    value: "₹4.86L",
    icon: IndianRupee,
    trend: "+18% vs last month",
    color: "deep",
  },
];

// RECENT JOBS - Existing demo data
const jobs = [
  {
    id: "#JOB-2041",
    vehicle: "MH12 AB 1234",
    service: "Engine Oil Change",
    emp: "Suresh Patil",
    status: "Completed",
    tone: "completed",
  },
  {
    id: "#JOB-2040",
    vehicle: "MP04 CD 5678",
    service: "Brake Pad Replacement",
    emp: "Amit Verma",
    status: "In Progress",
    tone: "progress",
  },
  {
    id: "#JOB-2039",
    vehicle: "MP09 EF 9012",
    service: "AC Repair",
    emp: "Rajesh Kumar",
    status: "Pending",
    tone: "pending",
  },
  {
    id: "#JOB-2038",
    vehicle: "MH14 GH 3456",
    service: "Tire Rotation",
    emp: "Vikram Singh",
    status: "Completed",
    tone: "completed",
  },
];

const quickActions = [
  {
    icon: Wrench,
    title: "Add Service",
    desc: "Create new workshop service",
    color: "teal",
    href: "/partner/services",
    enabled: true,
  },
  {
    icon: Users,
    title: "Add Employee",
    desc: "Register a new team member",
    color: "emerald",
    href: "/partner/employees",
    enabled: false,
  },
  {
    icon: Package,
    title: "Inventory",
    desc: "Check stock & orders",
    color: "champagne",
    href: "/partner/inventory",
    enabled: false,
  },
  {
    icon: TrendingUp,
    title: "Reports",
    desc: "View performance analytics",
    color: "deep",
    href: "/partner/reports",
    enabled: false,
  },
];

const employeeAvailability = [
  {
    label: "Available",
    value: 14,
    pct: 58,
    color: "bg-[#14B8A6]",
  },
  {
    label: "On Job",
    value: 7,
    pct: 29,
    color: "bg-[#0E5957]",
  },
  {
    label: "On Leave",
    value: 3,
    pct: 13,
    color: "bg-[#D6B77B]",
  },
];

const topPerformers = [
  {
    name: "Suresh Patil",
    jobs: 42,
    initials: "SP",
    gradient: "from-[#0E3940] to-[#0F766E]",
  },
  {
    name: "Amit Verma",
    jobs: 38,
    initials: "AV",
    gradient: "from-[#0F766E] to-[#14B8A6]",
  },
];

const toneMap = {
  teal: {
    bg: "bg-teal-50",
    text: "text-teal-700",
    border: "border-teal-100",
    gradient: "from-[#0E3940] to-[#0F766E]",
  },
  emerald: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-100",
    gradient: "from-[#0F766E] to-[#14B8A6]",
  },
  champagne: {
    bg: "bg-[#FBF6EB]",
    text: "text-[#A7823D]",
    border: "border-[#F0E4C9]",
    gradient: "from-[#B79A60] to-[#D6B77B]",
  },
  deep: {
    bg: "bg-[#EAF2F2]",
    text: "text-[#0E3940]",
    border: "border-[#D7E6E4]",
    gradient: "from-[#071B22] to-[#0E3940]",
  },
};

const statusStyles = {
  completed:
    "border-emerald-100 bg-emerald-50 text-emerald-700",
  progress:
    "border-teal-100 bg-teal-50 text-teal-700",
  pending:
    "border-amber-100 bg-amber-50 text-amber-700",
};

const showComingSoon = (label) => {
  window.alert(
    `"${label}" page is under development and will be available soon!`
  );
};

const Dashboard = () => {
  return (
    <Layout activePath="/dashboard">
      <div className="mx-auto w-full max-w-[1600px] space-y-5">

        {/* PAGE HEADER */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
              <span className="text-[10px] font-bold uppercase tracking-[0.17em] text-teal-700">
                Partner Workspace
              </span>
            </div>

            <h3 className="text-[22px] font-extrabold tracking-tight text-[#092B31] sm:text-[25px]">
              Dashboard Overview
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Track your workshop performance and daily operations.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#DDEAE6] bg-white px-3 py-2 shadow-sm">
            <ShieldCheck size={15} className="text-teal-700" />
            <span className="text-[11px] font-semibold text-[#0E3940]">
              Partner Dashboard
            </span>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const tone = toneMap[stat.color];

            return (
              <div
                key={stat.title}
                className="group relative overflow-hidden rounded-2xl border border-[#E2EBE8] bg-white p-4 shadow-[0_3px_16px_rgba(7,27,34,0.035)] transition-all duration-300 hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-[0_12px_28px_rgba(7,27,34,0.08)]"
              >
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#0F766E] via-[#14B8A6] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-slate-500">
                      {stat.title}
                    </p>

                    <h3 className="mt-2 text-[27px] font-extrabold leading-none tracking-tight text-[#092B31]">
                      {stat.value}
                    </h3>
                  </div>

                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${tone.bg} ${tone.text} ${tone.border}`}
                  >
                    <Icon size={19} strokeWidth={2} />
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-1.5">
                  <TrendingUp
                    size={13}
                    className="text-emerald-600"
                  />
                  <span className="text-[11px] font-semibold text-emerald-700">
                    {stat.trend}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* JOBS + EMPLOYEE OVERVIEW */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">

          {/* RECENT JOBS */}
          <section className="min-w-0 overflow-hidden rounded-2xl border border-[#E2EBE8] bg-white shadow-[0_3px_16px_rgba(7,27,34,0.035)] xl:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EDF2F0] px-4 py-4 sm:px-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                  <ClipboardList size={18} />
                </div>

                <div>
                  <h3 className="text-[14px] font-bold text-[#092B31]">
                    Recent Service Jobs
                  </h3>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Latest workshop service requests
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => showComingSoon("Job Cards")}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 transition-colors hover:text-teal-900"
              >
                View All
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead className="bg-[#F8FBFA]">
                  <tr className="text-[10px] font-bold uppercase tracking-[0.09em] text-slate-500">
                    <th className="px-4 py-3 sm:px-5">Job ID</th>
                    <th className="px-4 py-3">Vehicle</th>
                    <th className="px-4 py-3">Service</th>
                    <th className="px-4 py-3">Assigned To</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#EDF2F0]">
                  {jobs.map((job) => (
                    <tr
                      key={job.id}
                      className="transition-colors hover:bg-[#F8FBFA]"
                    >
                      <td className="whitespace-nowrap px-4 py-3.5 text-[11px] font-bold text-teal-800 sm:px-5">
                        {job.id}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 font-mono text-[11px] text-slate-600">
                        {job.vehicle}
                      </td>

                      <td className="px-4 py-3.5 text-[11px] font-medium text-[#18383C]">
                        {job.service}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#EAF5F2] text-[10px] font-bold text-teal-700">
                            {job.emp
                              .split(" ")
                              .map((name) => name[0])
                              .join("")}
                          </div>

                          <span className="whitespace-nowrap text-[11px] font-medium text-slate-700">
                            {job.emp}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusStyles[job.tone]}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {job.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-[#EDF2F0] bg-[#FCFDFC] px-5 py-3">
              <span className="text-[10px] text-slate-400">
                Showing {jobs.length} recent jobs
              </span>

              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-700">
                <Activity size={12} />
                Workshop activity
              </span>
            </div>
          </section>

          {/* EMPLOYEE OVERVIEW */}
          <section className="overflow-hidden rounded-2xl border border-[#E2EBE8] bg-white shadow-[0_3px_16px_rgba(7,27,34,0.035)]">
            <div className="flex items-center gap-3 border-b border-[#EDF2F0] px-4 py-4 sm:px-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Users size={18} />
              </div>

              <div>
                <h3 className="text-[14px] font-bold text-[#092B31]">
                  Employee Overview
                </h3>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Team availability status
                </p>
              </div>
            </div>

            <div className="space-y-4 p-4 sm:p-5">
              {employeeAvailability.map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-600">
                      {item.label}
                    </span>

                    <span className="text-[12px] font-bold text-[#092B31]">
                      {item.value}
                    </span>
                  </div>

                  <div
                    role="progressbar"
                    aria-label={item.label}
                    aria-valuenow={item.pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="h-[7px] overflow-hidden rounded-full bg-[#EDF3F1]"
                  >
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}

              <div className="border-t border-[#EDF2F0] pt-4">
                <div className="mb-3 flex items-center gap-2">
                  <Star
                    size={15}
                    className="fill-[#D6B77B] text-[#D6B77B]"
                  />
                  <h4 className="text-[12px] font-bold text-[#092B31]">
                    Top Performers
                  </h4>
                </div>

                <div className="space-y-2">
                  {topPerformers.map((person) => (
                    <div
                      key={person.name}
                      className="flex items-center justify-between gap-2 rounded-xl p-2 transition-colors hover:bg-[#F8FBFA]"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${person.gradient} text-[10px] font-bold text-white`}
                        >
                          {person.initials}
                        </div>

                        <span className="truncate text-[11px] font-semibold text-slate-700">
                          {person.name}
                        </span>
                      </div>

                      <span className="shrink-0 rounded-lg bg-teal-50 px-2 py-1 text-[10px] font-bold text-teal-700">
                        {person.jobs} jobs
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => showComingSoon("Employees")}
                className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-teal-100 bg-teal-50 text-[11px] font-bold text-teal-700 transition-colors hover:bg-teal-100"
              >
                View All Employees
                <ArrowRight size={14} />
              </button>
            </div>
          </section>
        </div>

        {/* QUICK ACTIONS */}
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-[15px] font-bold text-[#092B31]">
                Quick Actions
              </h3>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Frequently used workshop tools
              </p>
            </div>

            <button
              type="button"
              onClick={() => showComingSoon("Customize Shortcuts")}
              className="text-[11px] font-semibold text-teal-700 transition-colors hover:text-teal-900"
            >
              Customize
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              const tone = toneMap[action.color];

              const content = (
                <>
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${tone.gradient} text-white shadow-sm transition-transform duration-200 group-hover:scale-105`}
                    >
                      <Icon size={19} />
                    </div>

                    <ArrowUpRight
                      size={16}
                      className="text-slate-300 transition-colors group-hover:text-teal-700"
                    />
                  </div>

                  <h3 className="mt-3 text-[11px] font-semibold !text-[#092B31] !no-underline">
                    {action.title}
                  </h3>

                  <p className="mt-1 text-[10px] leading-4 text-slate-500">
                    {action.desc}
                  </p>
                </>
              );

              const className =
             "group block w-full rounded-2xl border border-[#E2EBE8] bg-white p-4 text-left !text-[#092B31] !no-underline shadow-[0_3px_16px_rgba(7,27,34,0.035)] transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-200 hover:!text-[#092B31] hover:!no-underline hover:shadow-[0_10px_25px_rgba(7,27,34,0.07)]";

              return action.enabled ? (
                <Link
                  key={action.title}
                  to={action.href}
                  className={className}
                >
                  {content}
                </Link>
              ) : (
                <button
                  key={action.title}
                  type="button"
                  onClick={() => showComingSoon(action.title)}
                  className={className}
                >
                  {content}
                </button>
              );
            })}
          </div>
        </section>

        {/* BOTTOM INFO CARDS */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">

          {/* SERVICE TIME */}
          <div className="relative overflow-hidden rounded-2xl border border-[#17464A] bg-gradient-to-br from-[#071B22] via-[#0E3940] to-[#0F5956] p-4 text-white shadow-[0_8px_24px_rgba(7,27,34,0.12)]">
            <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-teal-400/10 blur-2xl" />

            <div className="relative">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/10">
                <Clock size={18} className="text-teal-200" />
              </div>

              <p className="text-[11px] font-medium text-teal-100/80">
                Avg. Service Time
              </p>

              <p className="mt-1 text-[25px] font-extrabold tracking-tight">
                2h 34m
              </p>

              <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-teal-200">
                <TrendingUp size={13} />
                12% faster this month
              </p>
            </div>
          </div>

          {/* STOCK */}
          <div className="rounded-2xl border border-[#E2EBE8] bg-white p-4 shadow-[0_3px_16px_rgba(7,27,34,0.035)]">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl border border-[#F0E4C9] bg-[#FBF6EB] text-[#A7823D]">
              <Package size={18} />
            </div>

            <p className="text-[11px] font-medium text-slate-500">
              Low Stock Items
            </p>

            <p className="mt-1 text-[25px] font-extrabold tracking-tight text-[#092B31]">
              7
            </p>

            <p className="mt-1.5 text-[11px] font-semibold text-[#A7823D]">
              Restock recommended
            </p>
          </div>

          {/* RATING */}
          <div className="rounded-2xl border border-[#E2EBE8] bg-white p-4 shadow-[0_3px_16px_rgba(7,27,34,0.035)]">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl border border-teal-100 bg-teal-50 text-teal-700">
              <Star size={18} />
            </div>

            <p className="text-[11px] font-medium text-slate-500">
              Customer Rating
            </p>

            <p className="mt-1 text-[25px] font-extrabold tracking-tight text-[#092B31]">
              4.8 <span className="text-sm font-medium text-slate-400">/ 5.0</span>
            </p>

            <p className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-500">
              <Sparkles size={12} className="text-[#D6B77B]" />
              Based on 214 reviews
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;

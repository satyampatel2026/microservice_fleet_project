
import {
  BadgeCheck,
  Search,
  UserRound,
  UsersRound,
} from "lucide-react";

export default function UserStats({
  users,
  filteredUsers,
}) {
  const activeUsers = users.filter(
    (user) => user.status !== "inactive"
  ).length;

  const inactiveUsers = users.filter(
    (user) => user.status === "inactive"
  ).length;

  const cards = [
    {
      label: "Total users",
      value: users.length,
      text: "Registered accounts",
      icon: <UsersRound size={21} strokeWidth={1.8} />,
      iconClass:
        "bg-indigo-50 text-indigo-600 border-indigo-100 " +
        "dark:bg-indigo-400/10 dark:text-indigo-400 dark:border-indigo-400/15",
    },
    {
      label: "Active users",
      value: activeUsers,
      text: "Currently enabled",
      icon: <BadgeCheck size={21} strokeWidth={1.8} />,
      iconClass:
        "bg-emerald-50 text-emerald-600 border-emerald-100 " +
        "dark:bg-emerald-400/10 dark:text-emerald-400 dark:border-emerald-400/15",
    },
    {
      label: "Inactive users",
      value: inactiveUsers,
      text: "Currently disabled",
      icon: <UserRound size={21} strokeWidth={1.8} />,
      iconClass:
        "bg-red-50 text-red-600 border-red-100 " +
        "dark:bg-red-400/10 dark:text-red-400 dark:border-red-400/15",
    },
    {
      label: "Visible results",
      value: filteredUsers.length,
      text: "After applied filters",
      icon: <Search size={21} strokeWidth={1.8} />,
      iconClass:
        "bg-cyan-50 text-cyan-600 border-cyan-100 " +
        "dark:bg-cyan-400/10 dark:text-cyan-400 dark:border-cyan-400/15",
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="
            group rounded-2xl
            border border-slate-200/80
            bg-white p-5
            shadow-[0_6px_24px_rgba(15,23,42,0.10)]
            transition-all duration-300
            hover:-translate-y-1
            hover:border-violet-200
            hover:shadow-[0_12px_32px_rgba(15,23,42,0.16)]
            dark:border-white/[0.08]
            dark:bg-[#191e2d]
            dark:shadow-[0_8px_28px_rgba(0,0,0,0.30)]
            dark:hover:border-violet-400/20
            dark:hover:shadow-[0_14px_36px_rgba(0,0,0,0.45)]
          "
        >
          <div className="flex items-start justify-between gap-3">
            {/* Metric Details */}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {card.label}
              </p>

              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {card.value.toLocaleString("en-IN")}
              </p>

              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                {card.text}
              </p>
            </div>

            {/* Metric Icon */}
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-105 ${card.iconClass}`}
            >
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}

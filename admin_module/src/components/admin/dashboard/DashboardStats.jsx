
import {
  Car,
  Handshake,
  UserCircle,
  Users,
  Wrench,
} from "lucide-react";

export default function DashboardStats({
  users,
  partners,
  vehicles,
  drivers,
  workshops,
  loading,
}) {
  const cards = [
    {
      label: "Total Users",
      value: users,
      icon: Users,
      iconBg: "bg-indigo-600",
      iconShadow: "shadow-indigo-500/20",
    },
    {
      label: "Workshop Partners",
      value: partners,
      icon: Handshake,
      iconBg: "bg-emerald-600",
      iconShadow: "shadow-emerald-500/20",
    },
    {
      label: "Total Vehicles",
      value: vehicles,
      icon: Car,
      iconBg: "bg-amber-500",
      iconShadow: "shadow-amber-500/20",
    },
    {
      label: "Total Drivers",
      value: drivers,
      icon: UserCircle,
      iconBg: "bg-rose-500",
      iconShadow: "shadow-rose-500/20",
    },
    {
      label: "Workshops",
      value: workshops,
      icon: Wrench,
      iconBg: "bg-violet-600",
      iconShadow: "shadow-violet-500/20",
    },
  ];

  const gridClass =
    "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5";

  const cardClass =
    "group rounded-2xl border border-slate-200/80 bg-white p-4 " +
    "shadow-[0_6px_20px_rgba(15,23,42,0.10)] " +
    "transition-all duration-300 " +
    "hover:-translate-y-1 hover:border-violet-200 " +
    "hover:shadow-[0_12px_28px_rgba(15,23,42,0.16)] " +
    "dark:border-white/[0.08] dark:bg-[#191e2d] " +
    "dark:shadow-[0_8px_24px_rgba(0,0,0,0.28)] " +
    "dark:hover:border-violet-400/25 " +
    "dark:hover:shadow-[0_14px_32px_rgba(0,0,0,0.42)]";

  if (loading) {
    return (
      <div className={gridClass}>
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className={`${cardClass} h-32 animate-pulse`}
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-white/10" />
              <div className="h-6 w-14 rounded-md bg-slate-200 dark:bg-white/10" />
            </div>

            <div className="mt-5 h-3 w-24 rounded-md bg-slate-200 dark:bg-white/10" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={gridClass}>
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div key={card.label} className={cardClass}>
            <div className="flex items-center justify-between gap-3">
              {/* Icon */}
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-lg ${card.iconBg} ${card.iconShadow}`}
              >
                <Icon size={19} strokeWidth={1.8} />
              </div>

              {/* Value */}
              <p className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {Number(card.value || 0).toLocaleString("en-IN")}
              </p>
            </div>

            {/* Label */}
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
              {card.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

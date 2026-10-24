
import { Layers3, Search, Sparkles } from "lucide-react";

export default function DepartmentStats({
  departments,
  filteredDepartments,
  searchTerm,
}) {
  const latestDepartment =
    departments.length > 0
      ? departments[departments.length - 1].department_name
      : "No department";

  const cards = [
    {
      label: "Total departments",
      value: departments.length,
      description: "Active system entries",
      icon: <Layers3 size={20} strokeWidth={1.8} />,
      iconClass:
        "border-indigo-200/70 bg-indigo-50 text-indigo-600 " +
        "dark:border-indigo-400/15 dark:bg-indigo-400/10 dark:text-indigo-400",
    },
    {
      label: "Search results",
      value: filteredDepartments.length,
      description: searchTerm
        ? "Matching search query"
        : "All departments shown",
      icon: <Search size={20} strokeWidth={1.8} />,
      iconClass:
        "border-cyan-200/70 bg-cyan-50 text-cyan-600 " +
        "dark:border-cyan-400/15 dark:bg-cyan-400/10 dark:text-cyan-400",
    },
    {
      label: "Latest department",
      value: latestDepartment,
      description: "Recently added entry",
      icon: <Sparkles size={20} strokeWidth={1.8} />,
      iconClass:
        "border-amber-200/70 bg-amber-50 text-amber-600 " +
        "dark:border-amber-400/15 dark:bg-amber-400/10 dark:text-amber-400",
      isText: true,
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="
            group min-w-0 rounded-2xl
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
            dark:hover:shadow-[0_14px_36px_rgba(0,0,0,0.42)]
          "
        >
          <div className="flex items-center justify-between gap-3">
            {/* Metric Details */}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {card.label}
              </p>

              <p
                title={card.isText ? String(card.value) : undefined}
                className={`mt-2 truncate font-bold tracking-tight text-slate-900 dark:text-white ${
                  card.isText
                    ? "text-lg capitalize"
                    : "text-3xl"
                }`}
              >
                {card.isText
                  ? card.value
                  : card.value.toLocaleString("en-IN")}
              </p>

              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                {card.description}
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


import {
  Building2,
  Edit3,
  Search,
  Trash2,
  X,
} from "lucide-react";

export default function DepartmentList({
  departments,
  searchTerm,
  setSearchTerm,
  loading,
  onEdit,
  onDelete,
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_6px_24px_rgba(15,23,42,0.10)] transition-all duration-300 hover:border-violet-200 hover:shadow-[0_12px_32px_rgba(15,23,42,0.16)] dark:border-white/[0.08] dark:bg-[#191e2d] dark:shadow-[0_8px_28px_rgba(0,0,0,0.30)] dark:hover:border-violet-400/20 dark:hover:shadow-[0_14px_36px_rgba(0,0,0,0.42)]">
      {/* Directory Header */}
      <div className="border-b border-slate-200/80 px-4 py-4 sm:px-5 dark:border-white/[0.08]">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              Department directory
            </h3>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              View, search, update and delete departments.
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-64">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            />

            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search department or ID"
              aria-label="Search departments"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 pl-10 pr-10 text-xs text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-slate-500 dark:hover:border-white/20 dark:focus:border-violet-400 dark:focus:bg-white/[0.06] dark:focus:ring-violet-400/10"
            />

            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Directory Content */}
      {loading ? (
        <DepartmentSkeleton />
      ) : departments.length > 0 ? (
        <>
          {/* Desktop Table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[650px]">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/80 text-left dark:border-white/[0.08] dark:bg-white/[0.04]">
                  {[
                    "No.",
                    "Department",
                    "Department ID",
                    "Status",
                    "Actions",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className={`px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 ${
                        heading === "Actions" ? "text-right" : ""
                      }`}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                {departments.map((department, index) => (
                  <tr
                    key={department.department_id}
                    className="transition-colors duration-200 hover:bg-violet-50/50 dark:hover:bg-violet-400/[0.05]"
                  >
                    {/* Number */}
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                      {String(index + 1).padStart(2, "0")}
                    </td>

                    {/* Department */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-200/70 bg-violet-50 text-violet-600 dark:border-violet-400/15 dark:bg-violet-400/10 dark:text-violet-300">
                          <Building2 size={17} />
                        </div>

                        <div className="min-w-0">
                          <p className="font-semibold capitalize text-slate-800 dark:text-slate-100">
                            {department.department_name}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                            Organization department
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Department ID */}
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-lg border border-slate-200/70 bg-slate-100/80 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300">
                        #{department.department_id}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Available
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(department)}
                          aria-label={`Edit ${department.department_name}`}
                          title="Edit department"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-200/70 bg-violet-50 text-violet-600 transition-all hover:bg-violet-100 hover:shadow-sm dark:border-violet-400/15 dark:bg-violet-400/10 dark:text-violet-300 dark:hover:bg-violet-400/20"
                        >
                          <Edit3 size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDelete(department)}
                          aria-label={`Delete ${department.department_name}`}
                          title="Delete department"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200/70 bg-red-50 text-red-600 transition-all hover:bg-red-100 hover:shadow-sm dark:border-red-400/15 dark:bg-red-400/10 dark:text-red-400 dark:hover:bg-red-400/20"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="divide-y divide-slate-100 md:hidden dark:divide-white/[0.08]">
            {departments.map((department, index) => (
              <div
                key={department.department_id}
                className="p-4 transition-colors hover:bg-violet-50/30 dark:hover:bg-white/[0.03]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-200/70 bg-violet-50 text-violet-600 dark:border-violet-400/15 dark:bg-violet-400/10 dark:text-violet-300">
                      <Building2 size={18} />
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold capitalize text-slate-800 dark:text-slate-100">
                        {department.department_name}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        #{department.department_id} · Department {index + 1}
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Available
                  </span>
                </div>

                {/* Mobile Actions */}
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(department)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-violet-200/70 bg-violet-50 px-4 py-2.5 text-xs font-semibold text-violet-600 transition-colors hover:bg-violet-100 dark:border-violet-400/15 dark:bg-violet-400/10 dark:text-violet-300 dark:hover:bg-violet-400/20"
                  >
                    <Edit3 size={15} />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(department)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200/70 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 dark:border-red-400/15 dark:bg-red-400/10 dark:text-red-400 dark:hover:bg-red-400/20"
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <EmptyState searchTerm={searchTerm} />
      )}
    </section>
  );
}

function DepartmentSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-5">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="flex items-center gap-4">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-200 dark:bg-white/10" />

          <div className="flex-1">
            <div className="h-4 w-40 max-w-full rounded bg-slate-200 dark:bg-white/10" />
            <div className="mt-2 h-3 w-24 rounded bg-slate-100 dark:bg-white/[0.06]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ searchTerm }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-slate-400 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-500">
        <Search size={25} />
      </div>

      <h3 className="mt-3 font-bold text-slate-800 dark:text-slate-100">
        No departments found
      </h3>

      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {searchTerm
          ? `No department matches "${searchTerm}".`
          : "Add your first department."}
      </p>
    </div>
  );
}

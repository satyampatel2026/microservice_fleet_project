
import { Search, X } from "lucide-react";

export default function UserFilters({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  departmentFilter,
  setDepartmentFilter,
  departments,
}) {
  const inputClass =
    "w-full rounded-xl border border-slate-200 " +
    "bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-800 " +
    "outline-none transition-all duration-200 " +
    "placeholder:text-slate-400 " +
    "hover:border-slate-300 " +
    "focus:border-violet-500 focus:bg-white " +
    "focus:ring-4 focus:ring-violet-500/10 " +
    "dark:border-white/10 dark:bg-white/[0.04] " +
    "dark:text-slate-100 dark:placeholder:text-slate-500 " +
    "dark:hover:border-white/20 " +
    "dark:focus:border-violet-400 " +
    "dark:focus:bg-[#242a3b] dark:focus:ring-violet-400/10";

  return (
    <div className="border-b border-slate-200/80 p-4 sm:p-5 dark:border-white/[0.08]">
      {/* Section Heading */}
      <div className="mb-4">
        <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
          User directory
        </h3>

        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Search, filter, edit, delete and assign roles.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="grid gap-3 md:grid-cols-3">
        {/* Search */}
        <div className="relative">
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
          />

          <input
            type="search"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            placeholder="Search name, email, mobile or ID"
            aria-label="Search users"
            className={`${inputClass} pl-10 pr-10`}
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

        {/* Department Filter */}
        <select
          value={departmentFilter}
          onChange={(event) =>
            setDepartmentFilter(event.target.value)
          }
          aria-label="Filter by department"
          className={`${inputClass} cursor-pointer dark:[color-scheme:dark]`}
        >
          <option value="all">All departments</option>

          {departments.map((department) => (
            <option
              key={department.department_id}
              value={department.department_id}
            >
              {department.department_name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
          aria-label="Filter by status"
          className={`${inputClass} cursor-pointer dark:[color-scheme:dark]`}
        >
          <option value="all">All statuses</option>
          <option value="active">Active users</option>
          <option value="inactive">Inactive users</option>
        </select>
      </div>
    </div>
  );
}

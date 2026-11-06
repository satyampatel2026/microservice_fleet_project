import { useEffect, useRef, useState } from "react";
import {
  Eye, X,
  ArrowDownUp,
  ArrowUp,
  ArrowDown,
  Building2,
  Edit3,
  ShieldCheck,
  Trash2,
  UsersRound,ChevronDown
} from "lucide-react";

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function UserTable({
  users,
  loading,
  onEdit,
  onDelete,
  onRole,
  onStatusChange,
  departments = [],
  statusFilter = "all",
  setStatusFilter,
  departmentFilter = "all",
  setDepartmentFilter,
  page = 1,
  limit = 10,
  sortBy = "user_id",
  sortOrder = "desc",
  onSortChange,
}) {
  const [selectedUser, setSelectedUser] = useState(null);

  // Serial numbering page ke saath continue hogi: 1–10, phir 11–20.
  function serialNumber(index) {
    return (page - 1) * limit + index + 1;
  }

  const userHeading = (
    <button type="button" onClick={() => onSortChange("full_name", sortBy === "full_name" && sortOrder === "asc" ? "desc" : "asc")} title="Sort users A–Z or Z–A" className={`inline-flex items-center gap-1.5 rounded py-1 text-[11px] font-bold uppercase tracking-wider focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500 ${sortBy === "full_name" ? "text-violet-600 dark:text-violet-300" : ""}`}>
      User
      {sortBy !== "full_name" ? <ArrowDownUp size={13} /> : sortOrder === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
      {sortBy === "full_name" && <span className="text-[9px] font-medium">{sortOrder === "asc" ? "A–Z" : "Z–A"}</span>}
    </button>
  );

  const departmentHeading = (
    <HeadingFilter label="Department" value={departmentFilter} onChange={setDepartmentFilter} active={departmentFilter !== "all"}>
      <option value="all">All departments</option>
      {departments.map((department) => <option key={department.department_id} value={String(department.department_id)}>{department.department_name}</option>)}
    </HeadingFilter>
  );

  const statusHeading = (
    <HeadingFilter label="Status" value={statusFilter} onChange={setStatusFilter} active={statusFilter !== "all"}>
      <option value="all">All statuses</option>
      <option value="active">Active</option>
      <option value="inactive">Inactive</option>
    </HeadingFilter>
  );

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/80 text-left dark:border-white/[0.08] dark:bg-white/[0.04]">
              {[
                "Sr. No.",
                "Photo",
                "User",
                "Department",
                "Status",
                "Created",
                "Roles",
                "View Details",
                "Actions",
              ].map((heading) => (
                <th
                  key={heading}
                  scope="col"
                  aria-sort={heading === "User" && sortBy === "full_name" ? (sortOrder === "asc" ? "ascending" : "descending") : undefined}
                  className={`px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 ${
                    heading === "Actions" || heading === "View Details" || heading === "Photo" ? "text-center" : heading === "Sr. No." ? "w-20 whitespace-nowrap text-center" : ""
                  }`}
                >
                  {heading === "User" ? userHeading : heading === "Department" ? departmentHeading : heading === "Status" ? statusHeading : heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
            {loading ? (
              <tr><td colSpan={9}><UserSkeleton /></td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={9}><EmptyState /></td></tr>
            ) : users.map((user, index) => (
              <UserRow
                key={user.user_id}
                user={user}
                serial={serialNumber(index)}
                onEdit={onEdit}
                onDelete={onDelete}
                onRole={onRole}
                onStatusChange={onStatusChange}
                onView={setSelectedUser}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="divide-y divide-slate-100 lg:hidden dark:divide-white/[0.08]">
        <div className="flex flex-wrap items-start gap-4 bg-slate-50 p-4 text-slate-500 dark:bg-white/[0.04] dark:text-slate-400">
          {userHeading}
          {departmentHeading}
          {statusHeading}
        </div>
        {loading ? <UserSkeleton /> : users.length === 0 ? <EmptyState /> : users.map((user, index) => (
          <MobileUserCard
            key={user.user_id}
            user={user}
            serial={serialNumber(index)}
            onEdit={onEdit}
            onDelete={onDelete}
            onRole={onRole}
            onStatusChange={onStatusChange}
            onView={setSelectedUser}
          />
        ))}
      </div>
      {selectedUser && <UserDetailsModal user={selectedUser} onClose={() => setSelectedUser(null)} />}
    </>
  );
}

function HeadingFilter({ label, value, onChange, active, children }) {
  return (
    <div className={`inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider ${active ? "text-violet-600 dark:text-violet-300" : ""}`}>
      <span>{label}</span>
      <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-md border border-transparent hover:border-violet-200 hover:bg-violet-50 focus-within:ring-2 focus-within:ring-violet-500 dark:hover:border-violet-400/20 dark:hover:bg-violet-500/10">
        <ChevronDown size={14} aria-hidden="true" />
        <select aria-label={`Filter by ${label}`} title={`Filter by ${label}`} value={value} onChange={(event) => onChange(event.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0">
          {children}
        </select>
      </span>
      {active && <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />}
    </div>
  );
}

function UserRow({
  onView,
  user,
  serial,
  onEdit,
  onDelete,
  onRole,
  onStatusChange,
}) {
  return (
    <tr className="transition-colors duration-200 hover:bg-violet-50/50 dark:hover:bg-violet-400/[0.05]">
      <td className="w-20 px-3 py-2.5 text-center align-middle text-xs font-medium tabular-nums text-slate-500 dark:text-slate-400">{serial}</td>
      <td className="w-16 px-3 py-2.5"><div className="flex justify-center"><Avatar user={user} /></div></td>
      {/* User */}
      <td className="px-3 py-2.5">
        <div className="min-w-0">
          <div className="min-w-0">
            <p className="max-w-[180px] truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
              {user.full_name}
            </p>

            <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
              {user.employee_code || "—"}
            </p>
          </div>
        </div>
      </td>

      {/* Department */}
      <td className="px-3 py-2.5">
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/70 bg-slate-100/80 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300">
          <Building2 size={13} />
          {user.department_name || "Not assigned"}
        </span>
      </td>

      {/* Status */}
      <td className="px-3 py-2.5">
        <StatusToggle user={user} onChange={onStatusChange} />
      </td>

      {/* Created */}
      <td className="px-3 py-2.5 text-xs text-slate-500 dark:text-slate-400">
        {formatDate(user.created_at)}
      </td>

      {/* Roles */}
      <td className="px-3 py-2.5">
        <button
          type="button"
          onClick={() => onRole(user)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200/70 bg-violet-50 px-2.5 py-1.5 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-100 dark:border-violet-400/15 dark:bg-violet-400/10 dark:text-violet-300 dark:hover:bg-violet-400/20"
        >
          <ShieldCheck size={14} />
          Roles
        </button>
      </td>

      <td className="px-3 py-2.5 text-center"><button type="button" onClick={() => onView(user)} title="View personal details" aria-label={`View details of ${user.full_name}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-violet-200/70 bg-violet-50 text-violet-600 hover:bg-violet-100 dark:border-violet-400/15 dark:bg-violet-400/10 dark:text-violet-300"><Eye size={15} /></button></td>
      {/* Actions */}
      <td className="px-3 py-2.5">
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(user)}
            aria-label={`Edit ${user.full_name}`}
            title="Edit user"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200/60 bg-blue-50 text-blue-600 transition-all hover:bg-blue-100 hover:shadow-sm dark:border-blue-400/15 dark:bg-blue-400/10 dark:text-blue-400 dark:hover:bg-blue-400/20"
          >
            <Edit3 size={15} />
          </button>

          <button
            type="button"
            onClick={() => onDelete(user)}
            aria-label={`Delete ${user.full_name}`}
            title="Delete user"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200/60 bg-red-50 text-red-600 transition-all hover:bg-red-100 hover:shadow-sm dark:border-red-400/15 dark:bg-red-400/10 dark:text-red-400 dark:hover:bg-red-400/20"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function MobileUserCard({
  onView,
  user,
  serial,
  onEdit,
  onDelete,
  onRole,
  onStatusChange,
}) {
  return (
    <article className="p-4 transition-colors hover:bg-violet-50/30 dark:hover:bg-white/[0.03]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar user={user} />

          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-800 dark:text-slate-100">
              {user.full_name}
            </p>

            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {user.employee_code || "—"}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-400">Sr. {serial} · {user.employee_code || "—"}</p>
          </div>
        </div>

        <StatusToggle user={user} onChange={onStatusChange} />
      </div>

      <div className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-2 dark:text-slate-400">
        <p>
          Department: {user.department_name || "Not assigned"}
        </p>

        <p className="sm:col-span-2">
          Created: {formatDate(user.created_at)}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <ActionButton onClick={() => onView(user)} icon={<Eye size={14} />} text="View Details" className="border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5" />
        <ActionButton
          onClick={() => onEdit(user)}
          icon={<Edit3 size={14} />}
          text="Edit"
          className="border-blue-200/70 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:border-blue-400/15 dark:bg-blue-400/10 dark:text-blue-400 dark:hover:bg-blue-400/20"
        />

        <ActionButton
          onClick={() => onRole(user)}
          icon={<ShieldCheck size={14} />}
          text="Roles"
          className="border-violet-200/70 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-400/15 dark:bg-violet-400/10 dark:text-violet-300 dark:hover:bg-violet-400/20"
        />

        <ActionButton
          onClick={() => onDelete(user)}
          icon={<Trash2 size={14} />}
          text="Delete"
          className="border-red-200/70 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-400/15 dark:bg-red-400/10 dark:text-red-400 dark:hover:bg-red-400/20"
        />
      </div>
    </article>
  );
}

function Avatar({ user }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [user.photo_url]);
  const initials = (user.full_name || "User").trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  const avatarClass = "flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-violet-200/60 bg-violet-50 text-[11px] font-semibold text-violet-600 dark:border-violet-400/15 dark:bg-violet-400/10 dark:text-violet-300";
  if (!user.photo_url || failed) return <span className={avatarClass}>{initials}</span>;
  return <a href={user.photo_url} target="_blank" rel="noopener noreferrer" aria-label={`View photo of ${user.full_name}`} title="Open photo in new tab" className={`${avatarClass} transition hover:ring-2 hover:ring-violet-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500`}><img src={user.photo_url} onError={() => setFailed(true)} alt={`${user.full_name} profile`} loading="lazy" className="h-full w-full object-cover" /></a>;
}

function UserDetailsModal({ user, onClose }) {
  const dialogRef = useRef(null);
  useEffect(() => { dialogRef.current.showModal(); }, []);
  const details = [
    ["Email", user.email], ["Mobile", user.mobile],
    ["Gender", user.gender ? user.gender[0].toUpperCase() + user.gender.slice(1) : "Not provided"],
    ["Department", user.department_name || "Not assigned"],
    ["Status", user.status], ["Registered", formatDate(user.created_at)],
  ];
  return <dialog ref={dialogRef} onClose={onClose} aria-labelledby="user-details-title" className="fixed inset-0 m-auto h-fit max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[360px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-0 text-slate-700 shadow-2xl backdrop:bg-slate-950/50 backdrop:backdrop-blur-sm dark:border-white/10 dark:bg-[#191e2d] dark:text-slate-200">
    <div className="flex items-center justify-between border-b border-slate-100 px-3.5 py-2.5 dark:border-white/10"><h2 id="user-details-title" className="text-xs font-semibold">Personal Details</h2><button type="button" onClick={() => dialogRef.current.close()} aria-label="Close personal details" className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"><X size={15} /></button></div>
    <div className="p-3.5"><div className="mb-3 border-b border-slate-100 pb-2.5 dark:border-white/10"><p className="break-words text-xs font-semibold">{user.full_name}</p><p className="mt-0.5 text-[10px] text-slate-400">{user.employee_code || `User #${user.user_id}`}</p></div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5">{details.map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-[10px] text-slate-400">{label}</dt><dd className="mt-0.5 break-words text-[11px] leading-4">{value || "—"}</dd></div>)}<div className="col-span-2"><dt className="text-[10px] text-slate-400">Personal Address</dt><dd className="mt-0.5 whitespace-pre-wrap break-words text-[11px] leading-4">{user.personal_address || "Not provided"}</dd></div></dl>
    </div>
  </dialog>;
}

function ActionButton({
  onClick,
  icon,
  text,
  className,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all active:scale-[0.98] ${className}`}
    >
      {icon}
      {text}
    </button>
  );
}

function UserSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-5">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-white/10" />

          <div className="flex-1">
            <div className="h-4 w-40 max-w-full rounded bg-slate-200 dark:bg-white/10" />
            <div className="mt-2 h-3 w-56 max-w-full rounded bg-slate-100 dark:bg-white/[0.06]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-slate-400 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-500">
        <UsersRound size={26} />
      </div>

      <h3 className="mt-3 font-bold text-slate-800 dark:text-slate-100">
        No users found
      </h3>

      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Change the search or filter values.
      </p>
    </div>
  );
}

function StatusToggle({ user, onChange }) {
  const active = user.status === "active";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={`${user.full_name} status`}
      onClick={() => onChange(user)}
      className="inline-flex cursor-pointer items-center gap-2"
    >
      <span
        className={`relative inline-flex h-6 w-11 rounded-full transition-colors duration-200 ${
          active
            ? "bg-emerald-500"
            : "bg-slate-300 dark:bg-slate-600"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            active ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </span>

      <span
        className={`text-xs font-semibold ${
          active
            ? "text-emerald-700 dark:text-emerald-400"
            : "text-red-600 dark:text-red-400"
        }`}
      >
        {active ? "Active" : "Inactive"}
      </span>
    </button>
  );
}

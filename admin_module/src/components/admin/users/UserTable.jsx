
import {
  Building2,
  Edit3,
  ShieldCheck,
  Trash2,
  UsersRound,
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
}) {
  if (loading) return <UserSkeleton />;
  if (!users.length) return <EmptyState />;

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[1050px]">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/80 text-left dark:border-white/[0.08] dark:bg-white/[0.04]">
              {[
                "User",
                "Contact",
                "Department",
                "Status",
                "Created",
                "Roles",
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
            {users.map((user) => (
              <UserRow
                key={user.user_id}
                user={user}
                onEdit={onEdit}
                onDelete={onDelete}
                onRole={onRole}
                onStatusChange={onStatusChange}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="divide-y divide-slate-100 lg:hidden dark:divide-white/[0.08]">
        {users.map((user) => (
          <MobileUserCard
            key={user.user_id}
            user={user}
            onEdit={onEdit}
            onDelete={onDelete}
            onRole={onRole}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
    </>
  );
}

function UserRow({
  user,
  onEdit,
  onDelete,
  onRole,
  onStatusChange,
}) {
  return (
    <tr className="transition-colors duration-200 hover:bg-violet-50/50 dark:hover:bg-violet-400/[0.05]">
      {/* User */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar user={user} />

          <div className="min-w-0">
            <p className="font-semibold text-slate-800 dark:text-slate-100">
              {user.full_name}
            </p>

            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
              User ID #{user.user_id}
            </p>
          </div>
        </div>
      </td>

      {/* Contact */}
      <td className="px-4 py-3">
        <p className="text-sm text-slate-700 dark:text-slate-300">
          {user.email}
        </p>

        <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
          {user.mobile || "No mobile"}
        </p>
      </td>

      {/* Department */}
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/70 bg-slate-100/80 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300">
          <Building2 size={13} />
          {user.department_name || "Not assigned"}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <StatusToggle user={user} onChange={onStatusChange} />
      </td>

      {/* Created */}
      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
        {formatDate(user.created_at)}
      </td>

      {/* Roles */}
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={() => onRole(user)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200/70 bg-violet-50 px-2.5 py-1.5 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-100 dark:border-violet-400/15 dark:bg-violet-400/10 dark:text-violet-300 dark:hover:bg-violet-400/20"
        >
          <ShieldCheck size={14} />
          Roles
        </button>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
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
  user,
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
              {user.email}
            </p>
          </div>
        </div>

        <StatusToggle user={user} onChange={onStatusChange} />
      </div>

      <div className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-2 dark:text-slate-400">
        <p>
          Mobile: {user.mobile || "-"}
        </p>

        <p>
          Department: {user.department_name || "Not assigned"}
        </p>

        <p className="sm:col-span-2">
          Created: {formatDate(user.created_at)}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
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
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-200/60 bg-violet-50 text-sm font-bold text-violet-600 dark:border-violet-400/15 dark:bg-violet-400/10 dark:text-violet-300">
      {user.full_name?.charAt(0)?.toUpperCase() || "U"}
    </div>
  );
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

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
  onRole, onStatusChange,
}) {
  if (loading) return <UserSkeleton />;
  if (!users.length) return <EmptyState />;

  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[1050px]">
          <thead>
            <tr className="bg-slate-50 text-left">
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
                  className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 ${
                    heading === "Actions"
                      ? "text-right"
                      : ""
                  }`}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
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

    <div className="divide-y divide-slate-100 lg:hidden">
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
  onRole,onStatusChange,
}) {
  return (
    <tr className="transition hover:bg-indigo-50/30">
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-3">
          <Avatar user={user} />

          <div>
            <p className="font-semibold text-slate-800">
              {user.full_name}
            </p>

            <p className="text-xs text-slate-400">
              User ID #{user.user_id}
            </p>
          </div>
        </div>
      </td>

      <td className="px-4 py-2.5">
        <p className="text-sm text-slate-700">
          {user.email}
        </p>

        <p className="text-xs text-slate-400">
          {user.mobile || "No mobile"}
        </p>
      </td>

      <td className="px-4 py-2.5">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
          <Building2 size={13} />
          {user.department_name || "Not assigned"}
        </span>
      </td>

      <td className="px-4 py-2.5">
        <StatusToggle user={user} onChange={onStatusChange} />
      </td>

      <td className="px-4 py-2.5 text-sm text-slate-500">
        {formatDate(user.created_at)}
      </td>

      <td className="px-4 py-2.5">
        {/* Yahan py-2 aur px-2.5 karke button ko compact kiya hai */}
        <button
          onClick={() => onRole(user)}
          className="inline-flex items-center gap-1 rounded-lg bg-cyan-50 px-2.5 py-1.5 text-xs font-semibold text-cyan-700 hover:bg-cyan-100"
        >
          <ShieldCheck size={13} />
          Roles
        </button>
      </td>

      <td className="px-4 py-2.5">
        <div className="flex justify-end gap-1.5">
          <button
            onClick={() => onEdit(user)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
          >
            <Edit3 size={15} />
          </button>

          <button
            onClick={() => onDelete(user)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function MobileUserCard(props) {
  const { user, onEdit, onDelete, onRole,onStatusChange  } = props;

  return (
    <article className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar user={user} />

          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-800">
              {user.full_name}
            </p>

            <p className="truncate text-xs text-slate-500">
              {user.email}
            </p>
          </div>
        </div>

        <StatusToggle user={user} onChange={onStatusChange} />
      </div>

      <div className="mt-3 grid gap-1.5 text-xs text-slate-500 sm:grid-cols-2">
        <p>Mobile: {user.mobile || "-"}</p>

        <p>
          Department:{" "}
          {user.department_name || "Not assigned"}
        </p>

        <p className="sm:col-span-2">
          Created: {formatDate(user.created_at)}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <ActionButton
          onClick={() => onEdit(user)}
          icon={<Edit3 size={14} />}
          text="Edit"
          className="bg-blue-50 text-blue-600"
        />

        <ActionButton
          onClick={() => onRole(user)}
          icon={<ShieldCheck size={14} />}
          text="Roles"
          className="bg-cyan-50 text-cyan-700"
        />

        <ActionButton
          onClick={() => onDelete(user)}
          icon={<Trash2 size={14} />}
          text="Delete"
          className="bg-red-50 text-red-600"
        />
      </div>
    </article>
  );
}

function Avatar({ user }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 font-bold text-indigo-600 text-sm">
      {user.full_name?.charAt(0)?.toUpperCase() || "U"}
    </div>
  );
}

function StatusBadge({ status }) {
  const inactive = status === "inactive";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        inactive
          ? "bg-red-50 text-red-700"
          : "bg-emerald-50 text-emerald-700"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          inactive
            ? "bg-red-500"
            : "bg-emerald-500"
        }`}
      />

      {inactive ? "Inactive" : "Active"}
    </span>
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
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold ${className}`}
    >
      {icon}
      {text}
    </button>
  );
}

function UserSkeleton() {
  return (
    <div className="animate-pulse space-y-3 p-4">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="flex items-center gap-4"
        >
          <div className="h-9 w-9 rounded-xl bg-slate-200" />

          <div className="flex-1">
            <div className="h-4 w-40 rounded bg-slate-200" />
            <div className="mt-1.5 h-3 w-56 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <UsersRound size={26} />
      </div>

      <h3 className="mt-3 font-bold text-slate-800">
        No users found
      </h3>

      <p className="mt-1 text-xs text-slate-500">
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
      className="inline-flex items-center gap-2 cursor-pointer"
    >
      <span
        className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${
          active ? "bg-emerald-500" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            active ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </span>

      <span
        className={`text-xs font-semibold ${
          active ? "text-emerald-700" : "text-red-600"
        }`}
      >
        {active ? "Active" : "Inactive"}
      </span>
    </button>
  );
}
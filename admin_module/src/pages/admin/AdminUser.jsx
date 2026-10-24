import { useState } from "react";
import Swal from "sweetalert2";
import { RefreshCw, UsersRound, CalendarDays, Activity, Loader2 } from "lucide-react";
import useUsers from "../../hooks/useUsers";
import UserForm from "../../components/admin/users/UserForm";
import UserFilters from "../../components/admin/users/UserFilters";
import UserTable from "../../components/admin/users/UserTable";
import EditUserModal from "../../components/admin/users/EditUserModal";
import RoleModal from "../../components/admin/users/RoleModal";

export default function AdminUser() {
  const {
    users, pagination, stats, page, setPage, limit, setLimit,
    searchTerm, setSearchTerm, statusFilter, setStatusFilter, departmentFilter, setDepartmentFilter,
    departments,
    loading,
    refreshing,
    loadData,
    loadUsers,
    addUser,
    updateUser,
    removeUser,changeUserStatus
  } = useUsers();

  const [editingUser, setEditingUser] = useState(null);
  const [roleUser, setRoleUser] = useState(null);

  const formattedDate = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());

  async function handleStatusChange(user) {
  const nextStatus =
    user.status === "active" ? "inactive" : "active";

  const result = await Swal.fire({
    icon: "question",
    title: `${nextStatus === "active" ? "Activate" : "Deactivate"} user?`,
    text: `${user.full_name} ko ${nextStatus} karna hai?`,
    showCancelButton: true,
    confirmButtonText: "Yes, confirm",
    cancelButtonText: "Cancel",
  });

  if (!result.isConfirmed) return;

  try {
    await changeUserStatus(user.user_id, nextStatus);

    await Swal.fire({
      icon: "success",
      title: "Status updated",
      text: `${user.full_name} is now ${nextStatus}.`,
      timer: 1500,
      showConfirmButton: false,
    });
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Status update failed",
      text: error.message,
    });
  }
}
  async function handleDelete(user) {
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete this user?",
      text: `You are about to delete ${user.full_name}.`,
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
    });

    if (!result.isConfirmed) return;

    try {
      await removeUser(user.user_id);

      await Swal.fire({
        icon: "success",
        title: "User deleted",
        text: `${user.full_name} has been deleted successfully.`,
        timer: 1700,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "User not deleted",
        text: error.message,
        confirmButtonColor: "#4f46e5",
      });
    }
  }

  
return (
  <div className="w-full space-y-5 sm:space-y-6">

    {/* Premium User Management Header */}
    <section className="relative overflow-hidden rounded-2xl border border-violet-400/15 bg-gradient-to-r from-[#151a2b] via-[#211b40] to-[#151a2b] px-5 py-4 shadow-[0_8px_28px_rgba(39,29,90,0.22)] transition-shadow duration-300 hover:shadow-[0_12px_34px_rgba(39,29,90,0.30)] sm:px-6">

      <div className="pointer-events-none absolute -right-12 -top-20 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

        {/* Header information */}
        <div className="flex items-start gap-3 sm:items-center">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-violet-400/15 bg-violet-400/10 text-violet-300">
            <UsersRound size={20} strokeWidth={1.8} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-300">
                Administration
              </span>

              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </div>

            <h3 className="mt-0.5 text-lg font-bold tracking-tight text-white">
              User Management
            </h3>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] text-slate-300">
                <CalendarDays size={13} className="text-violet-300" />
                {formattedDate}
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] text-slate-300">
                <Activity size={13} className="text-violet-300" />
                Total Records: {stats.total}
              </span>
            </div>
          </div>
        </div>

        {/* Refresh */}
        <button
          type="button"
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-violet-400/20 bg-violet-500/15 px-4 py-2.5 text-xs font-semibold text-violet-100 shadow-sm transition-all duration-200 hover:border-violet-400/40 hover:bg-violet-500/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
        >
          {refreshing ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <RefreshCw size={15} />
          )}
          Refresh Users
        </button>
      </div>
    </section>

    {/* User Statistics */}
    <div className="grid grid-cols-3 gap-3">
      {[ ["Total users", stats.total], ["Active", stats.active], ["Inactive", stats.inactive] ].map(([label, count]) => (
        <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#191e2d]">
          <p className="text-xs text-slate-500">{label}</p>
          <p className="mt-1 text-xl font-semibold text-slate-800 dark:text-white">{count}</p>
        </div>
      ))}
    </div>

    {/* Add User Form */}
    <UserForm
      users={users}
      departments={departments}
      onAddUser={addUser}
    />

    {/* User Table & Filters */}
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_6px_24px_rgba(15,23,42,0.10)] transition-shadow duration-300 hover:shadow-[0_12px_32px_rgba(15,23,42,0.14)] dark:border-white/[0.08] dark:bg-[#191e2d] dark:shadow-[0_8px_28px_rgba(0,0,0,0.30)] dark:hover:shadow-[0_14px_36px_rgba(0,0,0,0.42)]">

      <UserFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        departmentFilter={departmentFilter}
        setDepartmentFilter={setDepartmentFilter}
        departments={departments}
      />

      <UserTable
        users={users}
        loading={loading}
        onEdit={setEditingUser}
        onDelete={handleDelete}
        onRole={setRoleUser}
        onStatusChange={handleStatusChange}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-white/10">
        <span>Showing {pagination.total === 0 ? 0 : (pagination.page - 1) * limit + 1}–{Math.min(pagination.page * limit, pagination.total)} of {pagination.total} matching users</span>
        <div className="flex items-center gap-3">
          <select aria-label="Users per page" value={limit} onChange={(event) => setLimit(Number(event.target.value))} disabled={loading} className="rounded border bg-transparent p-1">
            <option value={10}>10 / page</option><option value={20}>20 / page</option><option value={50}>50 / page</option>
          </select>
          <button type="button" disabled={loading || page <= 1} onClick={() => setPage(page - 1)} className="rounded border px-3 py-1.5 disabled:opacity-40">Previous</button>
          <span>Page {pagination.page} / {pagination.totalPages}</span>
          <button type="button" disabled={loading || page >= pagination.totalPages} onClick={() => setPage(page + 1)} className="rounded border px-3 py-1.5 disabled:opacity-40">Next</button>
        </div>
      </div>
    </section>

    {/* Edit User Modal */}
    {editingUser && (
      <EditUserModal
        user={editingUser}
        users={users}
        departments={departments}
        onUpdate={updateUser}
        onClose={() => setEditingUser(null)}
      />
    )}

    {/* Role Modal */}
    {roleUser && (
      <RoleModal
        user={roleUser}
        onChange={loadUsers}
        onClose={() => setRoleUser(null)}
      />
    )}

  </div>
);
}
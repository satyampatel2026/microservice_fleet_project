// src/pages/admin/AdminUser.jsx

import { useMemo, useState } from "react";
import Swal from "sweetalert2";

import { RefreshCw, UsersRound, CalendarDays, Activity, Loader2 } from "lucide-react";

import useUsers from "../../hooks/useUsers";

import UserStats from "../../components/admin/users/UserStats";
import UserForm from "../../components/admin/users/UserForm";
import UserFilters from "../../components/admin/users/UserFilters";
import UserTable from "../../components/admin/users/UserTable";
import EditUserModal from "../../components/admin/users/EditUserModal";
import RoleModal from "../../components/admin/users/RoleModal";

export default function AdminUser() {
  const {
    users,
    departments,
    loading,
    refreshing,
    loadData,
    loadUsers,
    addUser,
    updateUser,
    removeUser,changeUserStatus
  } = useUsers();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const [editingUser, setEditingUser] = useState(null);
  const [roleUser, setRoleUser] = useState(null);

  const formattedDate = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());

  const filteredUsers = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const matchSearch =
        !search ||
        user.full_name?.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search) ||
        String(user.mobile || "").includes(search) ||
        String(user.user_id || "").includes(search);

      const currentStatus =
        user.status === "inactive" ? "inactive" : "active";

      const matchStatus =
        statusFilter === "all" || currentStatus === statusFilter;

      const matchDepartment =
        departmentFilter === "all" ||
        String(user.department_id || "") === departmentFilter;

      return matchSearch && matchStatus && matchDepartment;
    });
  }, [users, searchTerm, statusFilter, departmentFilter]);

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
      html: `
        You are about to delete
        <strong>${user.full_name}</strong>.
        <br />
        This action cannot be undone.
      `,
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
    <div className="min-h-screen bg-slate-100 px-4 py-4 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-4">

        {/* Modern Compact Header */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-5 py-4 border border-slate-800 shadow-sm">
          <div className="relative flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-white/10 bg-white/10 p-2 text-indigo-400">
                <UsersRound size={20} />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400">
                    Administration
                  </span>
                  <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>

                <h3 className="text-lg font-bold tracking-tight text-white sm:text-xl">
                  User Management
                </h3>

                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                  <span className="inline-flex items-center gap-1 rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[14px]">
                    <CalendarDays size={12} className="text-slate-400" />
                    {formattedDate}
                  </span>

                  <span className="inline-flex items-center gap-1 rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[14px]">
                    <Activity size={12} className="text-indigo-400" />
                    Total Records: {users.length}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-white/20 active:scale-95 disabled:opacity-60 cursor-pointer self-start sm:self-auto"
            >
              {refreshing ? (
                <Loader2 size={14} className="animate-spin text-indigo-300" />
              ) : (
                <RefreshCw size={14} className="text-indigo-300" />
              )}
              Refresh Users
            </button>
          </div>
        </section>

        {/* User Stats */}
        <UserStats
          users={users}
          filteredUsers={filteredUsers}
        />

        {/* User Form Section */}
        <UserForm
          users={users}
          departments={departments}
          onAddUser={addUser}
        />

        {/* Table & Filters Section */}
        <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
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
  users={filteredUsers}
  loading={loading}
  onEdit={setEditingUser}
  onDelete={handleDelete}
  onRole={setRoleUser}
  onStatusChange={handleStatusChange}
/>

          {!loading && users.length > 0 && (
            <div className="border-t border-slate-200/80 bg-slate-50/70 px-4 py-3 text-xs text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-700">
                {filteredUsers.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-700">
                {users.length}
              </span>{" "}
              users
            </div>
          )}
        </section>
      </div>

      {editingUser && (
        <EditUserModal
          user={editingUser}
          users={users}
          departments={departments}
          onUpdate={updateUser}
          onClose={() => setEditingUser(null)}
        />
      )}

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
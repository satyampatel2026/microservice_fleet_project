import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { RefreshCw, UsersRound, Plus, Loader2, Search, X,UserPlus } from "lucide-react";
import useUsers from "../../hooks/useUsers";
import UserForm from "../../components/admin/users/UserForm";
import UserTable from "../../components/admin/users/UserTable";
import EditUserModal from "../../components/admin/users/EditUserModal";
import RoleModal from "../../components/admin/users/RoleModal";

export default function AdminUser() {
  const {
    users, pagination, stats, page, setPage, limit, setLimit,
    sortBy, sortOrder, setSorting,
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

  const [addOpen, setAddOpen] = useState(false);
  const [addingUser, setAddingUser] = useState(false);
  const addLock = useRef(false);

  // Existing addUser API/function hi use hogi.
  // Failure par error UserForm ko milega aur modal khula rahega.
  async function handleAddUser(values) {
    if (addLock.current) return;
    addLock.current = true;
    setAddingUser(true);
    try {
      await addUser(values);
    } finally {
      addLock.current = false;
      setAddingUser(false);
    }
  }

  function closeAddModal() {
    if (!addLock.current) setAddOpen(false);
  }

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
  <div className="w-full min-w-0 space-y-3">

    {/* Heading, counts aur actions ek compact row mein. */}
    <header className="flex flex-wrap items-center gap-x-4 gap-y-3">
      <div className="flex shrink-0 items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300"><UsersRound size={17} /></span>
        <h3 className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">User Management</h3>
      </div>

      <div className="order-3 grid w-full grid-cols-3 gap-2 sm:order-none sm:flex sm:w-auto sm:items-center">
        {[
          { label: "Total", count: stats.total, dot: "bg-violet-500", color: "text-violet-700 dark:text-violet-300" },
          { label: "Active", count: stats.active, dot: "bg-emerald-500", color: "text-emerald-700 dark:text-emerald-400" },
          { label: "Inactive", count: stats.inactive, dot: "bg-slate-400", color: "text-slate-600 dark:text-slate-300" },
        ].map((item) => (
          <div key={item.label} className="inline-flex h-9 min-w-0 items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-2.5 shadow-sm sm:min-w-[94px] dark:border-white/10 dark:bg-[#191e2d]">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-500 dark:text-slate-400"><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${item.dot}`} />{item.label}</span>
            <span className={`text-sm font-semibold tabular-nums ${item.color}`}>{item.count}</span>
          </div>
        ))}
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <button type="button" onClick={() => loadData(true)} disabled={refreshing || loading || addingUser} aria-label="Refresh users" title="Refresh users" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
          {refreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
        </button>
        <button type="button" onClick={() => setAddOpen(true)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-violet-600 px-3 text-[11px] font-semibold text-white shadow-sm transition hover:bg-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500">
          <UserPlus size={14} />Add User
        </button>
      </div>
    </header>

    {/* User Table & Filters */}
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#191e2d]">

      {/* Search bar yahin rahegi. Filters table headings mein hain. */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-3 py-2.5 dark:border-white/10">
        <div className="relative w-full sm:max-w-sm">
          <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-2.5 text-slate-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            maxLength={100}
            aria-label="Search users by name, email, mobile or ID"
            placeholder="Search name, email, mobile or ID..."
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-xs text-slate-700 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
          />
        </div>
        {departmentFilter !== "all" && <span className="rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">Department: {departments.find((department) => String(department.department_id) === departmentFilter)?.department_name || departmentFilter}</span>}
        {statusFilter !== "all" && <span className="rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">Status: {statusFilter}</span>}
        {(searchTerm || departmentFilter !== "all" || statusFilter !== "all") && (
          <button type="button" onClick={() => { setSearchTerm(""); setDepartmentFilter("all"); setStatusFilter("all"); }} className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:text-violet-600 dark:text-slate-400"><X size={13} />Clear</button>
        )}
      </div>

      <UserTable
        departments={departments}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        departmentFilter={departmentFilter}
        setDepartmentFilter={setDepartmentFilter}
        users={users}
        page={pagination.page}
        limit={limit}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={setSorting}
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

    {/* Add form ab table ke upar permanent nahi rahega. */}
    {addOpen && (
      <AddUserModal busy={addingUser} onClose={closeAddModal}>
        <UserForm
          users={users}
          departments={departments}
          onAddUser={handleAddUser}
          onSuccess={closeAddModal}
        />
      </AddUserModal>
    )}

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

// Same file mein modal shell. Existing UserForm ki validation unchanged hai.
function AddUserModal({ children, busy, onClose }) {
  const modalRef = useRef(null);
  const busyRef = useRef(busy);
  const closeRef = useRef(onClose);
  busyRef.current = busy;
  closeRef.current = onClose;

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const firstInput = modalRef.current.querySelector("input:not([disabled]), select:not([disabled]), button");
    firstInput?.focus();

    function handleKey(event) {
      // UserForm ke SweetAlert par keyboard control usi ko dena hai.
      if (Swal.isVisible()) return;
      if (event.key === "Escape") {
        event.preventDefault();
        if (!busyRef.current) closeRef.current();
      }
      if (event.key === "Tab") {
        const controls = Array.from(modalRef.current.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]')).filter((element) => element.getClientRects().length > 0);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (!first) { event.preventDefault(); modalRef.current.focus(); return; }
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    }

    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5">
      <section ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="add-user-title" tabIndex={-1} className="flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl outline-none dark:border-white/10 dark:bg-[#191e2d]">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-white/10">
          <div className="flex items-center gap-2.5"><span className="rounded-lg bg-violet-50 p-2 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300"><Plus size={17} /></span><div><h2 id="add-user-title" className="text-sm font-semibold text-slate-900 dark:text-slate-100">Add New User</h2></div></div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close add user form" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/5"><X size={17} /></button>
        </div>
        <div className="min-h-0 overflow-y-auto p-3 sm:p-4">{children}</div>

      </section>
    </div>
  );
}

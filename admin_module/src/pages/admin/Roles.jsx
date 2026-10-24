import { useMemo, useState } from "react";
import Swal from "sweetalert2";
import { RefreshCw, ShieldCheck } from "lucide-react";
import useRoles from "../../hooks/useRoles";
import RoleStats from "../../components/admin/roles/RoleStats";
import RoleForm from "../../components/admin/roles/RoleForm";
import RoleList from "../../components/admin/roles/RoleList";
import EditRoleModal from "../../components/admin/roles/EditRoleModal";

function getRoleName(role) {
  if (!role) return "";
  return typeof role.role_name === "object"
    ? role.role_name?.name || ""
    : role.role_name || "";
}

export default function Roles() {
  const {
    roles,
    loading,
    refreshing,
    loadRoles,
    createRole,
    editRole,
    removeRole,
  } = useRoles();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState(null);

  const filteredRoles = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return roles;

    return roles.filter((role) => {
      const name = getRoleName(role).toLowerCase();
      const id = String(role.role_id || "");
      return name.includes(keyword) || id.includes(keyword);
    });
  }, [roles, searchTerm]);

  async function handleDelete(role) {
    const roleName = getRoleName(role);

    const result = await Swal.fire({
      icon: "warning",
      title: "Delete this role?",
      html: `Delete <strong>${roleName}</strong>?<br/>This action cannot be undone.`,
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) return;

    try {
      await removeRole(role.role_id);
      await Swal.fire({
        icon: "success",
        title: "Role deleted",
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Role not deleted",
        text: error.message,
      });
    }
  }

return (
  <div className="w-full space-y-5 sm:space-y-6">
    {/* Page Header */}
    <section className="relative overflow-hidden rounded-2xl border border-violet-400/15 bg-gradient-to-r from-[#151a2b] via-[#211b40] to-[#151a2b] px-5 py-4 shadow-[0_8px_28px_rgba(39,29,90,0.22)] transition-shadow duration-300 hover:shadow-[0_12px_34px_rgba(39,29,90,0.30)] sm:px-6">
      <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-3">
          {/* Header Icon */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/20 bg-white/10 text-violet-200">
            <ShieldCheck size={20} strokeWidth={1.8} />
          </div>

          {/* Header Text */}
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-300">
              Access Control
            </p>

            <h3 className="mt-0.5 text-lg font-bold tracking-tight text-white sm:text-xl">
              Roles
            </h3>

            <p className="mt-1 text-xs leading-relaxed text-slate-300">
              Create and manage system roles used across your fleet management platform.
            </p>
          </div>
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={() => loadRoles(true)}
          disabled={refreshing}
          className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-violet-400/25 bg-violet-500/20 px-4 py-2.5 text-xs font-semibold text-white transition-all duration-200 hover:bg-violet-500/35 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
        >
          <RefreshCw
            size={15}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>
    </section>

    {/* Role Statistics */}
    <RoleStats
      roles={roles}
      filteredRoles={filteredRoles}
      searchTerm={searchTerm}
    />

    {/* Role Form and List */}
    <div className="grid items-start gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <RoleForm
        roles={roles}
        onAdd={createRole}
      />

      <RoleList
        roles={filteredRoles}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        loading={loading}
        onEdit={setSelectedRole}
        onDelete={handleDelete}
      />
    </div>

    {/* Edit Role Modal */}
    {selectedRole && (
      <EditRoleModal
        role={selectedRole}
        roles={roles}
        onUpdate={editRole}
        onClose={() => setSelectedRole(null)}
      />
    )}
  </div>
);

}
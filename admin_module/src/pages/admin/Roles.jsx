import { useMemo, useState } from "react";
import Swal from "sweetalert2";
import { RefreshCw, ShieldCheck } from "lucide-react";
import useRoles from "../../hooks/useRoles";
import RoleForm from "../../components/admin/roles/RoleForm";
import RoleList from "../../components/admin/roles/RoleList";
import EditRoleModal from "../../components/admin/roles/EditRoleModal";

function getRoleName(role) {
  if (!role) return "";
  return typeof role.role_name === "object" ? role.role_name?.name || "" : role.role_name || "";
}

export default function Roles() {
  const { roles, loading, refreshing, loadRoles, createRole, editRole, removeRole } = useRoles();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState(null);

  const filteredRoles = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return roles;
    return roles.filter((role) =>
      getRoleName(role).toLowerCase().includes(keyword) ||
      String(role.role_id || "").includes(keyword) ||
      role.role_code?.toLowerCase().includes(keyword)
    );
  }, [roles, searchTerm]);

  async function handleDelete(role) {
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete this role?",
      text: `Delete ${getRoleName(role)}? This action cannot be undone.`,
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
    });
    if (!result.isConfirmed) return;
    try {
      await removeRole(role.role_id);
      await Swal.fire({ icon: "success", title: "Role deleted", timer: 1600, showConfirmButton: false });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Role not deleted", text: error.message });
    }
  }

  return (
    <div className="-mt-2 w-full min-w-0 space-y-3">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300"><ShieldCheck size={17} /></span>
          <h3 className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">Roles</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[{ label: "Total", count: roles.length }, { label: "Showing", count: filteredRoles.length }].map((item) => (
            <div key={item.label} className="inline-flex h-9 min-w-[94px] items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-2.5 shadow-sm dark:border-white/10 dark:bg-[#191e2d]">
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{item.label}</span>
              <span className="text-sm font-semibold tabular-nums text-violet-700 dark:text-violet-300">{item.count}</span>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => loadRoles(true)} disabled={refreshing || loading} title="Refresh roles" aria-label="Refresh roles" className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-slate-400"><RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /></button>
      </header>

      <div className="grid items-start gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <RoleForm roles={roles} onAdd={createRole} />
        <RoleList roles={filteredRoles} searchTerm={searchTerm} setSearchTerm={setSearchTerm} loading={loading} onEdit={setSelectedRole} onDelete={handleDelete} />
      </div>

      {selectedRole && <EditRoleModal role={selectedRole} roles={roles} onUpdate={editRole} onClose={() => setSelectedRole(null)} />}
    </div>
  );
}

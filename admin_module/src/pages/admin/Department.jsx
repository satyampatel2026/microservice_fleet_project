import { useMemo, useState } from "react";
import Swal from "sweetalert2";
import { Building2, RefreshCw } from "lucide-react";
import useDepartments from "../../hooks/useDepartments";
import DepartmentForm from "../../components/admin/departments/DepartmentForm";
import DepartmentList from "../../components/admin/departments/DepartmentList";
import EditDepartmentModal from "../../components/admin/departments/EditDepartmentModal";

export default function Department() {
  const {
    departments,
    loading,
    refreshing,
    loadDepartments,
    createDepartment,
    editDepartment,
    removeDepartment,
  } = useDepartments();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  const filteredDepartments = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return departments;

    return departments.filter(
      (department) =>
        department.department_name?.toLowerCase().includes(keyword) ||
        String(department.department_id).includes(keyword) ||
        department.department_code?.toLowerCase().includes(keyword)
    );
  }, [departments, searchTerm]);

  async function handleDelete(department) {
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete this department?",
      text: `Delete ${department.department_name}? This action cannot be undone.`,
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) return;

    try {
      await removeDepartment(department.department_id);
      await Swal.fire({
        icon: "success",
        title: "Department deleted",
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Department not deleted",
        text: error.message,
      });
    }
  }
  
return (
  <div className="-mt-2 w-full min-w-0 space-y-3">
    {/* Heading ke saath chhote count cards. Status nahi hai. */}
    <header className="flex flex-wrap items-center gap-x-4 gap-y-3">
      <div className="flex shrink-0 items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300"><Building2 size={17} /></span>
        <h3 className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">Departments</h3>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {[
          { label: "Total", count: departments.length },
          { label: "Showing", count: filteredDepartments.length },
        ].map((item) => (
          <div key={item.label} className="inline-flex h-9 min-w-[94px] items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-2.5 shadow-sm dark:border-white/10 dark:bg-[#191e2d]">
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{item.label}</span>
            <span className="text-sm font-semibold tabular-nums text-violet-700 dark:text-violet-300">{item.count}</span>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => loadDepartments(true)} disabled={refreshing || loading} title="Refresh departments" aria-label="Refresh departments" className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
        <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
      </button>
    </header>

    {/* Department Form and List */}
    <div className="grid items-start gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <DepartmentForm
        departments={departments}
        onAdd={createDepartment}
      />

      <DepartmentList
        departments={filteredDepartments}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        loading={loading}
        onEdit={setSelectedDepartment}
        onDelete={handleDelete}
      />
    </div>

    {/* Edit Department Modal */}
    {selectedDepartment && (
      <EditDepartmentModal
        department={selectedDepartment}
        departments={departments}
        onUpdate={editDepartment}
        onClose={() => setSelectedDepartment(null)}
      />
    )}
  </div>
);

}

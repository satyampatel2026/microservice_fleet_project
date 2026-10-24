import { useMemo, useState } from "react";
import Swal from "sweetalert2";
import { Building2, RefreshCw } from "lucide-react";
import useDepartments from "../../hooks/useDepartments";
import DepartmentStats from "../../components/admin/departments/DepartmentStats";
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
        String(department.department_id).includes(keyword)
    );
  }, [departments, searchTerm]);

  async function handleDelete(department) {
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete this department?",
      html: `Delete <strong>${department.department_name}</strong>?<br/>This action cannot be undone.`,
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
  <div className="w-full space-y-5 sm:space-y-6">
    {/* Page Header */}
    <section className="relative overflow-hidden rounded-2xl border border-violet-400/15 bg-gradient-to-r from-[#151a2b] via-[#211b40] to-[#151a2b] px-5 py-4 shadow-[0_8px_28px_rgba(39,29,90,0.22)] transition-shadow duration-300 hover:shadow-[0_12px_34px_rgba(39,29,90,0.30)] sm:px-6">
      <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-3">
          {/* Header Icon */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/20 bg-white/10 text-violet-200">
            <Building2 size={20} strokeWidth={1.8} />
          </div>

          {/* Header Text */}
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-300">
              Organization Setup
            </p>

            <h3 className="mt-0.5 text-lg font-bold tracking-tight text-white sm:text-xl">
              Departments
            </h3>

            <p className="mt-1 text-xs leading-relaxed text-slate-300">
              Create and manage departments for your fleet management organization.
            </p>
          </div>
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={() => loadDepartments(true)}
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

    {/* Department Statistics */}
    <DepartmentStats
      departments={departments}
      filteredDepartments={filteredDepartments}
      searchTerm={searchTerm}
    />

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
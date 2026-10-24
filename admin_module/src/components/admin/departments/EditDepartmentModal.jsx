
import { useFormik } from "formik";
import Swal from "sweetalert2";
import {
  Building2,
  Edit3,
  Loader2,
  X,
} from "lucide-react";

import {
  departmentValidationSchema,
} from "../../../validations/departmentValidation";

export default function EditDepartmentModal({
  department,
  departments,
  onUpdate,
  onClose,
}) {
  const formik = useFormik({
    initialValues: {
      department_name: department.department_name || "",
    },

    validationSchema: departmentValidationSchema,

    onSubmit: async (values, helpers) => {
      try {
        const name = values.department_name.trim();

        const exists = departments.some(
          (item) =>
            item.department_id !== department.department_id &&
            item.department_name?.toLowerCase() ===
              name.toLowerCase()
        );

        if (exists) {
          helpers.setFieldError(
            "department_name",
            "This department already exists"
          );
          return;
        }

        await onUpdate(department.department_id, name);

        await Swal.fire({
          icon: "success",
          title: "Department updated",
          timer: 1600,
          showConfirmButton: false,
        });

        onClose();
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Department not updated",
          text: error.message,
        });
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const error =
    formik.touched.department_name &&
    formik.errors.department_name;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Modal Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-department-title"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.30)] dark:border-white/10 dark:bg-[#191e2d] dark:shadow-[0_24px_70px_rgba(0,0,0,0.55)]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-4 dark:border-white/[0.08] dark:bg-white/[0.03]">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-200/70 bg-violet-50 text-violet-600 dark:border-violet-400/15 dark:bg-violet-400/10 dark:text-violet-300">
              <Edit3 size={19} strokeWidth={1.8} />
            </div>

            <div className="min-w-0">
              <h2
                id="edit-department-title"
                className="text-base font-bold tracking-tight text-slate-900 dark:text-white"
              >
                Edit department
              </h2>

              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Department ID: #{department.department_id}
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close edit department modal"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Edit Form */}
        <form
          onSubmit={formik.handleSubmit}
          noValidate
          className="p-5"
        >
          <label
            htmlFor="edit_department_name"
            className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Department name
          </label>

          <div className="relative">
            <Building2
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            />

            <input
              id="edit_department_name"
              name="department_name"
              autoFocus
              value={formik.values.department_name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              aria-invalid={Boolean(error)}
              className={`w-full rounded-xl border bg-slate-50/80 py-2.5 pl-10 pr-3.5 text-sm text-slate-800 outline-none transition-all duration-200 focus:bg-white focus:ring-4 dark:bg-white/[0.04] dark:text-slate-100 dark:focus:bg-white/[0.06] ${
                error
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500/10 dark:border-red-400"
                  : "border-slate-200 hover:border-slate-300 focus:border-violet-500 focus:ring-violet-500/10 dark:border-white/10 dark:hover:border-white/20 dark:focus:border-violet-400 dark:focus:ring-violet-400/10"
              }`}
            />
          </div>

          {/* Validation Error */}
          {error && (
            <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
              {formik.errors.department_name}
            </p>
          )}

          {/* Modal Actions */}
          <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:bg-white/10"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={formik.isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-[0_4px_12px_rgba(124,58,237,0.25)] transition-all duration-200 hover:bg-violet-700 hover:shadow-[0_6px_18px_rgba(124,58,237,0.35)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {formik.isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Edit3 size={15} />
              )}

              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

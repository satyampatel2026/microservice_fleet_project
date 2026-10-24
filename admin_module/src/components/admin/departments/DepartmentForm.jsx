
import { useFormik } from "formik";
import Swal from "sweetalert2";
import { Building2, Loader2, Plus } from "lucide-react";
import { departmentValidationSchema } from "../../../validations/departmentValidation";

export default function DepartmentForm({ departments, onAdd }) {
  const formik = useFormik({
    initialValues: {
      department_name: "",
    },

    validationSchema: departmentValidationSchema,

    onSubmit: async (values, helpers) => {
      try {
        const name = values.department_name.trim();

        const exists = departments.some(
          (department) =>
            department.department_name?.toLowerCase() ===
            name.toLowerCase()
        );

        if (exists) {
          helpers.setFieldError(
            "department_name",
            "This department already exists"
          );
          return;
        }

        await onAdd(name);
        helpers.resetForm();

        await Swal.fire({
          icon: "success",
          title: "Department added",
          text: `"${name}" has been added successfully.`,
          timer: 1700,
          showConfirmButton: false,
        });
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Department not added",
          text: error.message,
        });
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const hasError =
    formik.touched.department_name &&
    formik.errors.department_name;

  return (
    <section className="h-fit rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,0.10)] transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_12px_32px_rgba(15,23,42,0.16)] dark:border-white/[0.08] dark:bg-[#191e2d] dark:shadow-[0_8px_28px_rgba(0,0,0,0.30)] dark:hover:border-violet-400/20 dark:hover:shadow-[0_14px_36px_rgba(0,0,0,0.42)]">
      {/* Heading */}
      <div className="mb-5">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-violet-200/70 bg-violet-50 text-violet-600 dark:border-violet-400/15 dark:bg-violet-400/10 dark:text-violet-300">
          <Plus size={20} strokeWidth={1.8} />
        </div>

        <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
          Add department
        </h3>

        <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          Add a unique department to your organization.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={formik.handleSubmit} noValidate>
        <label
          htmlFor="department_name"
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
            id="department_name"
            name="department_name"
            placeholder="Example: Operations"
            value={formik.values.department_name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            aria-invalid={Boolean(hasError)}
            className={`w-full rounded-xl border bg-slate-50/80 py-2.5 pl-10 pr-3.5 text-sm text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 focus:bg-white focus:ring-4 dark:bg-white/[0.04] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-white/[0.06] ${
              hasError
                ? "border-red-400 focus:border-red-500 focus:ring-red-500/10 dark:border-red-400"
                : "border-slate-200 hover:border-slate-300 focus:border-violet-500 focus:ring-violet-500/10 dark:border-white/10 dark:hover:border-white/20 dark:focus:border-violet-400 dark:focus:ring-violet-400/10"
            }`}
          />
        </div>

        {/* Validation Error */}
        {hasError && (
          <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
            {formik.errors.department_name}
          </p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={formik.isSubmitting}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-[0_4px_12px_rgba(124,58,237,0.25)] transition-all duration-200 hover:bg-violet-700 hover:shadow-[0_6px_18px_rgba(124,58,237,0.35)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {formik.isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Adding department...
            </>
          ) : (
            <>
              <Plus size={16} />
              Add department
            </>
          )}
        </button>
      </form>
    </section>
  );
}

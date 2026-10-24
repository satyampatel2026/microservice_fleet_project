
import { useFormik } from "formik";
import Swal from "sweetalert2";
import {
  Edit3,
  Loader2,
  Mail,
  UserRound,
  X,
} from "lucide-react";
import { editUserSchema } from "../../../validations/userValidation";

export default function EditUserModal({
  user,
  users,
  departments,
  onUpdate,
  onClose,
}) {
  const formik = useFormik({
    initialValues: {
      full_name: user.full_name || "",
      email: user.email || "",
      department_id: String(user.department_id || ""),
      status: user.status === "inactive" ? "inactive" : "active",
    },

    validationSchema: editUserSchema,

    onSubmit: async (values, helpers) => {
      try {
        const duplicateEmail = users.some(
          (item) =>
            item.user_id !== user.user_id &&
            item.email?.toLowerCase() === values.email.toLowerCase()
        );

        if (duplicateEmail) {
          helpers.setFieldError(
            "email",
            "This email is already registered"
          );
          return;
        }

        await onUpdate(user.user_id, values);

        await Swal.fire({
          icon: "success",
          title: "User updated",
          text: "User details updated successfully.",
          timer: 1700,
          showConfirmButton: false,
        });

        onClose();
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "User not updated",
          text: error.message,
        });
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  return (
    <Modal
      title="Edit user"
      subtitle={`User ID #${user.user_id}`}
      onClose={onClose}
    >
      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <Field
          label="Full name"
          name="full_name"
          icon={<UserRound size={16} />}
          formik={formik}
        />

        <Field
          label="Email address"
          name="email"
          type="email"
          icon={<Mail size={16} />}
          formik={formik}
        />

        <Select
          label="Department"
          name="department_id"
          formik={formik}
        >
          <option value="">Select department</option>

          {departments.map((department) => (
            <option
              key={department.department_id}
              value={department.department_id}
            >
              {department.department_name}
            </option>
          ))}
        </Select>

        <Select label="Account status" name="status" formik={formik}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-white/[0.08]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:bg-white/10"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={formik.isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-[0_4px_12px_rgba(124,58,237,0.25)] transition-all hover:bg-violet-700 hover:shadow-[0_6px_16px_rgba(124,58,237,0.35)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {formik.isSubmitting ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Edit3 size={15} />
            )}
            Save changes
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({ title, subtitle, children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-user-title"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.30)] dark:border-white/10 dark:bg-[#191e2d] dark:shadow-[0_24px_70px_rgba(0,0,0,0.55)]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-5 py-4 dark:border-white/[0.08] dark:bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300">
              <Edit3 size={17} />
            </div>

            <div>
              <h2
                id="edit-user-title"
                className="text-sm font-bold text-slate-900 dark:text-white"
              >
                {title}
              </h2>

              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close edit user modal"
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-200/70 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="max-h-[75vh] overflow-y-auto p-5">
          {children}
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, type = "text", icon, formik }) {
  const error = formik.touched[name] && formik.errors[name];

  return (
    <div>
      <label
        htmlFor={`edit-${name}`}
        className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
      >
        {label}
      </label>

      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
          {icon}
        </span>

        <input
          id={`edit-${name}`}
          name={name}
          type={type}
          value={formik.values[name]}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          aria-invalid={Boolean(error)}
          className={`w-full rounded-xl border bg-slate-50/70 py-2.5 pl-10 pr-3 text-xs text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-violet-500/15 dark:bg-white/[0.04] dark:text-white dark:focus:bg-white/[0.06] ${
            error
              ? "border-red-400 focus:border-red-500"
              : "border-slate-200 focus:border-violet-500 dark:border-white/10 dark:focus:border-violet-400"
          }`}
        />
      </div>

      {error && (
        <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

function Select({ label, name, formik, children }) {
  const error = formik.touched[name] && formik.errors[name];

  return (
    <div>
      <label
        htmlFor={`edit-${name}`}
        className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
      >
        {label}
      </label>

      <select
        id={`edit-${name}`}
        name={name}
        value={formik.values[name]}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        aria-invalid={Boolean(error)}
        className={`w-full cursor-pointer rounded-xl border bg-slate-50/70 px-3 py-2.5 text-xs text-slate-800 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-violet-500/15 dark:bg-[#242a3b] dark:text-white dark:focus:bg-[#242a3b] ${
          error
            ? "border-red-400 focus:border-red-500"
            : "border-slate-200 focus:border-violet-500 dark:border-white/10 dark:focus:border-violet-400"
        }`}
      >
        {children}
      </select>

      {error && (
        <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

// src/components/admin/users/RoleModal.jsx

import { useEffect, useState } from "react";
import { useFormik } from "formik";
import Swal from "sweetalert2";

import {
  Loader2,
  Plus,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

import { roleSchema } from "../../../validations/userValidation";

import {
  getRoles,
  getUserRoles,
  assignUserRole,
  removeUserRole,
} from "../../../services/userService";

export default function RoleModal({
  user,
  onClose,
  onChange,
}) {
  const [roles, setRoles] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  async function loadRoles() {
    try {
      setLoading(true);

      const [allRoles, assignedRoles] =
        await Promise.all([
          getRoles(),
          getUserRoles(user.user_id),
        ]);

      setRoles(allRoles);
      setUserRoles(assignedRoles);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Unable to load roles",
        text: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRoles();
  }, [user.user_id]);

  const formik = useFormik({
    initialValues: {
      role_id: "",
    },

    validationSchema: roleSchema,

    onSubmit: async (values, helpers) => {
      try {
        const exists = userRoles.some(
          (role) =>
            String(role.role_id) ===
            String(values.role_id)
        );

        if (exists) {
          helpers.setFieldError(
            "role_id",
            "This role is already assigned"
          );
          return;
        }

        await assignUserRole(
          user.user_id,
          values.role_id
        );

        helpers.resetForm();

        await loadRoles();
        await onChange?.();

        Swal.fire({
          icon: "success",
          title: "Role assigned",
          timer: 1400,
          showConfirmButton: false,
        });
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Role not assigned",
          text: error.message,
        });
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  async function removeRole(role) {
    const result = await Swal.fire({
      icon: "warning",
      title: "Remove this role?",
      text: `Remove ${role.role_name} from ${user.full_name}?`,
      showCancelButton: true,
      confirmButtonText: "Remove role",
      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) return;

    try {
      setRemovingId(role.role_id);

      await removeUserRole(
        user.user_id,
        role.role_id
      );

      await loadRoles();
      await onChange?.();

      Swal.fire({
        icon: "success",
        title: "Role removed",
        timer: 1300,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Role not removed",
        text: error.message,
      });
    } finally {
      setRemovingId(null);
    }
  }

  
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
      aria-labelledby="manage-roles-title"
      className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.30)] dark:border-white/10 dark:bg-[#191e2d] dark:shadow-[0_24px_70px_rgba(0,0,0,0.55)]"
    >
      {/* Modal Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-5 py-4 dark:border-white/[0.08] dark:bg-white/[0.03]">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300">
            <ShieldCheck size={18} />
          </div>

          <div>
            <h2
              id="manage-roles-title"
              className="text-sm font-bold text-slate-900 dark:text-white"
            >
              Manage Roles
            </h2>

            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
              {user.full_name}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close role modal"
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-200/70 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <X size={18} />
        </button>
      </div>

      {/* Modal Body */}
      <div className="max-h-[75vh] overflow-y-auto p-5">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2
              size={26}
              className="animate-spin text-violet-600 dark:text-violet-400"
            />
          </div>
        ) : (
          <>
            {/* Assign Role */}
            <form
              onSubmit={formik.handleSubmit}
              className="grid items-start gap-3 sm:grid-cols-[1fr_auto]"
            >
              <div>
                <label
                  htmlFor="assign-role"
                  className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Assign a role
                </label>

                <select
                  id="assign-role"
                  name="role_id"
                  value={formik.values.role_id}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-xs text-slate-800 outline-none transition-all focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-500/15 dark:border-white/10 dark:bg-[#242a3b] dark:text-white dark:focus:border-violet-400"
                >
                  <option value="">Select role</option>

                  {roles.map((role) => (
                    <option key={role.role_id} value={role.role_id}>
                      {role.role_name}
                    </option>
                  ))}
                </select>

                {formik.touched.role_id && formik.errors.role_id && (
                  <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">
                    {formik.errors.role_id}
                  </p>
                )}
              </div>

              <div className="flex items-end sm:pt-5">
                <button
                  type="submit"
                  disabled={formik.isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-[0_4px_12px_rgba(124,58,237,0.25)] transition-all hover:bg-violet-700 hover:shadow-[0_6px_16px_rgba(124,58,237,0.35)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {formik.isSubmitting ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Plus size={15} />
                  )}
                  Assign role
                </button>
              </div>
            </form>

            {/* Assigned Roles */}
            <div className="mt-5 border-t border-slate-200/80 pt-4 dark:border-white/[0.08]">
              <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Assigned Roles ({userRoles.length})
              </h3>

              <div className="mt-3 max-h-48 space-y-2 overflow-y-auto pr-1">
                {userRoles.length ? (
                  userRoles.map((role) => (
                    <div
                      key={role.role_id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 px-3.5 py-2.5 transition-colors hover:bg-white dark:border-white/[0.08] dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <ShieldCheck
                          size={18}
                          className="shrink-0 text-violet-600 dark:text-violet-400"
                        />

                        <span className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {role.role_name}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeRole(role)}
                        disabled={removingId === role.role_id}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-red-200/70 bg-red-50 px-2.5 py-1.5 text-[11px] font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-400/15 dark:bg-red-400/10 dark:text-red-400 dark:hover:bg-red-400/20"
                      >
                        {removingId === role.role_id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Trash2 size={13} />
                        )}
                        Remove
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400">
                    No roles assigned yet
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  </div>
);

}
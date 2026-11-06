import { useState } from "react";
import { useFormik } from "formik";
import Swal from "sweetalert2";

import {
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  Phone,
  UserPlus,
  UserRound,
} from "lucide-react";

import { addUserSchema } from "../../../validations/userValidation";

export default function UserForm({
  users,
  departments,
  onAddUser,
  onSuccess,
}) {
  const [showPassword, setShowPassword] = useState(false);

  const formik = useFormik({
    initialValues: {
      full_name: "",
      email: "",
      mobile: "",
      password: "",
      department_id: "",
    },

    validationSchema: addUserSchema,

    onSubmit: async (values, helpers) => {
      try {
        const emailExists = users.some(
          (user) =>
            user.email?.toLowerCase() ===
            values.email.toLowerCase()
        );

        if (emailExists) {
          helpers.setFieldError(
            "email",
            "This email is already registered"
          );
          return;
        }

        const mobileExists = users.some(
          (user) =>
            String(user.mobile || "") === values.mobile
        );

        if (mobileExists) {
          helpers.setFieldError(
            "mobile",
            "This mobile number is already registered"
          );
          return;
        }

        await onAddUser(values);

        helpers.resetForm();
        setShowPassword(false);

        if (onSuccess) onSuccess();

        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "User added",
          text:
            values.full_name +
            " has been added successfully.",
          timer: 1800,
          showConfirmButton: false,
        });
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "User not added",
          text: error.message,
          confirmButtonColor: "#4f46e5",
        });
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  return (
    <section>
      {/* User Form */}
      <form
        onSubmit={formik.handleSubmit}
        className="grid gap-3 sm:grid-cols-2"
        noValidate
      >
        <Field
          label="Full name"
          name="full_name"
          placeholder="Enter full name"
          icon={<UserRound size={16} />}
          formik={formik}
        />

        <Field
          label="Email address"
          name="email"
          type="email"
          placeholder="name@example.com"
          icon={<Mail size={16} />}
          formik={formik}
        />

        <Field
          label="Mobile number"
          name="mobile"
          placeholder="10-digit mobile number"
          icon={<Phone size={16} />}
          formik={formik}
          maxLength={10}
        />

        {/* Password */}
        <div>
          <label
            htmlFor="add-user-password"
            className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Password
          </label>

          <div className="relative">
            <KeyRound
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            />

            <input
              disabled={formik.isSubmitting}
              id="add-user-password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={inputClass(
                formik.touched.password &&
                  formik.errors.password,
                "pl-10 pr-10"
              )}
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword((value) => !value)
              }
              aria-label={
                showPassword ? "Hide password" : "Show password"
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white"
            >
              {showPassword ? (
                <EyeOff size={16} />
              ) : (
                <Eye size={16} />
              )}
            </button>
          </div>

          <ErrorMessage
            touched={formik.touched.password}
            error={formik.errors.password}
          />
        </div>

        {/* Department */}
        <div>
          <label
            htmlFor="add-user-department"
            className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Department
          </label>

          <select
            disabled={formik.isSubmitting}
            id="add-user-department"
            name="department_id"
            value={formik.values.department_id}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={`${inputClass(
              formik.touched.department_id &&
                formik.errors.department_id,
              "px-3"
            )} cursor-pointer dark:[color-scheme:dark]`}
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
          </select>

          <ErrorMessage
            touched={formik.touched.department_id}
            error={formik.errors.department_id}
          />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end border-t border-slate-100 pt-3 sm:col-span-2 dark:border-white/10">
          <button
            type="submit"
            disabled={formik.isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-semibold text-white shadow-[0_4px_12px_rgba(124,58,237,0.25)] transition-all duration-200 hover:bg-violet-700 hover:shadow-[0_6px_18px_rgba(124,58,237,0.35)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {formik.isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Adding user...
              </>
            ) : (
              <>
                <UserPlus size={16} />
                Create User
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  icon,
  formik,
  maxLength,
}) {
  const error =
    formik.touched[name] && formik.errors[name];

  return (
    <div>
      <label
        htmlFor={`add-user-${name}`}
        className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
      >
        {label}
      </label>

      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
          {icon}
        </span>

        <input
          id={`add-user-${name}`}
          name={name}
          type={type}
          placeholder={placeholder}
          value={formik.values[name]}
          onChange={(event) => {
            if (name === "mobile") {
              formik.setFieldValue(name, event.target.value.replace(/[^0-9]/g, "").slice(0, 10));
            } else {
              formik.handleChange(event);
            }
          }}
          onBlur={formik.handleBlur}
          inputMode={name === "mobile" ? "numeric" : undefined}
          disabled={formik.isSubmitting}
          aria-invalid={!!error}
          maxLength={maxLength}
          className={inputClass(error, "pl-10 pr-3")}
        />
      </div>

      <ErrorMessage
        touched={formik.touched[name]}
        error={formik.errors[name]}
      />
    </div>
  );
}

function ErrorMessage({ touched, error }) {
  if (!touched || !error) return null;

  return (
    <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
      {error}
    </p>
  );
}

function inputClass(error, spacing) {
  return `w-full rounded-xl border bg-slate-50/80 py-2.5 text-xs text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 focus:bg-white focus:ring-4 dark:bg-white/[0.04] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-white/[0.06] ${spacing} ${
    error
      ? "border-red-400 focus:border-red-500 focus:ring-red-500/10 dark:border-red-400"
      : "border-slate-200 focus:border-violet-500 focus:ring-violet-500/10 dark:border-white/10 dark:focus:border-violet-400 dark:focus:ring-violet-400/10"
  }`;
}

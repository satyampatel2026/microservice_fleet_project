
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
  Plus,
  UserRound,
} from "lucide-react";

import { addUserSchema } from "../../../validations/userValidation";

export default function UserForm({
  users,
  departments,
  onAddUser,
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

        await Swal.fire({
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
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_6px_24px_rgba(15,23,42,0.10)] transition-all duration-300 hover:border-violet-200 hover:shadow-[0_12px_32px_rgba(15,23,42,0.15)] sm:p-5 dark:border-white/[0.08] dark:bg-[#191e2d] dark:shadow-[0_8px_28px_rgba(0,0,0,0.30)] dark:hover:border-violet-400/20 dark:hover:shadow-[0_14px_36px_rgba(0,0,0,0.42)]">
      {/* Form Heading */}
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-200/70 bg-violet-50 text-violet-600 dark:border-violet-400/15 dark:bg-violet-400/10 dark:text-violet-300">
          <Plus size={19} strokeWidth={2} />
        </div>

        <div>
          <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
            Add new user
          </h3>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Enter account and department information.
          </p>
        </div>
      </div>

      {/* User Form */}
      <form
        onSubmit={formik.handleSubmit}
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
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
        <div className="flex items-end">
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
                <Plus size={16} />
                Add user
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
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
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

import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Plus, Users, Search, RefreshCw, Pencil, Power, X, Loader2, UserRound } from "lucide-react";
import Layout from "../layouts/Layout";

// VITE_API_URL should be the gateway origin, e.g. http://localhost:5000
const API_URL = `${("http://localhost:5000").replace(/\/$/, "")}/api/partners/me/employees`;
const emptyForm = { name: "", mobile: "", role: "" };

const toast = (icon, title) => Swal.fire({
  toast: true, position: "top-end", icon, titleText: title,
  showConfirmButton: false, timer: 3500, timerProgressBar: true,
});

async function request(url, method = "GET", body) {
  const response = await fetch(url, {
    method, credentials: "include",
    ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || result?.success !== true) {
    throw new Error(result?.message || "Request failed. Please try again.");
  }
  return result;
}

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [statusBusy, setStatusBusy] = useState(null);
  const dialogRef = useRef(null);
  const nameRef = useRef(null);
  const mobileRef = useRef(null);
  const roleRef = useRef(null);
  const saveLock = useRef(false);
  const statusLock = useRef(false);

  async function loadEmployees() {
    setLoading(true);
    setLoadError("");
    try {
      const result = await request(API_URL);
      if (!Array.isArray(result.data)) throw new Error("Unable to read employee list.");
      setEmployees(result.data);
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadEmployees(); }, []);

  function openForm(employee = null) {
    setEditingId(employee?.employee_id ?? null);
    formik.resetForm({ values: employee ? { name: employee.name, mobile: String(employee.mobile), role: employee.role } : { ...emptyForm } });
    dialogRef.current.showModal();
    nameRef.current?.focus();
  }

  function closeForm() {
    if (!saveLock.current) dialogRef.current.close();
  }

  const formik = useFormik({
    initialValues: emptyForm,
    validateOnChange: true,
    validateOnBlur: true,
    validationSchema: Yup.object({
      name: Yup.string().trim().required("Employee name is required.")
        .max(100, "Name cannot exceed 100 characters.")
        .matches(/^[\p{L}\p{M}\s.'’-]+$/u, "Only letters, spaces, dots, apostrophes and hyphens are allowed.")
        .test("letters", "Name must contain at least 3 letters.", value => !value || (value.match(/\p{L}/gu) || []).length >= 3),
      mobile: Yup.string().required("Mobile number is required.")
        .matches(/^[6-9][0-9]{9}$/, "Enter 10 digits starting with 6, 7, 8 or 9."),
      role: Yup.string().trim().required("Role is required.")
        .max(50, "Role cannot exceed 50 characters.")
        .matches(/^[\p{L}\p{M}\s&/()-]+$/u, "Only letters, spaces, &, /, brackets and hyphens are allowed.")
        .test("letters", "Role must contain at least 3 letters.", value => !value || (value.match(/\p{L}/gu) || []).length >= 3),
    }),
    onSubmit: async (values) => {
      await saveEmployee({ name: values.name.trim(), mobile: values.mobile, role: values.role.trim() });
    },
  });

  const form = formik.values;
  const errors = {
    ...Object.fromEntries(Object.entries(formik.errors).filter(([field]) => formik.touched[field] || formik.submitCount > 0)),
    server: formik.status,
  };

  function changeField(field, value) {
    // Mobile allows digits only, including pasted input.
    const cleaned = field === "mobile" ? value.replace(/[^0-9]/g, "").slice(0, 10) : value;
    formik.setStatus(undefined);
    formik.setFieldTouched(field, true, false);
    formik.setFieldValue(field, cleaned, true);
  }

  async function saveEmployee(values) {
    if (saveLock.current) return;
    saveLock.current = true;
    setSaving(true);
    try {
      await request(editingId ? `${API_URL}/${editingId}` : API_URL, editingId ? "PUT" : "POST", values);
      dialogRef.current.close();
      toast("success", editingId ? "Employee updated successfully" : "Employee added successfully");
      await loadEmployees();
    } catch (error) {
      // Keep errors inside the modal so they remain visible and accessible.
      formik.setStatus(error.message);
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  }

  async function changeStatus(employee) {
    if (statusLock.current) return;
    statusLock.current = true;
    setStatusBusy(employee.employee_id);
    const status = employee.status === "active" ? "inactive" : "active";
    const action = status === "active" ? "Activate" : "Deactivate";
    try {
      const answer = await Swal.fire({
        titleText: `${action} employee?`,
        text: `${employee.name} will be marked as ${status}.`,
        icon: "question", showCancelButton: true,
        confirmButtonText: `${action} employee`, cancelButtonText: "Cancel",
        confirmButtonColor: "#0f766e", cancelButtonColor: "#64748b",
        reverseButtons: true, focusCancel: true,
      });
      if (!answer.isConfirmed) return;
      await request(`${API_URL}/${employee.employee_id}/status`, "PATCH", { status });
      toast("success", `Employee ${status === "active" ? "activated" : "deactivated"}`);
      await loadEmployees();
    } catch (error) {
      toast("error", error.message);
    } finally {
      statusLock.current = false;
      setStatusBusy(null);
    }
  }

  const activeCount = employees.filter((employee) => employee.status === "active").length;
  const visibleEmployees = employees.filter((employee) => {
    const matchesSearch = `${employee.name} ${employee.mobile} ${employee.role}`.toLowerCase().includes(search.trim().toLowerCase());
    return matchesSearch && (filter === "all" || employee.status === filter);
  });
  const busy = loading || saving || statusBusy !== null;
  const inputClass = "mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-700 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 disabled:bg-slate-50";
  const buttonClass = "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <Layout activePath="/partner/employees">
      <style>{`
        .employee-dialog::backdrop { background: rgba(9,43,49,.45); backdrop-filter: blur(4px); }
        .employee-dialog { max-height: calc(100dvh - 32px); overflow-y: auto; }
        .swal2-popup { font-family: inherit; font-size: 13px; border-radius: 16px; }
        .swal2-container { z-index: 9999; }
      `}</style>

      <div className="mx-auto max-w-6xl space-y-4 text-[13px]">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-700">Garage management</p>
            <h3 className="text-xl font-bold tracking-tight text-[#092B31]">Employees</h3>
            <p className="mt-1 text-xs text-slate-500">Your team, their details and roles in one place.</p>
          </div>
          <button type="button" onClick={() => openForm()} disabled={saving || statusBusy !== null}
            className={`${buttonClass} ml-auto bg-[#0f766e] text-white shadow-sm hover:bg-teal-800`}>
            <Plus size={15} /> Add employee
          </button>
        </header>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { title: "Total team", count: employees.length, dot: "bg-slate-500" },
            { title: "Active", count: activeCount, dot: "bg-teal-500" },
            { title: "Inactive", count: employees.length - activeCount, dot: "bg-amber-400" },
          ].map((stat) => (
            <div key={stat.title} className="rounded-xl border border-[#E4ECEA] bg-white px-3 py-3 sm:px-4">
              <p className="flex items-center gap-1.5 text-[11px] text-slate-500"><span className={`h-1.5 w-1.5 rounded-full ${stat.dot}`} />{stat.title}</p>
              <p className="mt-1.5 text-xl font-semibold tracking-tight text-[#092B31]">{loading && employees.length === 0 ? "—" : stat.count}</p>
            </div>
          ))}
        </div>

        <section className="overflow-hidden rounded-xl border border-[#E4ECEA] bg-white shadow-[0_3px_18px_rgba(9,43,49,0.025)]">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3">
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
              <Search size={14} className="pointer-events-none absolute left-3 top-3 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search employees" placeholder="Search name, mobile or role..."
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/60 pl-9 pr-3 text-xs outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10" />
            </div>
            <select aria-label="Filter employee status" value={filter} onChange={(event) => setFilter(event.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-600 outline-none focus:ring-2 focus:ring-teal-500/20">
              <option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option>
            </select>
            <button type="button" onClick={loadEmployees} disabled={busy} aria-label="Refresh employees" title="Refresh" className={`${buttonClass} ml-auto border border-slate-200 text-slate-500 hover:bg-slate-50`}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          {loadError && <div role="alert" className="m-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">{loadError} <button type="button" disabled={busy} onClick={loadEmployees} className="ml-2 font-semibold underline">Retry</button></div>}
          {loading ? <div role="status" className="flex items-center justify-center gap-2 py-16 text-xs text-slate-500"><Loader2 size={17} className="animate-spin" />Loading employees...</div>
            : !visibleEmployees.length ? <div className="px-4 py-14 text-center"><Users size={28} className="mx-auto mb-3 text-teal-600" /><p className="font-semibold text-[#092B31]">{loadError ? "Employee list unavailable" : employees.length ? "No matching employees" : "Build your garage team"}</p><p className="mt-1 text-xs text-slate-500">{loadError ? "Retry loading your employee records." : employees.length ? "Try another search or status filter." : "Use Add employee to create your first team member."}</p></div>
              : <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAF9] text-[10px] uppercase tracking-wider text-slate-500"><tr>{["Employee", "Mobile", "Role", "Status", "Actions"].map((title) => <th scope="col" key={title} className="whitespace-nowrap px-4 py-3 font-semibold">{title}</th>)}</tr></thead>
                  <tbody className="divide-y divide-slate-100">{visibleEmployees.map((employee) => (
                    <tr key={employee.employee_id} className="transition hover:bg-[#FAFCFB]">
                      <td className="px-4 py-3"><div className="flex items-center gap-2.5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-xs font-bold text-teal-700">{employee.name.trim().slice(0, 1).toUpperCase()}</span><div><p className="max-w-[200px] truncate font-semibold text-[#18383C]" title={employee.name}>{employee.name}</p><p className="mt-0.5 text-[10px] text-slate-400">EMP-{employee.employee_id}</p></div></div></td>
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-600">{employee.mobile}</td>
                      <td className="px-4 py-3"><span className="inline-block max-w-[160px] truncate rounded-md border border-slate-100 bg-slate-50 px-2 py-1 text-[11px] text-slate-600" title={employee.role}>{employee.role}</span></td>
                      <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold ${employee.status === "active" ? "bg-teal-50 text-teal-700" : "bg-amber-50 text-amber-700"}`}><span className={`h-1 w-1 rounded-full ${employee.status === "active" ? "bg-teal-500" : "bg-amber-500"}`} />{employee.status === "active" ? "Active" : "Inactive"}</span></td>
                      <td className="px-4 py-3"><div className="flex gap-1.5"><button type="button" onClick={() => openForm(employee)} disabled={busy} aria-label={`Edit ${employee.name}`} title="Edit employee" className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 disabled:opacity-40"><Pencil size={13} /></button><button type="button" onClick={() => changeStatus(employee)} disabled={busy} aria-label={`${employee.status === "active" ? "Deactivate" : "Activate"} ${employee.name}`} title={employee.status === "active" ? "Deactivate employee" : "Activate employee"} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-40">{statusBusy === employee.employee_id ? <Loader2 size={13} className="animate-spin" /> : <Power size={13} />}</button></div></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>}
          <div className="border-t border-slate-100 px-4 py-2.5 text-[10px] text-slate-400" aria-live="polite">{loading ? "Updating team records..." : `Showing ${visibleEmployees.length} of ${employees.length} employees`}</div>
        </section>
      </div>

      <dialog ref={dialogRef} aria-labelledby="employee-dialog-title" onCancel={(event) => { if (saveLock.current) event.preventDefault(); }}
        className="employee-dialog fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border-0 bg-white p-0 text-slate-700 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5"><span className="rounded-xl bg-teal-50 p-2 text-teal-700"><UserRound size={18} /></span><div><h2 id="employee-dialog-title" className="text-sm font-bold text-[#092B31]">{editingId ? "Edit employee" : "Add employee"}</h2><p className="mt-0.5 text-[11px] text-slate-400">{editingId ? "Update team member details." : "Add a new member to your garage."}</p></div></div>
          <button type="button" onClick={closeForm} disabled={saving} aria-label="Close employee form" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-40"><X size={17} /></button>
        </div>
        <form onSubmit={formik.handleSubmit} noValidate>
          <div className="space-y-4 p-5">
            {errors.server && <p role="alert" className="rounded-lg bg-red-50 p-3 text-xs text-red-700">{errors.server}</p>}
            <fieldset disabled={saving} className="space-y-4">
              <div><label htmlFor="employee-name" className="text-xs font-semibold">Full name <span className="text-red-500">*</span></label><input ref={nameRef} id="employee-name" name="name" onBlur={formik.handleBlur} value={form.name} onChange={(event) => changeField("name", event.target.value)} maxLength={100} autoComplete="off" required aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-error" : undefined} placeholder="Enter employee name" className={`${inputClass} ${errors.name ? "!border-red-400 !ring-red-100" : ""}`} />{errors.name && <p role="alert" id="name-error" className="mt-1 text-[11px] text-red-600">{errors.name}</p>}</div>
              <div><label htmlFor="employee-mobile" className="text-xs font-semibold">Mobile number <span className="text-red-500">*</span></label><input ref={mobileRef} id="employee-mobile" name="mobile" onBlur={formik.handleBlur} type="tel" inputMode="numeric" value={form.mobile} onChange={(event) => changeField("mobile", event.target.value)} maxLength={10} required aria-invalid={!!errors.mobile} aria-describedby={errors.mobile ? "mobile-error" : undefined} placeholder="10-digit mobile number" className={`${inputClass} ${errors.mobile ? "!border-red-400 !ring-red-100" : ""}`} />{errors.mobile && <p role="alert" id="mobile-error" className="mt-1 text-[11px] text-red-600">{errors.mobile}</p>}</div>
              <div><label htmlFor="employee-role" className="text-xs font-semibold">Role / designation <span className="text-red-500">*</span></label><input ref={roleRef} id="employee-role" name="role" onBlur={formik.handleBlur} value={form.role} onChange={(event) => changeField("role", event.target.value)} maxLength={50} required aria-invalid={!!errors.role} aria-describedby={errors.role ? "role-error" : undefined} placeholder="e.g. Mechanic, Manager, Electrician" className={`${inputClass} ${errors.role ? "!border-red-400 !ring-red-100" : ""}`} />{errors.role && <p role="alert" id="role-error" className="mt-1 text-[11px] text-red-600">{errors.role}</p>}</div>
            </fieldset>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5"><button type="button" disabled={saving} onClick={closeForm} className={`${buttonClass} border border-slate-200 bg-white text-slate-600`}>Cancel</button><button type="submit" disabled={saving} className={`${buttonClass} bg-teal-700 text-white hover:bg-teal-800`}>{saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}{saving ? "Saving..." : editingId ? "Save changes" : "Add employee"}</button></div>
        </form>
      </dialog>
    </Layout>
  );
}

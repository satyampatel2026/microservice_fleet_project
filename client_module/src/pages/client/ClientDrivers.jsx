import { useEffect, useRef, useState } from "react";
import { useFormik } from "formik";
import Swal from "sweetalert2";
import { Plus, Pencil, RefreshCw, Search, X } from "lucide-react";
import { getDrivers, addDriver, updateDriver, updateDriverStatus } from "../../services/driverService";

const emptyForm = { name: "", mobile: "", licence_number: "", licence_expiry: "" };
const toast = (title) => Swal.fire({ toast: true, position: "top-end", icon: "success", title, timer: 2500, showConfirmButton: false });
const todayInIndia = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);

function validate(values) {
  const errors = {};
  if (values.name.trim().length < 3 || values.name.trim().length > 100) errors.name = "Name must be 3 to 100 characters";
  if (!/^[6-9][0-9]{9}$/.test(values.mobile)) errors.mobile = "Enter a valid 10 digit mobile number";
  if (!/^[A-Z0-9 -]{5,30}$/.test(values.licence_number.trim().toUpperCase())) errors.licence_number = "Enter a licence number of 5 to 30 characters";
  const date = new Date(`${values.licence_expiry}T00:00:00Z`);
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(values.licence_expiry) && Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === values.licence_expiry;
  if (!validDate || values.licence_expiry < todayInIndia()) errors.licence_expiry = "Choose a valid date, today or later";
  return errors;
}

export default function ClientDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [reload, setReload] = useState(0);
  const [editing, setEditing] = useState(null);
  const [saveError, setSaveError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const modal = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    async function loadDrivers() {
      try {
        const result = await getDrivers();
        if (!cancelled) { setDrivers(result.data); setError(""); }
      } catch (error) {
        if (!cancelled) setError(error.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadDrivers();
    return () => { cancelled = true; };
  }, [reload]);

  const formik = useFormik({
    initialValues: emptyForm,
    validate,
    onSubmit: async (values) => {
      setSaveError("");
      const data = { ...values, name: values.name.trim(), licence_number: values.licence_number.trim().toUpperCase() };
      try {
        if (editing) await updateDriver(editing.driver_id, data);
        else await addDriver(data);
        modal.current.close();
        toast(editing ? "Driver updated successfully" : "Driver added successfully");
        setReload(value => value + 1);
      } catch (error) {
        // Native dialog ke andar hi server error dikhate hain.
        setSaveError(error.message);
      }
    },
  });

  function openForm(driver = null) {
    setEditing(driver);
    setSaveError("");
    formik.resetForm({ values: driver ? {
      name: driver.name,
      mobile: driver.mobile,
      licence_number: driver.licence_number,
      licence_expiry: driver.licence_expiry?.slice(0, 10) || "",
    } : { ...emptyForm } });
    modal.current.showModal();
  }

  async function changeStatus(driver) {
    const nextStatus = driver.status === "active" ? "inactive" : "active";
    const answer = await Swal.fire({
      title: `Mark driver ${nextStatus}?`,
      text: driver.name,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, update",
      confirmButtonColor: "#7c3aed",
    });
    if (!answer.isConfirmed) return;
    setBusyId(driver.driver_id);
    try {
      await updateDriverStatus(driver.driver_id, nextStatus);
      toast("Driver status updated");
      setReload(value => value + 1);
    } catch (error) {
      Swal.fire({ icon: "error", title: "Unable to update status", text: error.message });
    } finally {
      setBusyId(null);
    }
  }

  const keyword = search.trim().toLowerCase();
  const visible = drivers.filter(driver => {
    const matchesSearch = `${driver.name} ${driver.mobile} ${driver.licence_number}`.toLowerCase().includes(keyword);
    return matchesSearch && (!status || driver.status === status);
  });
  const active = drivers.filter(driver => driver.status === "active").length;

  return (
    <div className="space-y-4 text-white">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-xl font-semibold">My Drivers</h1><p className="mt-1 text-xs text-slate-400">Manage driver details and licence expiry.</p></div>
        <div className="flex flex-wrap items-center gap-2">
          {[['Total', drivers.length], ['Active', active], ['Inactive', drivers.length - active]].map(([label, value]) => <div key={label} className="rounded-lg border border-white/10 bg-[#111827] px-3 py-2 text-xs"><span className="text-slate-400">{label}</span><strong className="ml-2">{loading || error ? "—" : value}</strong></div>)}
          <button type="button" onClick={() => openForm()} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold hover:bg-violet-500"><Plus size={15} />Add Driver</button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-white/10 bg-[#111827] px-3 py-2"><Search size={15} className="text-slate-400" /><input aria-label="Search drivers" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search name, mobile or licence" className="w-full bg-transparent text-xs outline-none" /></label>
        <select aria-label="Filter status" value={status} onChange={event => setStatus(event.target.value)} className="rounded-lg border border-white/10 bg-[#111827] px-3 py-2 text-xs text-white"><option value="">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
        <button type="button" disabled={loading} onClick={() => setReload(value => value + 1)} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs disabled:opacity-40"><RefreshCw size={14} className={loading ? "animate-spin" : ""} />Refresh</button>
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-xs text-red-300">{error}. Use Refresh to try again.</p>}
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#111827]">
        <table className="w-full min-w-[740px] text-left text-xs">
          <thead className="border-b border-white/10 bg-white/[0.02] text-slate-400"><tr>
            <th className="w-16 px-4 py-3 text-center font-medium">Sr. No.</th>
            {['Driver', 'Mobile', 'Licence', 'Expiry', 'Status'].map(title => <th key={title} className="px-4 py-3 font-medium">{title}</th>)}
            <th className="px-4 py-3 text-center font-medium">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-white/5">
            {loading ? <tr><td colSpan={7} className="p-8 text-center text-slate-400">Loading drivers...</td></tr> : error ? <tr><td colSpan={7} className="p-8 text-center text-slate-400">Driver list is unavailable.</td></tr> : visible.length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-slate-400">{drivers.length ? "No drivers match your filters." : "No drivers yet. Click Add Driver."}</td></tr> : visible.map((driver, index) => (
              <tr key={driver.driver_id} className="hover:bg-white/[0.03]">
                <td className="px-4 py-3 text-center text-slate-400">{index + 1}</td>
                <td className="px-4 py-3 font-medium">{driver.name}</td>
                <td className="px-4 py-3 text-slate-300">{driver.mobile}</td>
                <td className="px-4 py-3 text-slate-300">{driver.licence_number}</td>
                <td className={`px-4 py-3 ${driver.licence_expiry?.slice(0, 10) < todayInIndia() ? "text-red-300" : "text-slate-300"}`}>{driver.licence_expiry?.slice(0, 10) || "—"}</td>
                <td className="px-4 py-3"><button type="button" role="switch" aria-checked={driver.status === "active"} aria-label={`Toggle status for ${driver.name}`} disabled={busyId !== null} onClick={() => changeStatus(driver)} className="inline-flex items-center gap-2 disabled:opacity-40"><span className={`flex h-5 w-9 items-center rounded-full p-0.5 ${driver.status === "active" ? "bg-emerald-500" : "bg-slate-600"}`}><span className={`h-4 w-4 rounded-full bg-white transition-transform ${driver.status === "active" ? "translate-x-4" : "translate-x-0"}`} /></span><span className="capitalize">{driver.status}</span></button></td>
                <td className="px-4 py-3 text-center"><button type="button" onClick={() => openForm(driver)} aria-label={`Edit ${driver.name}`} className="rounded-lg border border-white/10 p-2 text-violet-300 hover:bg-violet-500/10"><Pencil size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dialog ref={modal} onCancel={event => { if (formik.isSubmitting) event.preventDefault(); }} className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#111827] p-0 text-white shadow-2xl backdrop:bg-black/70">
        <form onSubmit={formik.handleSubmit} noValidate>
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><h2 className="text-base font-semibold">{editing ? "Edit Driver" : "Add Driver"}</h2><button type="button" disabled={formik.isSubmitting} onClick={() => modal.current.close()} aria-label="Close form" className="rounded-lg p-1 text-slate-400 disabled:opacity-40"><X size={19} /></button></div>
          <div className="space-y-4 p-5">
            <Field label="Driver Name" name="name" formik={formik} maxLength={100} autoComplete="name" />
            <Field label="Mobile Number" name="mobile" formik={formik} maxLength={10} inputMode="numeric" autoComplete="tel" onChange={event => formik.setFieldValue("mobile", event.target.value.replace(/\D/g, "").slice(0, 10))} />
            <Field label="Licence Number" name="licence_number" formik={formik} maxLength={30} onChange={event => formik.setFieldValue("licence_number", event.target.value.toUpperCase())} />
            <Field label="Licence Expiry" name="licence_expiry" type="date" min={todayInIndia()} formik={formik} />
            {saveError && <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-xs text-red-300">{saveError}</p>}
          </div>
          <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-4"><button type="button" disabled={formik.isSubmitting} onClick={() => modal.current.close()} className="rounded-lg border border-white/10 px-4 py-2 text-xs disabled:opacity-40">Cancel</button><button type="submit" disabled={formik.isSubmitting} className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold disabled:opacity-40">{formik.isSubmitting ? "Saving..." : "Save Driver"}</button></div>
        </form>
      </dialog>
    </div>
  );
}

function Field({ label, name, formik, ...props }) {
  const error = formik.touched[name] && formik.errors[name];
  return <div><label htmlFor={`driver-${name}`} className="mb-1.5 block text-xs text-slate-300">{label}</label><input id={`driver-${name}`} {...formik.getFieldProps(name)} {...props} disabled={formik.isSubmitting} aria-invalid={!!error} aria-describedby={error ? `error-${name}` : undefined} className={`w-full rounded-lg border bg-[#0d1320] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500/20 ${error ? "border-red-400" : "border-white/10 focus:border-violet-400"}`} />{error && <p id={`error-${name}`} className="mt-1 text-xs text-red-300">{error}</p>}</div>;
}


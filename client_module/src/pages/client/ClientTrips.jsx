import { useEffect, useRef, useState } from "react";
import { useFormik } from "formik";
import Swal from "sweetalert2";
import { Plus, RefreshCw, Search, X } from "lucide-react";
import { getTrips, getTripOptions, createTrip, updateTripStatus } from "../../services/tripService";

const emptyForm = { vehicle_id: "", driver_id: "", start_location: "", end_location: "", scheduled_start: "", scheduled_end: "" };
const statusColors = { scheduled: "bg-amber-400/10 text-amber-300", ongoing: "bg-sky-400/10 text-sky-300", completed: "bg-emerald-400/10 text-emerald-300", cancelled: "bg-slate-400/10 text-slate-400" };
const toast = title => Swal.fire({ toast: true, position: "top-end", icon: "success", title, timer: 2500, showConfirmButton: false });

function indiaDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00+05:30`);
  if (!Number.isFinite(date.getTime())) return null;
  return new Date(date.getTime() + 330 * 60000).toISOString().slice(0, 16) === value ? date : null;
}

function validate(values) {
  const errors = {};
  if (!values.vehicle_id) errors.vehicle_id = "Select a vehicle";
  if (!values.driver_id) errors.driver_id = "Select a driver";
  for (const field of ["start_location", "end_location"]) {
    if (values[field].trim().length < 3 || values[field].trim().length > 255) errors[field] = "Enter 3 to 255 characters";
  }
  const start = indiaDate(values.scheduled_start);
  const end = indiaDate(values.scheduled_end);
  if (!start || start.getTime() <= Date.now()) errors.scheduled_start = "Choose a future start time";
  if (!end || (start && end <= start)) errors.scheduled_end = "Choose an end time after start";
  return errors;
}

function formatTime(value) {
  if (!value) return "—";
  // DATETIME string without timezone is interpreted as India time.
  const normalized = value.replace(" ", "T");
  const hasTimezone = /Z$|[+-]\d{2}:\d{2}$/.test(normalized);
  const date = new Date(hasTimezone ? normalized : normalized + "+05:30");
  return Number.isFinite(date.getTime()) ? date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
}

export default function ClientTrips() {
  const [trips, setTrips] = useState([]);
  const [options, setOptions] = useState({ vehicles: [], drivers: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [saveError, setSaveError] = useState("");
  const modal = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    async function loadTrips() {
      try {
        const [tripResult, optionResult] = await Promise.all([getTrips(), getTripOptions()]);
        if (cancelled) return;
        setTrips(tripResult.data);
        setOptions(optionResult.data);
        setError("");
      } catch (error) {
        if (!cancelled) setError(error.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadTrips();
    return () => { cancelled = true; };
  }, [reload]);

  const formik = useFormik({
    initialValues: emptyForm,
    validate,
    onSubmit: async values => {
      setSaveError("");
      try {
        await createTrip({ ...values, vehicle_id: Number(values.vehicle_id), driver_id: Number(values.driver_id), start_location: values.start_location.trim(), end_location: values.end_location.trim() });
        modal.current.close();
        toast("Trip created successfully");
        setReload(value => value + 1);
      } catch (error) {
        setSaveError(error.message);
      }
    },
  });

  function openForm() {
    formik.resetForm({ values: { ...emptyForm } });
    setSaveError("");
    modal.current.showModal();
  }

  async function changeStatus(trip, nextStatus) {
    const verb = { ongoing: "Start", completed: "Complete", cancelled: "Cancel" }[nextStatus];
    const answer = await Swal.fire({ title: `${verb} this trip?`, text: `${trip.vehicle_number}: ${trip.start_location} → ${trip.end_location}`, icon: "question", showCancelButton: true, confirmButtonText: `Yes, ${verb.toLowerCase()}`, confirmButtonColor: "#7c3aed" });
    if (!answer.isConfirmed) return;
    setBusyId(trip.trip_id);
    try {
      await updateTripStatus(trip.trip_id, nextStatus);
      toast("Trip status updated");
      setReload(value => value + 1);
    } catch (error) {
      Swal.fire({ icon: "error", title: "Unable to update trip", text: error.message });
    } finally {
      setBusyId(null);
    }
  }

  const keyword = search.trim().toLowerCase();
  const visible = trips.filter(trip => (!status || trip.status === status) && `${trip.vehicle_number} ${trip.driver_name} ${trip.start_location} ${trip.end_location}`.toLowerCase().includes(keyword));
  const canCreate = !loading && !error && options.vehicles.length > 0 && options.drivers.length > 0;

  return <div className="space-y-4 text-white">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-xl font-semibold">My Trips</h1><p className="mt-1 text-xs text-slate-400">Schedule vehicles and drivers. All times are India time.</p></div>
      <div className="flex flex-wrap items-center gap-2">
        {['scheduled', 'ongoing', 'completed'].map(item => <div key={item} className="rounded-lg border border-white/10 bg-[#111827] px-3 py-2 text-xs"><span className="capitalize text-slate-400">{item}</span><strong className="ml-2">{loading || error ? "—" : trips.filter(trip => trip.status === item).length}</strong></div>)}
        <button type="button" disabled={!canCreate} onClick={openForm} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold disabled:opacity-40"><Plus size={15} />Create Trip</button>
      </div>
    </header>
    {!loading && !error && !canCreate && <p className="rounded-lg bg-amber-500/10 p-3 text-xs text-amber-200">You need an active verified vehicle with valid RC and an active driver with valid licence to create a trip.</p>}
    <div className="flex flex-wrap gap-3">
      <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-white/10 bg-[#111827] px-3 py-2"><Search size={15} className="text-slate-400" /><input aria-label="Search trips" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search vehicle, driver or route" className="w-full bg-transparent text-xs outline-none" /></label>
      <select aria-label="Filter trip status" value={status} onChange={event => setStatus(event.target.value)} className="rounded-lg border border-white/10 bg-[#111827] px-3 py-2 text-xs"><option value="">All Status</option>{['scheduled', 'ongoing', 'completed', 'cancelled'].map(item => <option key={item} value={item}>{item}</option>)}</select>
      <button type="button" disabled={loading} onClick={() => setReload(value => value + 1)} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs disabled:opacity-40"><RefreshCw size={14} className={loading ? "animate-spin" : ""} />Refresh</button>
    </div>
    {error && <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-xs text-red-300">{error}. Use Refresh to try again.</p>}
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#111827]">
      <table className="w-full min-w-[1000px] text-left text-xs">
        <thead className="border-b border-white/10 text-slate-400"><tr><th className="px-3 py-3 text-center font-medium">Sr. No.</th>{['Vehicle / Driver', 'Route', 'Scheduled (IST)', 'Actual (IST)', 'Status'].map(title => <th key={title} className="px-3 py-3 font-medium">{title}</th>)}<th className="px-3 py-3 text-center font-medium">Actions</th></tr></thead>
        <tbody className="divide-y divide-white/5">
          {loading || error || visible.length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-slate-400">{loading ? "Loading trips..." : error ? "Trip list is unavailable." : "No trips found."}</td></tr> : visible.map((trip, index) => <tr key={trip.trip_id} className="hover:bg-white/[0.03]">
            <td className="px-3 py-3 text-center text-slate-400">{index + 1}</td>
            <td className="px-3 py-3 font-medium">{trip.vehicle_number}<span className="mt-1 block font-normal text-slate-400">{trip.driver_name}</span></td>
            <td className="max-w-56 px-3 py-3"><span className="block break-words">{trip.start_location}</span><span className="mt-1 block break-words text-slate-400">→ {trip.end_location}</span></td>
            <td className="whitespace-nowrap px-3 py-3">{formatTime(trip.scheduled_start)}<span className="mt-1 block text-slate-400">to {formatTime(trip.scheduled_end)}</span></td>
            <td className="whitespace-nowrap px-3 py-3">{formatTime(trip.actual_start)}<span className="mt-1 block text-slate-400">to {formatTime(trip.actual_end)}</span></td>
            <td className="px-3 py-3"><span className={`rounded-md px-2 py-1 capitalize ${statusColors[trip.status]}`}>{trip.status}</span></td>
            <td className="px-3 py-3 text-center"><div className="flex justify-center gap-2">
              {trip.status === "scheduled" && <><button type="button" disabled={busyId !== null || loading} onClick={() => changeStatus(trip, "ongoing")} className="rounded-lg bg-sky-500/15 px-3 py-2 text-sky-300 disabled:opacity-40">Start</button><button type="button" disabled={busyId !== null || loading} onClick={() => changeStatus(trip, "cancelled")} className="rounded-lg border border-white/10 px-3 py-2 text-red-300 disabled:opacity-40">Cancel</button></>}
              {trip.status === "ongoing" && <button type="button" disabled={busyId !== null || loading} onClick={() => changeStatus(trip, "completed")} className="rounded-lg bg-emerald-500/15 px-3 py-2 text-emerald-300 disabled:opacity-40">Complete</button>}
              {['completed', 'cancelled'].includes(trip.status) && <span className="text-slate-500">—</span>}
            </div></td>
          </tr>)}
        </tbody>
      </table>
    </div>
    <p className="text-[11px] text-slate-500">Start is allowed only within the scheduled time window. Vehicle/driver availability is checked again by the backend when creating or starting a trip. Trip Start does not start mobile GPS sharing.</p>

    <dialog ref={modal} onCancel={event => { if (formik.isSubmitting) event.preventDefault(); }} className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-xl overflow-y-auto rounded-2xl border border-white/10 bg-[#111827] p-0 text-white shadow-2xl backdrop:bg-black/70">
      <form onSubmit={formik.handleSubmit} noValidate>
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><h2 className="text-base font-semibold">Create Trip</h2><button type="button" disabled={formik.isSubmitting} onClick={() => modal.current.close()} aria-label="Close form"><X size={19} /></button></div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Vehicle" name="vehicle_id" formik={formik}><option value="">Select vehicle</option>{options.vehicles.map(vehicle => <option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>{vehicle.vehicle_number}</option>)}</Field>
          <Field label="Driver" name="driver_id" formik={formik}><option value="">Select driver</option>{options.drivers.map(driver => <option key={driver.driver_id} value={driver.driver_id}>{driver.name} · {driver.mobile}</option>)}</Field>
          <Field label="Start Location" name="start_location" maxLength={255} formik={formik} />
          <Field label="End Location" name="end_location" maxLength={255} formik={formik} />
          <Field label="Scheduled Start (India time)" name="scheduled_start" type="datetime-local" formik={formik} />
          <Field label="Scheduled End (India time)" name="scheduled_end" type="datetime-local" formik={formik} />
          {saveError && <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-xs text-red-300 sm:col-span-2">{saveError}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-4"><button type="button" disabled={formik.isSubmitting} onClick={() => modal.current.close()} className="rounded-lg border border-white/10 px-4 py-2 text-xs">Cancel</button><button type="submit" disabled={formik.isSubmitting} className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold disabled:opacity-40">{formik.isSubmitting ? "Creating..." : "Create Trip"}</button></div>
      </form>
    </dialog>
  </div>;
}

function Field({ label, name, formik, children, ...props }) {
  const error = formik.touched[name] && formik.errors[name];
  const common = { id: `trip-${name}`, ...formik.getFieldProps(name), ...props, disabled: formik.isSubmitting, "aria-invalid": !!error, "aria-describedby": error ? `error-${name}` : undefined, className: `w-full rounded-lg border bg-[#0d1320] px-3 py-2.5 text-sm text-white outline-none ${error ? "border-red-400" : "border-white/10 focus:border-violet-400"}` };
  return <div className="min-w-0"><label htmlFor={`trip-${name}`} className="mb-1.5 block text-xs text-slate-300">{label}</label>{children ? <select {...common}>{children}</select> : <input {...common} />}{error && <p id={`error-${name}`} className="mt-1 text-xs text-red-300">{error}</p>}</div>;
}

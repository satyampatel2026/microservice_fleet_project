import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { Plus, Truck, Pencil, Eye, Power, Navigation, X, RefreshCw } from "lucide-react";
import { getVehicles, addVehicle, updateVehicle, updateVehicleStatus } from "../../services/vehicleService";
const empty = {
  vehicle_number: "",
  vehicle_type: "",
  brand: "",
  model: "",
  registration_date: "",
  expiry_date: ""
};
const today = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
const input = "mt-1.5 w-full rounded-lg border border-white/15 bg-[#0d1320] px-3 py-2.5 text-xs text-white outline-none focus:border-violet-400";
const toast = (title, icon = "success") => Swal.fire({
  toast: true,
  position: "top-end",
  title,
  icon,
  timer: 2500,
  showConfirmButton: false
});
export default function ClientVehicles() {
  const navigate = useNavigate();
  const dialog = useRef(null),
    fileInput = useRef(null),
    alive = useRef(false);
  const [vehicles, setVehicles] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [form, setForm] = useState(empty),
    [editing, setEditing] = useState(null),
    [rc, setRc] = useState(null);
  const [saving, setSaving] = useState(false),
    [formError, setFormError] = useState(""),
    [changing, setChanging] = useState(null);
  async function loadVehicles() {
    setLoading(true);
    setError("");
    try {
      const result = await getVehicles();
      if (alive.current) setVehicles(result.data);
    } catch (err) {
      if (alive.current) setError(err.message);
    } finally {
      if (alive.current) setLoading(false);
    }
  }
  useEffect(() => {
    alive.current = true;
    loadVehicles();
    return () => {
      alive.current = false;
    };
  }, []);
  function openForm(vehicle = null) {
    setEditing(vehicle);
    setForm(vehicle ? Object.fromEntries(Object.keys(empty).map(key => [key, vehicle[key] || ""])) : empty);
    setRc(null);
    setFormError("");
    if (fileInput.current) fileInput.current.value = "";
    dialog.current.showModal();
  }
  function changeField(event) {
    const {
      name,
      value
    } = event.target;
    setForm(current => ({
      ...current,
      [name]: name === "vehicle_number" ? value.toUpperCase().replace(/\s+/g, "") : value
    }));
  }
  function chooseRc(event) {
    const file = event.target.files?.[0];
    if (!file) {
      setRc(null);
      return;
    }
    if (!["image/jpeg", "application/pdf"].includes(file.type) || file.size > 200 * 1024) {
      setRc(null);
      event.target.value = "";
      setFormError("RC must be JPEG/PDF, maximum 200 KB");
      return;
    }
    setRc(file);
    setFormError("");
  }
  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    if (!/^[A-Z0-9]{4,20}$/.test(form.vehicle_number) || !["Car", "Bus", "Van", "Truck"].includes(form.vehicle_type)) return setFormError("Enter valid vehicle number/type");
    if (!form.registration_date || !form.expiry_date || form.registration_date > today() || form.expiry_date <= form.registration_date || form.expiry_date < today()) return setFormError("Enter valid dates. Expiry must be after registration and not in the past.");
    if (!rc && !editing?.has_rc) return setFormError("Upload the RC document");
    setSaving(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value.trim()));
      if (rc) data.append("rc_document", rc);
      if (editing) await updateVehicle(editing.vehicle_id, data);else await addVehicle(data);
      if (!alive.current) return;
      dialog.current.close();
      toast("Submitted for admin verification");
      await loadVehicles();
    } catch (err) {
      if (alive.current) setFormError(err.message);
    } finally {
      if (alive.current) setSaving(false);
    }
  }
  async function changeStatus(vehicle) {
    const status = vehicle.status === "active" ? "inactive" : "active";
    const answer = await Swal.fire({
      title: `Mark vehicle ${status}?`,
      text: status === "inactive" ? "Location updates will be blocked. This does not transfer ownership." : "Vehicle must be verified with valid RC.",
      showCancelButton: true,
      confirmButtonText: "Confirm",
      icon: "question"
    });
    if (!answer.isConfirmed || !alive.current) return;
    setChanging(vehicle.vehicle_id);
    try {
      await updateVehicleStatus(vehicle.vehicle_id, status);
      toast(`Vehicle ${status}`);
      if (alive.current) await loadVehicles();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      if (alive.current) setChanging(null);
    }
  }
  const action = "rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/5 disabled:opacity-30";
  return <div className="space-y-3">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-xl font-semibold">My Vehicles</h1><p className="mt-1 text-xs text-slate-400">Upload RC and submit registration for admin verification.</p></div><div className="flex gap-2"><button type="button" disabled={loading} onClick={loadVehicles} className={action} aria-label="Refresh"><RefreshCw size={16} /></button><button type="button" onClick={() => openForm()} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold"><Plus size={15} />Add Vehicle</button></div></header>
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#111827]"><table className="w-full text-left text-xs"><thead className="border-b border-white/10 text-slate-400"><tr>{["Sr. No.", "Vehicle", "Type / Model", "Registration", "RC Expiry", "Approval", "Status", "Actions"].map(label => <th key={label} className="whitespace-nowrap px-3 py-3">{label}</th>)}</tr></thead><tbody className="divide-y divide-white/5">
      {loading ? <tr><td colSpan={8} className="p-8 text-center text-slate-400">Loading...</td></tr> : vehicles.map((vehicle, index) => {
            const trackable = vehicle.approval_status === "verified" && vehicle.expiry_date >= today() && vehicle.status === "active";
            return <tr key={vehicle.vehicle_id}><td className="px-3 py-3">{index + 1}</td><td className="px-3 py-3"><span className="inline-flex items-center gap-2 whitespace-nowrap font-semibold"><Truck size={15} />{vehicle.vehicle_number}</span>{vehicle.rejection_reason && <p className="mt-1 max-w-56 text-[11px] text-red-300">{vehicle.rejection_reason}</p>}</td><td className="px-3 py-3 text-slate-400">{[vehicle.vehicle_type, vehicle.brand, vehicle.model].filter(Boolean).join(" / ")}</td><td className="whitespace-nowrap px-3 py-3">{vehicle.registration_date || "Not provided"}</td><td className={`whitespace-nowrap px-3 py-3 ${vehicle.expiry_date && vehicle.expiry_date < today() ? "text-red-300" : ""}`}>{vehicle.expiry_date || "Not provided"}</td><td className="px-3 py-3"><span className={`rounded-full px-2 py-1 ${vehicle.approval_status === "verified" ? "bg-emerald-500/10 text-emerald-300" : vehicle.approval_status === "rejected" ? "bg-red-500/10 text-red-300" : "bg-amber-500/10 text-amber-300"}`}>{vehicle.approval_status}</span></td><td className="px-3 py-3">{vehicle.status}</td><td className="whitespace-nowrap px-3 py-3"><div className="flex gap-1.5"><button title="Edit / Renew RC" aria-label={`Edit ${vehicle.vehicle_number}`} onClick={() => openForm(vehicle)} className={action}><Pencil size={14} /></button>{Boolean(vehicle.rc_url) && <a title="View RC" aria-label={`View RC for ${vehicle.vehicle_number}`} href={vehicle.rc_url} target="_blank" rel="noreferrer" className={action}><Eye size={14} /></a>}<button title={vehicle.status === "active" ? "Mark inactive" : "Mark active"} aria-label={`Change status of ${vehicle.vehicle_number}`} disabled={changing !== null} onClick={() => changeStatus(vehicle)} className={action}><Power size={14} /></button><button title="View Tracking" aria-label={`Track ${vehicle.vehicle_number}`} disabled={!trackable} onClick={() => navigate(`/client/tracking?vehicle=${vehicle.vehicle_id}`)} className={action}><Navigation size={14} /></button></div></td></tr>;
          })}
      {!loading && !vehicles.length && <tr><td colSpan={8} className="p-8 text-center text-slate-400">No vehicles added yet.</td></tr>}
    </tbody></table></div>
    <p className="text-xs leading-5 text-slate-400">Pending/rejected vehicles remain here for corrections. Only verified vehicles appear on the Tracking map. Registration edits require fresh review.</p>
    <dialog ref={dialog} onCancel={event => {
      if (saving) event.preventDefault();
    }} className="m-auto w-[calc(100%_-_2rem)] max-w-lg rounded-2xl border border-white/10 bg-[#111827] p-0 text-white backdrop:bg-black/70"><form onSubmit={handleSubmit}><div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><h2 className="text-sm font-semibold">{editing ? "Edit / Renew Vehicle" : "Add Vehicle"}</h2><button type="button" disabled={saving} onClick={() => dialog.current.close()} aria-label="Close" className={action}><X size={16} /></button></div><fieldset disabled={saving} className="grid gap-4 p-5 sm:grid-cols-2">
      <label className="text-xs">Vehicle Number<input required maxLength={20} minLength={4} name="vehicle_number" value={form.vehicle_number} onChange={changeField} className={input} /></label>
      <label className="text-xs">Vehicle Type<select required name="vehicle_type" value={form.vehicle_type} onChange={changeField} className={input} style={{
              colorScheme: "dark"
            }}><option value="">Select type</option>{["Car", "Bus", "Van", "Truck"].map(type => <option key={type}>{type}</option>)}</select></label>
      {["brand", "model"].map(key => <label key={key} className="text-xs capitalize">{key}<input maxLength={100} name={key} value={form[key]} onChange={changeField} className={input} /></label>)}
      <label className="text-xs">Registration Date<input required type="date" name="registration_date" max={today()} value={form.registration_date} onChange={changeField} className={input} style={{
              colorScheme: "dark"
            }} /></label>
      <label className="text-xs">RC Expiry Date<input required type="date" name="expiry_date" min={today()} value={form.expiry_date} onChange={changeField} className={input} style={{
              colorScheme: "dark"
            }} /></label>
      <label className="text-xs sm:col-span-2">RC Document<input ref={fileInput} type="file" accept="image/jpeg,application/pdf" required={!editing?.has_rc} onChange={chooseRc} className={`${input} file:mr-3 file:rounded file:border-0 file:bg-violet-600 file:px-2 file:py-1 file:text-white`} /><span className="mt-1 block text-[10px] text-slate-400">JPEG/PDF, maximum 200 KB. {editing?.has_rc ? "Leave empty to retain existing RC." : "RC is required."}</span>{editing?.rc_url && <a href={editing.rc_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-violet-300 underline">View existing RC</a>}</label>
      {formError && <p role="alert" className="text-xs text-red-300 sm:col-span-2">{formError}</p>}
    </fieldset><div className="flex justify-end border-t border-white/10 px-5 py-3"><button type="submit" disabled={saving} className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold disabled:opacity-50">{saving ? "Submitting..." : "Submit for Verification"}</button></div></form></dialog>
  </div>;
}

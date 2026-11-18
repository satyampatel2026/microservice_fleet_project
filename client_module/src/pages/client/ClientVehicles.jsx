import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  Plus,
  Truck,
  Pencil,
  Eye,
  Power,
  Navigation,
  X,
  RefreshCw,
  Search,
  Wrench,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  getVehicles,
  addVehicle,
  updateVehicle,
  updateVehicleStatus,
} from "../../services/vehicleService";

const emptyForm = {
  vehicle_number: "",
  vehicle_type: "",
  brand: "",
  model: "",
  registration_date: "",
  expiry_date: "",
};

const today = () =>
  new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);

const inputClass =
  "mt-1.5 w-full rounded-lg border border-white/15 bg-[#0d1320] px-3 py-2.5 text-xs text-white outline-none focus:border-violet-400";

const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50";

function toast(title, icon = "success") {
  return Swal.fire({
    toast: true,
    position: "top-end",
    title,
    icon,
    timer: 2500,
    showConfirmButton: false,
  });
}

export default function ClientVehicles() {
  const navigate = useNavigate();
  const dialogRef = useRef(null);
  const fileInputRef = useRef(null);
  const aliveRef = useRef(false);

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [rcFile, setRcFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [changingStatus, setChangingStatus] = useState(null);

  async function loadVehicles() {
    setLoading(true);
    setError("");

    try {
      const result = await getVehicles();
      if (aliveRef.current) {
        setVehicles(Array.isArray(result.data) ? result.data : []);
      }
    } catch (err) {
      if (aliveRef.current) setError(err.message);
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  }

  useEffect(() => {
    aliveRef.current = true;
    loadVehicles();

    return () => {
      aliveRef.current = false;
    };
  }, []);

  const filteredVehicles = vehicles.filter((vehicle) => {
    const query = search.trim().toLowerCase();

    const matchesSearch =
      !query ||
      [
        vehicle.vehicle_number,
        vehicle.vehicle_type,
        vehicle.brand,
        vehicle.model,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));

    const matchesApproval =
      approvalFilter === "all" ||
      vehicle.approval_status === approvalFilter;

    const matchesStatus =
      statusFilter === "all" || vehicle.status === statusFilter;

    return matchesSearch && matchesApproval && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredVehicles.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleVehicles = filteredVehicles.slice(
    startIndex,
    startIndex + pageSize
  );

  function openForm(vehicle = null) {
    setEditing(vehicle);
    setForm(
      vehicle
        ? Object.fromEntries(
            Object.keys(emptyForm).map((key) => [key, vehicle[key] || ""])
          )
        : emptyForm
    );
    setRcFile(null);
    setFormError("");

    if (fileInputRef.current) fileInputRef.current.value = "";
    dialogRef.current?.showModal();
  }

  function changeField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]:
        name === "vehicle_number"
          ? value.toUpperCase().replace(/\s+/g, "")
          : value,
    }));
  }

  function chooseRc(event) {
    const file = event.target.files?.[0];

    if (!file) {
      setRcFile(null);
      return;
    }

    if (
      !["image/jpeg", "application/pdf"].includes(file.type) ||
      file.size > 200 * 1024
    ) {
      setRcFile(null);
      event.target.value = "";
      setFormError("RC must be a JPEG or PDF file, maximum 200 KB.");
      return;
    }

    setRcFile(file);
    setFormError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
   
    const vehicleNumber = form.vehicle_number.trim().toUpperCase();
    if (
       !/^[A-Z]{2}[0-9]{2}[A-Z]{1,3}[0-9]{4}$/.test(vehicleNumber) ||
      !["Car", "Bus", "Van", "Truck"].includes(form.vehicle_type)) {
      setFormError("Enter a valid vehicle number and vehicle type.");
      return;
    }

    if (
      !form.registration_date ||
      !form.expiry_date ||
      form.registration_date > today() ||
      form.expiry_date <= form.registration_date ||
      form.expiry_date < today()
    ) {
      setFormError(
        "Enter valid dates. Expiry must be after registration and not in the past."
      );
      return;
    }

    if (!rcFile && !editing?.has_rc) {
      setFormError("Upload the vehicle RC document.");
      return;
    }

    setSaving(true);

    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        body.append(key, String(value).trim());
      });

      if (rcFile) body.append("rc_document", rcFile);

      if (editing) {
        await updateVehicle(editing.vehicle_id, body);
      } else {
        await addVehicle(body);
      }

      if (!aliveRef.current) return;

      dialogRef.current?.close();
      toast("Vehicle submitted for admin verification.");
      await loadVehicles();
    } catch (err) {
      if (aliveRef.current) setFormError(err.message);
    } finally {
      if (aliveRef.current) setSaving(false);
    }
  }

  async function handleStatusChange(vehicle) {
    const nextStatus = vehicle.status === "active" ? "inactive" : "active";

    const answer = await Swal.fire({
      title: `Mark vehicle ${nextStatus}?`,
      text:
        nextStatus === "inactive"
          ? "Location updates for this vehicle will be blocked."
          : "The vehicle must be verified and have a valid RC.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Confirm",
      cancelButtonText: "Keep current status",
    });

    if (!answer.isConfirmed || !aliveRef.current) return;

    setChangingStatus(vehicle.vehicle_id);

    try {
      await updateVehicleStatus(vehicle.vehicle_id, nextStatus);
      toast(`Vehicle marked ${nextStatus}.`);
      await loadVehicles();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      if (aliveRef.current) setChangingStatus(null);
    }
  }

  function requestService(vehicle) {
    navigate(
      `/client/service-requests?vehicle_id=${encodeURIComponent(
        vehicle.vehicle_id
      )}`
    );
  }

  function canTrack(vehicle) {
    return (
      vehicle.approval_status === "verified" &&
      vehicle.expiry_date >= today() &&
      vehicle.status === "active"
    );
  }

  const actionButton =
    "inline-flex items-center justify-center rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="space-y-4 text-white">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">My Vehicles</h1>
          <p className="mt-1 text-xs text-slate-400">
            Search, filter, and manage your registered vehicles.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={loadVehicles}
            className={buttonClass}
            aria-label="Refresh vehicles"
          >
            <RefreshCw size={15} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => openForm()}
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold hover:bg-violet-500"
          >
            <Plus size={15} />
            Add Vehicle
          </button>
        </div>
      </header>

      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}

      <section className="grid gap-3 rounded-xl border border-white/10 bg-[#111827] p-3 md:grid-cols-[minmax(220px,1fr)_180px_160px]">
        <label className="relative block">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search number, type, brand, or model"
            className={`${inputClass} mt-0 pl-9`}
          />
        </label>

        <select
          value={approvalFilter}
          onChange={(event) => {
            setApprovalFilter(event.target.value);
            setPage(1);
          }}
          className={`${inputClass} mt-0`}
          aria-label="Filter by approval"
          style={{ colorScheme: "dark" }}
        >
          <option value="all">All approvals</option>
          <option value="pending">Pending approval</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setPage(1);
          }}
          className={`${inputClass} mt-0`}
          aria-label="Filter by vehicle status"
          style={{ colorScheme: "dark" }}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </section>

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#111827]">
        <table className="w-full min-w-[1050px] text-left text-xs">
          <thead className="border-b border-white/10 text-slate-400">
            <tr>
              {[
                "Sr. No.",
                "Vehicle",
                "Type / Model",
                "Registration",
                "RC Expiry",
                "Approval",
                "Status",
                "Actions",
              ].map((heading) => (
                <th key={heading} className="whitespace-nowrap px-3 py-3">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  Loading vehicles...
                </td>
              </tr>
            ) : visibleVehicles.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  {vehicles.length === 0
                    ? "No vehicles added yet."
                    : "No vehicles match these search and filter options."}
                </td>
              </tr>
            ) : (
              visibleVehicles.map((vehicle, index) => (
                <tr key={vehicle.vehicle_id}>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-400">
                    {startIndex + index + 1}
                  </td>

                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2 font-semibold">
                      <Truck size={15} className="shrink-0 text-violet-300" />
                      {vehicle.vehicle_number}
                    </div>
                    {vehicle.rejection_reason && (
                      <p className="mt-1 max-w-56 text-[11px] text-red-300">
                        {vehicle.rejection_reason}
                      </p>
                    )}
                  </td>

                  <td className="px-3 py-3 text-slate-300">
                    {[vehicle.vehicle_type, vehicle.brand, vehicle.model]
                      .filter(Boolean)
                      .join(" / ") || "—"}
                  </td>

                  <td className="whitespace-nowrap px-3 py-3">
                    {vehicle.registration_date || "—"}
                  </td>

                  <td
                    className={`whitespace-nowrap px-3 py-3 ${
                      vehicle.expiry_date && vehicle.expiry_date < today()
                        ? "text-red-300"
                        : ""
                    }`}
                  >
                    {vehicle.expiry_date || "—"}
                  </td>

                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full px-2 py-1 ${
                        vehicle.approval_status === "verified"
                          ? "bg-emerald-500/10 text-emerald-300"
                          : vehicle.approval_status === "rejected"
                            ? "bg-red-500/10 text-red-300"
                            : "bg-amber-500/10 text-amber-300"
                      }`}
                    >
                      {vehicle.approval_status || "pending"}
                    </span>
                  </td>

                  <td className="px-3 py-3 capitalize">
                    {vehicle.status || "—"}
                  </td>

                  <td className="whitespace-nowrap px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        title="Request Service"
                        aria-label={`Request service for ${vehicle.vehicle_number}`}
                        onClick={() => requestService(vehicle)}
                        className={`${actionButton} text-violet-300`}
                      >
                        <Wrench size={15} />
                      </button>

                      <button
                        type="button"
                        title="Edit vehicle / renew RC"
                        aria-label={`Edit ${vehicle.vehicle_number}`}
                        onClick={() => openForm(vehicle)}
                        className={actionButton}
                      >
                        <Pencil size={14} />
                      </button>

                      {vehicle.rc_url && (
                        <a
                          title="View RC"
                          aria-label={`View RC for ${vehicle.vehicle_number}`}
                          href={vehicle.rc_url}
                          target="_blank"
                          rel="noreferrer"
                          className={actionButton}
                        >
                          <Eye size={14} />
                        </a>
                      )}

                      <button
                        type="button"
                        title={
                          vehicle.status === "active"
                            ? "Mark inactive"
                            : "Mark active"
                        }
                        aria-label={`Change status of ${vehicle.vehicle_number}`}
                        disabled={changingStatus !== null}
                        onClick={() => handleStatusChange(vehicle)}
                        className={actionButton}
                      >
                        <Power size={14} />
                      </button>

                      <button
                        type="button"
                        title="View tracking"
                        aria-label={`Track ${vehicle.vehicle_number}`}
                        disabled={!canTrack(vehicle)}
                        onClick={() =>
                          navigate(
                            `/client/tracking?vehicle=${vehicle.vehicle_id}`
                          )
                        }
                        className={actionButton}
                      >
                        <Navigation size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <span>
          {filteredVehicles.length === 0
            ? "Showing 0 vehicles"
            : `Showing ${startIndex + 1}–${Math.min(
                startIndex + pageSize,
                filteredVehicles.length
              )} of ${filteredVehicles.length} vehicles`}
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1 || loading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className={buttonClass}
          >
            <ChevronLeft size={14} />
            Previous
          </button>

          <span>
            Page {currentPage} of {totalPages}
          </span>

          <button
            type="button"
            disabled={currentPage >= totalPages || loading}
            onClick={() =>
              setPage((current) => Math.min(totalPages, current + 1))
            }
            className={buttonClass}
          >
            Next
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <p className="text-xs leading-5 text-slate-400">
        Pending or rejected vehicles remain here for updates. Only verified
        vehicles with a valid RC can be tracked.
      </p>

      <dialog
        ref={dialogRef}
        onCancel={(event) => {
          if (saving) event.preventDefault();
        }}
        className="m-auto w-[calc(100%_-_2rem)] max-w-lg rounded-2xl border border-white/10 bg-[#111827] p-0 text-white backdrop:bg-black/70"
      >
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <h2 className="text-sm font-semibold">
              {editing ? "Edit / Renew Vehicle" : "Add Vehicle"}
            </h2>

            <button
              type="button"
              disabled={saving}
              onClick={() => dialogRef.current?.close()}
              aria-label="Close"
              className={actionButton}
            >
              <X size={16} />
            </button>
          </div>

          <fieldset
            disabled={saving}
            className="grid gap-4 p-5 sm:grid-cols-2"
          >
            <label className="text-xs">
              Vehicle Number
              <input
                required
                minLength={9}
                maxLength={11} pattern="[A-Za-z]{2}[0-9]{2}[A-Za-z]{1,3}[0-9]{4}" title="Example: MH12AB1234"
                name="vehicle_number"
                value={form.vehicle_number}
                onChange={changeField}
                className={inputClass}
              />
            </label>

            <label className="text-xs">
              Vehicle Type
              <select
                required
                name="vehicle_type"
                value={form.vehicle_type}
                onChange={changeField}
                className={inputClass}
                style={{ colorScheme: "dark" }}
              >
                <option value="">Select type</option>
                {["Car", "Bus", "Van", "Truck"].map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            {["brand", "model"].map((field) => (
              <label key={field} className="text-xs capitalize">
                {field}
                <input
                  maxLength={100}
                  name={field}
                  value={form[field]}
                  onChange={changeField}
                  className={inputClass}
                />
              </label>
            ))}

            <label className="text-xs">
              Registration Date
              <input
                required
                type="date"
                name="registration_date"
                max={today()}
                value={form.registration_date}
                onChange={changeField}
                className={inputClass}
                style={{ colorScheme: "dark" }}
              />
            </label>

            <label className="text-xs">
              RC Expiry Date
              <input
                required
                type="date"
                name="expiry_date"
                min={today()}
                value={form.expiry_date}
                onChange={changeField}
                className={inputClass}
                style={{ colorScheme: "dark" }}
              />
            </label>

            <label className="text-xs sm:col-span-2">
              RC Document
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,application/pdf"
                required={!editing?.has_rc}
                onChange={chooseRc}
                className={`${inputClass} file:mr-3 file:rounded file:border-0 file:bg-violet-600 file:px-2 file:py-1 file:text-white`}
              />

              <span className="mt-1 block text-[10px] text-slate-400">
                JPEG/PDF, maximum 200 KB.
                {editing?.has_rc
                  ? " Leave empty to keep the current RC."
                  : " RC is required."}
              </span>

              {editing?.rc_url && (
                <a
                  href={editing.rc_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-xs text-violet-300 underline"
                >
                  View existing RC
                </a>
              )}
            </label>

            {formError && (
              <p
                role="alert"
                className="text-xs text-red-300 sm:col-span-2"
              >
                {formError}
              </p>
            )}
          </fieldset>

          <div className="flex justify-end border-t border-white/10 px-5 py-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold hover:bg-violet-500 disabled:opacity-50"
            >
              {saving ? "Submitting..." : "Submit for Verification"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  Send,
  Wrench,
  X,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  cancelServiceRequest,
  createServiceRequest,
  getMyServiceRequests,
  getServiceRequestOptions,
} from "../../services/serviceRequestService";

const todayInIndia = () =>
  new Date(Date.now() + 330 * 60 * 1000).toISOString().slice(0, 10);

const initialForm = () => ({
  vehicle_id: "",
  service_id: "",
  problem_description: "",
  priority: "normal",
  preferred_date: todayInIndia(),
});

const statusStyle = {
  pending: "bg-amber-400/10 text-amber-300",
  assigned: "bg-sky-400/10 text-sky-300",
  in_progress: "bg-violet-400/10 text-violet-300",
  completed: "bg-emerald-400/10 text-emerald-300",
  cancelled: "bg-slate-400/10 text-slate-300",
};

const inputClass =
  "w-full rounded-lg border border-white/10 bg-[#0d1320] px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400";

const pageSize = 10;

function displayDate(value) {
  if (!value) return "—";

  const datePart = String(value).slice(0, 10);
  const date = new Date(`${datePart}T00:00:00+05:30`);

  return Number.isNaN(date.getTime())
    ? datePart
    : date.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}


export default function ClientServiceRequests() {
  const [vehicles, setVehicles] = useState([]);
  const [services, setServices] = useState([]);
  const [requests, setRequests] = useState([]);

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [reload, setReload] = useState(0);
  const [cancellingId, setCancellingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadPage() {
      setLoading(true);
      setError("");

      try {
        const [optionsResult, requestsResult] = await Promise.all([
          getServiceRequestOptions(controller.signal),
          getMyServiceRequests(controller.signal),
        ]);

        if (!active) return;

        setVehicles(
          Array.isArray(optionsResult.data?.vehicles)
            ? optionsResult.data.vehicles
            : []
        );

        setServices(
          Array.isArray(optionsResult.data?.services)
            ? optionsResult.data.services
            : []
        );

        setRequests(
          Array.isArray(requestsResult.data) ? requestsResult.data : []
        );
      } catch (loadError) {
        if (active && !controller.signal.aborted) {
          setError(loadError.message);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPage();

    return () => {
      active = false;
      controller.abort();
    };
  }, [reload]);

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return requests.filter((item) => {
      const matchesSearch =
        !query ||
        [
          item.request_code,
          item.service_name,
          item.vehicle_number,
          item.problem_description,
          item.status,
          item.priority,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      const matchesService =
        serviceFilter === "all" ||
        String(item.service_id) === serviceFilter;

      const matchesStatus =
        statusFilter === "all" ||
        String(item.status).toLowerCase() === statusFilter;

      const matchesPriority =
        priorityFilter === "all" ||
        String(item.priority).toLowerCase() === priorityFilter;

      return (
        matchesSearch &&
        matchesService &&
        matchesStatus &&
        matchesPriority
      );
    });
  }, [requests, search, serviceFilter, statusFilter, priorityFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRequests.length / pageSize)
  );
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleRequests = filteredRequests.slice(
    startIndex,
    startIndex + pageSize
  );

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function openModal() {
    setSubmitError("");
    setForm(initialForm());
    setModalOpen(true);
  }

  function closeModal() {
    if (!saving) {
      setModalOpen(false);
      setSubmitError("");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError("");

    const description = form.problem_description.trim();

    if (!form.vehicle_id || !form.service_id) {
      setSubmitError("Select a vehicle and service.");
      return;
    }

    if (description.length < 10 || description.length > 2000) {
      setSubmitError("Problem description must be 10 to 2000 characters.");
      return;
    }

    if (!form.preferred_date || form.preferred_date < todayInIndia()) {
      setSubmitError("Choose today or a future service date.");
      return;
    }

    setSaving(true);

    try {
      await createServiceRequest({
        ...form,
        vehicle_id: Number(form.vehicle_id),
        service_id: Number(form.service_id),
        problem_description: description,
      });

      setModalOpen(false);
      setForm(initialForm());
      setPage(1);
      setReload((value) => value + 1);

      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Service request submitted",
        timer: 2200,
        showConfirmButton: false,
      });
    } catch (saveError) {
      setSubmitError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel(requestId) {
    const confirmation = await Swal.fire({
      title: "Cancel this request?",
      text: "You can’t undo this action.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, cancel",
      cancelButtonText: "Keep request",
      confirmButtonColor: "#dc2626",
      background: "#111521",
      color: "#ffffff",
    });

    if (!confirmation.isConfirmed) return;

    setCancellingId(requestId);

    try {
      await cancelServiceRequest(requestId);

      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Service request cancelled",
        timer: 2200,
        showConfirmButton: false,
      });

      setReload((value) => value + 1);
    } catch (cancelError) {
      await Swal.fire({
        icon: "error",
        title: "Could not cancel request",
        text: cancelError.message,
        background: "#111521",
        color: "#ffffff",
      });
    } finally {
      setCancellingId(null);
    }
  }

  function resetFilters() {
    setSearch("");
    setServiceFilter("all");
    setStatusFilter("all");
    setPriorityFilter("all");
    setPage(1);
  }

  return (
    <div className="space-y-5 text-white">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Wrench size={20} className="text-violet-300" />
            <h1 className="text-xl font-semibold">Service Requests</h1>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            View and manage service requests for your vehicles.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setReload((value) => value + 1)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200 hover:bg-white/5 disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={openModal}
            disabled={loading || vehicles.length === 0 || services.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={14} />
            Submit Request
          </button>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200"
        >
          {error}
          <button
            type="button"
            onClick={() => setReload((value) => value + 1)}
            className="ml-2 underline"
          >
            Try again
          </button>
        </div>
      )}

      {!error && (
        <>
          {(vehicles.length === 0 || services.length === 0) && !loading && (
            <p className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-200">
              {vehicles.length === 0
                ? "No eligible vehicles found. Add a vehicle and complete admin verification first."
                : "No active services are available right now."}
            </p>
          )}

          <section className="space-y-4 rounded-xl border border-white/10 bg-[#111521] p-4">

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <label className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search request, vehicle, or problem"
                  className={`${inputClass} pl-9`}
                />
              </label>

              <select
                value={serviceFilter}
                onChange={(event) => {
                  setServiceFilter(event.target.value);
                  setPage(1);
                }}
                className={inputClass}
                style={{ colorScheme: "dark" }}
                aria-label="Filter by service"
              >
                <option value="all">All services</option>
                {services.map((service) => (
                  <option
                    key={service.service_id}
                    value={String(service.service_id)}
                  >
                    {service.service_name}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setPage(1);
                }}
                className={inputClass}
                style={{ colorScheme: "dark" }}
                aria-label="Filter by status"
              >
                <option value="all">All statuses</option>
                {["pending", "assigned", "in_progress", "completed", "cancelled"].map(
                  (status) => (
                    <option key={status} value={status}>
                      {status.replaceAll("_", " ")}
                    </option>
                  )
                )}
              </select>

              <select
                value={priorityFilter}
                onChange={(event) => {
                  setPriorityFilter(event.target.value);
                  setPage(1);
                }}
                className={inputClass}
                style={{ colorScheme: "dark" }}
                aria-label="Filter by priority"
              >
                <option value="all">All priorities</option>
                {["low", "normal", "high", "urgent"].map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto rounded-lg border border-white/10">
              <table className="w-full min-w-[900px] text-left text-xs">
                <thead className="border-b border-white/10 bg-white/[0.02] text-slate-400">
                  <tr>
                    {[
                      "Sr. No.",
                      "Request / Date",
                      "Vehicle",
                      "Service",
                      "Priority",
                      "Status",
                      "Preferred Date",
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
                      <td
                        colSpan={8}
                        className="p-8 text-center text-slate-400"
                      >
                        Loading requests...
                      </td>
                    </tr>
                  ) : visibleRequests.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="p-8 text-center text-slate-400"
                      >
                        {requests.length === 0
                          ? "You have not submitted any service requests yet."
                          : "No requests match these search and filter options."}
                      </td>
                    </tr>
                  ) : (
                    visibleRequests.map((item, index) => {
                      const status = String(item.status || "pending")
                        .toLowerCase()
                        .replaceAll(" ", "_");

                      return (
                        <tr key={item.request_id}>
                          <td className="whitespace-nowrap px-3 py-3 text-slate-400">
                            {startIndex + index + 1}
                          </td>

                          <td className="whitespace-nowrap px-3 py-3">
                            <p className="font-semibold text-white">
                               {item.request_code}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-400">
                              {displayDate(item.created_at)}
                            </p>
                          </td>

                          <td className="whitespace-nowrap px-3 py-3 text-slate-200">
                            {item.vehicle_number || "Vehicle"}
                          </td>

                          <td className="px-3 py-3 text-slate-200">
                            {item.service_name || "—"}
                          </td>

                          <td className="whitespace-nowrap px-3 py-3 capitalize text-slate-300">
                            {item.priority || "normal"}
                          </td>

                          <td className="whitespace-nowrap px-3 py-3">
                            <span
                              className={`rounded-md px-2 py-1 text-xs capitalize ${
                                statusStyle[status] ||
                                "bg-slate-400/10 text-slate-300"
                              }`}
                            >
                              {status.replaceAll("_", " ")}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-3 py-3 text-slate-300">
                            {displayDate(item.preferred_date)}
                          </td>

                          <td className="whitespace-nowrap px-3 py-3">
                            {status === "pending" ? (
                              <button
                                type="button"
                                disabled={cancellingId !== null}
                                onClick={() => handleCancel(item.request_id)}
                                className="rounded-md border border-red-400/20 px-3 py-1.5 text-xs text-red-300 hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {cancellingId === item.request_id
                                  ? "Cancelling..."
                                  : "Cancel"}
                              </button>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
              <span>
                {filteredRequests.length === 0
                  ? "Showing 0 requests"
                  : `Showing ${startIndex + 1}–${Math.min(
                      startIndex + pageSize,
                      filteredRequests.length
                    )} of ${filteredRequests.length} requests`}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1 || loading}
                  onClick={() =>
                    setPage((current) => Math.max(1, current - 1))
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 hover:bg-white/5 disabled:opacity-40"
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
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 hover:bg-white/5 disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </section>
        </>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-request-title"
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/10 bg-[#111521] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h2
                  id="service-request-title"
                  className="font-semibold text-white"
                >
                  Submit a service request
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Only active, verified vehicles can be selected.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
                className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/5 disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              <label className="block text-xs text-slate-300">
                Vehicle
                <select
                  required
                  name="vehicle_id"
                  value={form.vehicle_id}
                  onChange={updateField}
                  disabled={saving || loading}
                  className={`${inputClass} mt-1.5`}
                  style={{ colorScheme: "dark" }}
                >
                  <option value="">Choose a vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option
                      key={vehicle.vehicle_id}
                      value={vehicle.vehicle_id}
                    >
                      {vehicle.vehicle_number} · {vehicle.vehicle_type}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs text-slate-300">
                Service
                <select
                  required
                  name="service_id"
                  value={form.service_id}
                  onChange={updateField}
                  disabled={saving || loading}
                  className={`${inputClass} mt-1.5`}
                  style={{ colorScheme: "dark" }}
                >
                  <option value="">Choose a service</option>
                  {services.map((service) => (
                    <option
                      key={service.service_id}
                      value={service.service_id}
                    >
                      {service.category_name
                        ? `${service.category_name} · `
                        : ""}
                      {service.service_name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs text-slate-300">
                Problem description
                <textarea
                  required
                  minLength={10}
                  maxLength={2000}
                  rows={4}
                  name="problem_description"
                  value={form.problem_description}
                  onChange={updateField}
                  disabled={saving}
                  placeholder="Describe what the vehicle needs..."
                  className={`${inputClass} mt-1.5`}
                />
                <span className="mt-1 block text-right text-[11px] text-slate-500">
                  {form.problem_description.trim().length}/2000
                </span>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs text-slate-300">
                  Priority
                  <select
                    name="priority"
                    value={form.priority}
                    onChange={updateField}
                    disabled={saving}
                    className={`${inputClass} mt-1.5`}
                    style={{ colorScheme: "dark" }}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </label>

                <label className="block text-xs text-slate-300">
                  Preferred date
                  <input
                    required
                    type="date"
                    min={todayInIndia()}
                    name="preferred_date"
                    value={form.preferred_date}
                    onChange={updateField}
                    disabled={saving}
                    className={`${inputClass} mt-1.5`}
                    style={{ colorScheme: "dark" }}
                  />
                </label>
              </div>

              {submitError && (
                <p role="alert" className="text-sm text-red-300">
                  {submitError}
                </p>
              )}

              <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-50"
                >
                  Close
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    loading ||
                    vehicles.length === 0 ||
                    services.length === 0
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={15} />
                  {saving ? "Submitting..." : "Submit request"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
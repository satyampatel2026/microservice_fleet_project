import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import Swal from "sweetalert2";
import Layout from "../layouts/Layout";
import {declineMyJob,getMyAssignedJobs,updateMyJobStatus,} from "../services/partnerService";

const PAGE_SIZE = 10;

const statusStyles = {
  assigned: "border-sky-100 bg-sky-50 text-sky-700",
  in_progress: "border-teal-100 bg-teal-50 text-teal-700",
  completed: "border-emerald-100 bg-emerald-50 text-emerald-700",
  declined: "border-red-100 bg-red-50 text-red-700",
};

function getStatus(job) {
  return String(job.status || "").toLowerCase().replaceAll(" ", "_");
}

function formatDate(value) {
  if (!value) return "—";

  const datePart = String(value).slice(0, 10);
  const date = new Date(`${datePart}T00:00:00`);

  return Number.isNaN(date.getTime())
    ? datePart
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function SummaryCard({ title, value, Icon, iconClass }) {
  return (
    <div className="flex min-w-[105px] items-center gap-2 rounded-xl border border-[#E2EBE8] bg-white px-3 py-2 shadow-sm">
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconClass}`}>
        <Icon size={15} />
      </span>
      <div>
        <p className="whitespace-nowrap text-[10px] font-semibold text-slate-500">
          {title}
        </p>
        <p className="text-base font-extrabold leading-4 text-[#092B31]">
          {value}
        </p>
      </div>
    </div>
  );
}

export default function JobCards() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [busyJobId, setBusyJobId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;

    async function loadJobs() {
      setLoading(true);
      setError("");

      try {
        const response = await getMyAssignedJobs();
        const rows = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.jobs)
            ? response.data.jobs
            : [];

        if (active) setJobs(rows);
      } catch (loadError) {
        if (active) {
          setError(loadError.message || "Unable to load jobs.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadJobs();

    return () => {
      active = false;
    };
  }, [reload]);

  const counts = useMemo(
    () => ({
      total: jobs.length,
      inProgress: jobs.filter((job) => getStatus(job) === "in_progress").length,
      completed: jobs.filter((job) => getStatus(job) === "completed").length,
      declined: jobs.filter(
        (job) =>
          getStatus(job) === "declined" ||
          job.partner_declined === true
      ).length,
    }),
    [jobs]
  );

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesSearch =
        !query ||
        [
          job.request_code,
          job.service_name,
          job.client_company_name,
          job.client_name,
          job.vehicle_number,
          job.problem_description,
          job.priority,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      const matchesStatus =
        statusFilter === "all" || getStatus(job) === statusFilter;

      const matchesPriority =
        priorityFilter === "all" ||
        String(job.priority || "normal").toLowerCase() === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [jobs, search, statusFilter, priorityFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredJobs.length / PAGE_SIZE)
  );
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const visibleJobs = filteredJobs.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

  async function updateJob(job, nextStatus) {
    const isStarting = nextStatus === "in_progress";

    const confirmation = await Swal.fire({
      title: isStarting ? "Start this job?" : "Complete this job?",
      text: isStarting
        ? "The client will see that work has started."
        : "Confirm that the service work is complete.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Confirm",
      cancelButtonText: "Go back",
      background: "#ffffff",
      color: "#092B31",
    });

    if (!confirmation.isConfirmed) return;

    setBusyJobId(job.request_id);

    try {
      await updateMyJobStatus(job.request_id, nextStatus);

      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: isStarting ? "Job started" : "Job completed",
        timer: 2200,
        showConfirmButton: false,
      });

      setReload((value) => value + 1);
    } catch (actionError) {
      await Swal.fire({
        icon: "error",
        title: "Unable to update job",
        text: actionError.message,
      });
    } finally {
      setBusyJobId(null);
    }
  }

  async function declineJob(job) {
    const answer = await Swal.fire({
      title: "Decline this job?",
      input: "textarea",
      inputLabel: "Reason",
      inputPlaceholder: "Explain why you cannot take this job...",
      inputAttributes: { maxlength: "500" },
      showCancelButton: true,
      confirmButtonText: "Decline job",
      cancelButtonText: "Keep job",
      confirmButtonColor: "#dc2626",
      inputValidator: (value) => {
        if (!value?.trim()) return "Please enter a reason.";
        if (value.trim().length > 500) {
          return "Reason must be 500 characters or fewer.";
        }
        return undefined;
      },
    });

    if (!answer.isConfirmed) return;

    setBusyJobId(job.request_id);

    try {
      await declineMyJob(job.request_id, answer.value.trim());

      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Job declined",
        timer: 2200,
        showConfirmButton: false,
      });

      setReload((value) => value + 1);
    } catch (actionError) {
      await Swal.fire({
        icon: "error",
        title: "Unable to decline job",
        text: actionError.message,
      });
    } finally {
      setBusyJobId(null);
    }
  }

  return (
    <Layout activePath="/partner/jobs">
      <div className="mx-auto w-full max-w-[1600px] space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
              <span className="text-[10px] font-bold uppercase tracking-[0.17em] text-teal-700">
                Partner Workspace
              </span>
            </div>
            <h3 className="text-[22px] font-extrabold tracking-tight text-[#092B31]">
              Service Jobs
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              View and manage jobs assigned to your workshop.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SummaryCard
              title="Total"
              value={counts.total}
              Icon={BriefcaseBusiness}
              iconClass="bg-teal-50 text-teal-700"
            />
            <SummaryCard
              title="In Progress"
              value={counts.inProgress}
              Icon={Clock3}
              iconClass="bg-[#EAF2F2] text-[#0E5957]"
            />
            <SummaryCard
              title="Completed"
              value={counts.completed}
              Icon={CheckCircle2}
              iconClass="bg-emerald-50 text-emerald-700"
            />
            <SummaryCard
              title="Declined"
              value={counts.declined}
              Icon={XCircle}
              iconClass="bg-red-50 text-red-700"
            />
            <button
              type="button"
              disabled={loading}
              onClick={() => setReload((value) => value + 1)}
              aria-label="Refresh jobs"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#DDEAE6] bg-white text-[#0E3940] shadow-sm hover:bg-[#F8FBFA] disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={loading ? "animate-spin" : ""}
              />
            </button>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
            <button
              type="button"
              onClick={() => setReload((value) => value + 1)}
              className="ml-2 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {!error && (
          <section className="overflow-hidden rounded-2xl border border-[#E2EBE8] bg-white shadow-[0_3px_16px_rgba(7,27,34,0.035)]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EDF2F0] px-4 py-3 sm:px-5">
<label className="relative w-full sm:w-64">
    <Search
      size={14}
      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
    />
    <input
      value={search}
      onChange={(event) => {
        setSearch(event.target.value);
        setPage(1);
      }}
      placeholder="Search jobs..."
      className="w-full rounded-lg border border-[#DDEAE6] bg-white py-2 pl-9 pr-3 text-xs text-[#18383C] outline-none focus:border-teal-500"
    />
  </label>
</div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left">
                <thead className="bg-[#F8FBFA]">
                  <tr className="text-[10px] font-bold uppercase tracking-[0.07em] text-slate-500">
                    <th className="px-4 py-3 sm:px-5">Sr. No.</th>
                    <th className="px-4 py-3">Request Code</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Vehicle</th>
                    <th className="px-4 py-3">Service</th>
                    <th className="px-4 py-2">
                      <span className="mb-1 block">Priority</span>
                      <select
                        value={priorityFilter}
                        onChange={(event) => {
                          setPriorityFilter(event.target.value);
                          setPage(1);
                        }}
                        className="max-w-[120px] rounded-md border border-[#DDEAE6] bg-white px-2 py-1 text-[10px] font-medium normal-case tracking-normal text-[#18383C] outline-none focus:border-teal-500"
                        aria-label="Filter by priority"
                      >
                        <option value="all">All priorities</option>
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </th>
                    <th className="px-4 py-3">Preferred Date</th>
                    <th className="px-4 py-2">
                      <span className="mb-1 block">Status</span>
                      <select
                        value={statusFilter}
                        onChange={(event) => {
                          setStatusFilter(event.target.value);
                          setPage(1);
                        }}
                        className="max-w-[130px] rounded-md border border-[#DDEAE6] bg-white px-2 py-1 text-[10px] font-medium normal-case tracking-normal text-[#18383C] outline-none focus:border-teal-500"
                        aria-label="Filter by status"
                      >
                        <option value="all">All statuses</option>
                        <option value="assigned">Assigned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="declined">Declined</option>
                      </select>
                    </th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#EDF2F0]">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-10 text-center text-xs text-slate-500"
                      >
                        Loading jobs...
                      </td>
                    </tr>
                  ) : visibleJobs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-10 text-center text-xs text-slate-500"
                      >
                        {jobs.length === 0
                          ? "No jobs are currently available."
                          : "No jobs match your search and filters."}
                      </td>
                    </tr>
                  ) : (
                    visibleJobs.map((job, index) => {
                      const status = getStatus(job);
                      const busy = busyJobId === job.request_id;

                      return (
                        <tr
                          key={job.request_id}
                          className="transition-colors hover:bg-[#F8FBFA]"
                        >
                          <td className="px-4 py-3.5 text-[11px] text-slate-500 sm:px-5">
                            {startIndex + index + 1}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-[11px] font-bold text-teal-800">
                            {job.request_code}
                          </td>
                          <td className="px-4 py-3.5 text-[11px] font-medium text-[#18383C]">
                            {job.client_company_name ||
                              job.client_name ||
                              "Client"}
                            {job.client_company_name && job.client_name && (
                              <span className="mt-0.5 block text-[10px] font-normal text-slate-500">
                                {job.client_name}
                              </span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 font-mono text-[11px] text-slate-600">
                            {job.vehicle_number || "—"}
                          </td>
                          <td className="px-4 py-3.5 text-[11px] text-[#18383C]">
                            {job.service_name || "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-[11px] capitalize text-slate-600">
                            {job.priority || "normal"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-[11px] text-slate-600">
                            {formatDate(job.preferred_date)}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                                statusStyles[status] ||
                                "border-slate-100 bg-slate-50 text-slate-600"
                              }`}
                            >
                              {status.replaceAll("_", " ")}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5">
                            <div className="flex gap-1.5">
                              {(status === "assigned" ||
                                status === "in_progress") && (
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => declineJob(job)}
                                  className="rounded-lg border border-red-200 px-2.5 py-1.5 text-[10px] font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                                >
                                  Decline
                                </button>
                              )}
                              {status === "assigned" && (
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() =>
                                    updateJob(job, "in_progress")
                                  }
                                  className="rounded-lg bg-teal-700 px-2.5 py-1.5 text-[10px] font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
                                >
                                  Start
                                </button>
                              )}
                              {status === "in_progress" && (
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => updateJob(job, "completed")}
                                  className="rounded-lg bg-emerald-700 px-2.5 py-1.5 text-[10px] font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                                >
                                  Complete
                                </button>
                              )}
                              {busy && (
                                <span className="self-center text-[10px] text-slate-400">
                                  Updating...
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EDF2F0] bg-[#FCFDFC] px-4 py-3 sm:px-5">
              <span className="text-[10px] text-slate-500">
                {filteredJobs.length === 0
                  ? "Showing 0 jobs"
                  : `Showing ${startIndex + 1}–${Math.min(
                      startIndex + PAGE_SIZE,
                      filteredJobs.length
                    )} of ${filteredJobs.length} jobs`}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1 || loading}
                  onClick={() =>
                    setPage((value) => Math.max(1, value - 1))
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-[#DDEAE6] bg-white px-3 py-2 text-[10px] font-semibold text-[#0E3940] hover:bg-[#F8FBFA] disabled:opacity-40"
                >
                  <ChevronLeft size={13} />
                  Previous
                </button>
                <span className="text-[10px] text-slate-500">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages || loading}
                  onClick={() =>
                    setPage((value) => Math.min(totalPages, value + 1))
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-[#DDEAE6] bg-white px-3 py-2 text-[10px] font-semibold text-[#0E3940] hover:bg-[#F8FBFA] disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}
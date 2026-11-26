import { useEffect, useState } from "react";
import { RefreshCw, Wrench } from "lucide-react";
import Swal from "sweetalert2";
import { getPartners } from "../../services/partnerService";
import {assignServiceRequest, getPendingServiceRequests, cancelServiceRequest, } from "../../services/serviceRequestService";

const PAGE_SIZE = 10;
const FETCH_PAGE_SIZE = 100;

const STATUS_OPTIONS = [
  "all",
  "pending",
  "assigned",
  "in_progress",
  "completed",
  "cancelled",
];

const EMPTY_SUMMARY = {
  total: 0,
  pending: 0,
  assigned: 0,
  in_progress: 0,
  completed: 0,
  cancelled: 0,
};

function formatDate(value) {
  if (!value) return "—";

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return String(value);

  const [, year, month, day] = match;
  const date = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day), 12)
  );

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatStatus(status = "") {
  return status.replaceAll("_", " ");
}

function statusClass(status) {
  const classes = {
    pending:
      "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300",
    assigned:
      "bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300",
    in_progress:
      "bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300",
    completed:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
    cancelled:
      "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
  };

  return classes[status] || classes.cancelled;
}

function isManageable(status) {
  return ["pending", "assigned", "in_progress"].includes(status);
}

function getEligiblePartners(partners, serviceId, request) {
  return partners.filter(partner => {
    const canDoService = (partner.service_ids || []).some(
      id => Number(id) === Number(serviceId)
    );

    const isAlreadyAssigned =
      Number(partner.partner_id) === Number(request.assigned_partner_id);

    return (
      partner.status === "active" &&
      partner.kyc_status === "verified" &&
      canDoService &&
      (request.status === "pending" || !isAlreadyAssigned)
    );
  });
}

function SummaryCard({ label, value, color }) {
  return (
    <div className="min-w-20 rounded-xl border border-slate-200 bg-white px-2.5 py-2 dark:border-white/[0.08] dark:bg-[#191e2d]">
      <p className="whitespace-nowrap text-[10px] font-medium text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className={`mt-0.5 text-base font-semibold leading-5 ${color}`}>
        {Number(value || 0).toLocaleString("en-IN")}
      </p>
    </div>
  );
}

export default function ServiceRequests() {
  const [requests, setRequests] = useState([]);
  const [partners, setPartners] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);

  const [status, setStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [serverTotalPages, setServerTotalPages] = useState(1);
  const [serverTotalRequests, setServerTotalRequests] = useState(0);
  const usePaymentFilter = paymentStatus !== "all";
  const serverPage = usePaymentFilter ? 1 : page;
  const [selectedPartners, setSelectedPartners] = useState({});

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reload, setReload] = useState(0);

  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancelError, setCancelError] = useState("");

  // Search backend ko tab call karta hai jab typing 300ms ke liye rukti hai.
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Partner list alag load hoti hai, request filter badalne par dobara nahi.
  useEffect(() => {
    let active = true;

    async function loadPartners() {
      try {
        // Sab statuses load karo, taaki pehle se assigned partner bhi mile.
        const result = await getPartners("", "", 1, 100, "", "");

        if (active) {
          setPartners(Array.isArray(result?.data) ? result.data : []);
        }
      } catch (partnerError) {
        if (active) {
          setError(partnerError.message || "Unable to load partners.");
        }
      }
    }

    loadPartners();

    return () => {
      active = false;
    };
  }, [reload]);

  // Search, status aur page badalne par filtered request data load hota hai.
  useEffect(() => {
    let active = true;

    async function loadRequests() {
      setLoading(true);
      setError("");

      try {
        const limit = usePaymentFilter ? FETCH_PAGE_SIZE : PAGE_SIZE;
        const result = await getPendingServiceRequests({
          status,
          search,
          page: serverPage,
          limit,
        });

        if (!active) return;

        const rows = Array.isArray(result?.data) ? [...result.data] : [];
        const pages = Math.max(1, Number(result?.pagination?.totalPages) || 1);

        if (usePaymentFilter) {
          for (let nextPage = 2; nextPage <= pages; nextPage += 1) {
            const nextResult = await getPendingServiceRequests({
              status,
              search,
              page: nextPage,
              limit,
            });

            if (!active) return;

            if (Array.isArray(nextResult?.data)) {
              rows.push(...nextResult.data);
            }
          }
        }

        setRequests(rows);
        setSummary(result?.summary || EMPTY_SUMMARY);
        setServerTotalPages(pages);
        setServerTotalRequests(Number(result?.pagination?.total) || 0);

        // Agar selected partner ab eligible nahi hai to selection clear ho jayegi.
        setSelectedPartners(current => {
          const next = {};

          for (const request of rows) {
            const choices = getEligiblePartners(
              partners,
              request.service_id,
              request
            );
            const previous = String(current[request.request_id] || "");

            if (
              previous &&
              choices.some(partner => String(partner.partner_id) === previous)
            ) {
              next[request.request_id] = previous;
            } else if (choices.length === 1) {
              next[request.request_id] = String(choices[0].partner_id);
            }
          }

          return next;
        });
      } catch (loadError) {
        if (active) {
          setError(loadError.message || "Unable to load service requests.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadRequests();

    return () => {
      active = false;
    };
  }, [status, search, serverPage, usePaymentFilter, reload, partners]);

  async function handleAssign(request) {
    const partnerId = selectedPartners[request.request_id];

    if (!partnerId) {
      setError("Select an eligible partner first.");
      return;
    }

    setError("");
    setNotice("");
    setSavingId(request.request_id);

    try {
      await assignServiceRequest(request.request_id, partnerId);

      setNotice(
        request.status === "pending"
          ? `Request #${request.request_id} was assigned.`
          : `Request #${request.request_id} was reassigned.`
      );

      setReload(value => value + 1);
    } catch (assignError) {
      setError(assignError.message || "Unable to assign this request.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleCancel() {
    if (!cancelTarget || !cancellationReason.trim()) {
      setCancelError("Enter a cancellation reason.");
      return;
    }

    setCancelError("");
    setSavingId(cancelTarget.request_id);

    try {
      await cancelServiceRequest(
        cancelTarget.request_id,
        cancellationReason.trim()
      );

      setNotice(`Request #${cancelTarget.request_id} was cancelled.`);
      setCancelTarget(null);
      setCancellationReason("");
      setReload(value => value + 1);
    } catch (cancelRequestError) {
      setCancelError(
        cancelRequestError.message || "Unable to cancel this request."
      );
    } finally {
      setSavingId(null);
    }
  }

  function handleStatusChange(nextStatus) {
    setStatus(nextStatus);
    setPage(1);
  }

  function showPaymentDetails(request) {
    const details = [
      "Status: Paid",
      "Service request: " + (request.request_code || request.request_id),
    ];

    if (request.approved_amount != null) {
      const amount = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(Number(request.approved_amount));
      details.push("Amount paid: " + amount);
    }

    if (request.paymentOrderId) {
      details.push("Razorpay order ID: " + request.paymentOrderId);
    }

    Swal.fire({
      title: "Payment details",
      icon: "success",
      text: details.join("\n"),
      customClass: { htmlContainer: "whitespace-pre-line text-left" },
      confirmButtonText: "Close",
    });
  }

  function showCancelDialog(request) {
    setCancelTarget(request);
    setCancellationReason("");
    setCancelError("");
  }

  function closeCancelDialog() {
    if (savingId !== null) return;

    setCancelTarget(null);
    setCancellationReason("");
    setCancelError("");
  }

  let totalRequests = serverTotalRequests;
  let totalPages = serverTotalPages;
  let currentPage = Math.min(page, totalPages);
  let visibleRequests = requests;

  if (usePaymentFilter) {
    const matchingRequests = requests.filter((request) => {
      const rowPaymentStatus = request.paymentStatus || "unavailable";
      return rowPaymentStatus === paymentStatus;
    });

    totalRequests = matchingRequests.length;
    totalPages = Math.max(1, Math.ceil(totalRequests / PAGE_SIZE));
    currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * PAGE_SIZE;
    visibleRequests = matchingRequests.slice(start, start + PAGE_SIZE);
  }

  const firstRow = totalRequests === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const lastRow = Math.min(currentPage * PAGE_SIZE, totalRequests);

  return (
    <div className="w-full space-y-4">
      <header className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="shrink-0">
          <h3 className="flex items-center gap-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
            <Wrench size={20} className="text-violet-600 dark:text-violet-300" />
            Service Requests
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Review requests and manage partner assignments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SummaryCard
            label="Total"
            value={summary.total}
            color="text-slate-900 dark:text-slate-100"
          />
          <SummaryCard
            label="Pending"
            value={summary.pending}
            color="text-amber-700 dark:text-amber-300"
          />
          <SummaryCard
            label="Assigned"
            value={summary.assigned}
            color="text-blue-700 dark:text-blue-300"
          />
          <SummaryCard
            label="In progress"
            value={summary.in_progress}
            color="text-violet-700 dark:text-violet-300"
          />
          <SummaryCard
            label="Completed"
            value={summary.completed}
            color="text-emerald-700 dark:text-emerald-300"
          />
          <SummaryCard
            label="Cancelled"
            value={summary.cancelled}
            color="text-slate-700 dark:text-slate-300"
          />

          <button
            type="button"
            disabled={loading}
            onClick={() => setReload(value => value + 1)}
            aria-label="Refresh service requests"
            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
            />
          </button>
        </div>
      </header>

      {notice && (
        <p
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
        >
          {notice}
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
        >
          {error}
        </p>
      )}

      <section className="flex flex-col gap-2 rounded-xl border border-slate-200/80 bg-white p-3 dark:border-white/[0.08] dark:bg-[#191e2d] sm:flex-row">
        <input
          type="search"
          value={searchInput}
          onChange={event => setSearchInput(event.target.value)}
          placeholder="Search request, client, vehicle, or service..."
          className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-violet-500 dark:border-white/10 dark:bg-[#242a3b] dark:text-white dark:placeholder:text-slate-500"
        />

        <select
          value={status}
          onChange={event => handleStatusChange(event.target.value)}
          aria-label="Filter requests by status"
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs capitalize text-slate-800 outline-none focus:border-violet-500 dark:border-white/10 dark:bg-[#242a3b] dark:text-white"
        >
          {STATUS_OPTIONS.map(option => (
            <option key={option} value={option}>
              {option === "all" ? "All statuses" : formatStatus(option)}
            </option>
          ))}
        </select>
      </section>
       <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-white/[0.08] dark:bg-[#191e2d]">
    <table className="w-full table-fixed text-left text-xs">
      <colgroup>
        <col className="w-[5%]" />
        <col className="w-[10%]" />
        <col className="w-[12%]" />
        <col className="w-[14%]" />
        <col className="w-[7%]" />
        <col className="w-[8%]" />
        <col className="w-[8%]" />
        <col className="w-[13%]" />
        <col className="w-[10%]" />
        <col className="w-[13%]" />
      </colgroup>

      <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500 dark:bg-white/[0.03] dark:text-slate-400">
        <tr>
            <th className="px-2 py-2.5">Sr. No.</th>
          <th className="px-3 py-2.5">Request/date</th>
          <th className="px-3 py-2.5">Client</th>
          <th className="px-3 py-2.5">Service/Problem Desc.</th>
          <th className="px-3 py-2.5">Priority</th>
          <th className="px-3 py-2.5">Preferred</th>
          <th className="px-3 py-2.5">Status</th>
          <th className="px-3 py-2.5">
            <select
              aria-label="Filter by payment status"
              value={paymentStatus}
              onChange={(event) => {
                setPaymentStatus(event.target.value);
                setPage(1);
              }}
              className="max-w-full cursor-pointer rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[10px] font-semibold text-slate-700 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="all">Payment</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="awaiting_quote">Awaiting quote approval</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </th>
          <th className="px-3 py-2.5">Partner</th>
          <th className="px-3 py-2.5">Actions</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
        {(loading || visibleRequests.length === 0) && (
          <tr>
            <td colSpan={10} className="py-10 text-center text-xs text-slate-500 dark:text-slate-400">
              {loading ? "Loading service requests..." : "No matching service requests."}
            </td>
          </tr>
        )}
        {!loading && visibleRequests.map((request, index) => {
          const choices = getEligiblePartners(
            partners,
            request.service_id,
            request
          );

          const assignedPartner = partners.find(
            partner =>
              Number(partner.partner_id) ===
              Number(request.assigned_partner_id)
          );

          return (
            <tr
              key={request.request_id}
              className="align-top text-slate-700 dark:text-slate-300"
            >
                <td className="px-2 py-3 text-slate-500 dark:text-slate-400">
                {firstRow + index}
                </td>
              <td className="break-words px-2 py-3">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                 {request.request_code || "Code unavailable"}
                </p>
                <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                  {formatDate(request.created_at)}
                </p>
              </td>

              <td className="break-words px-2 py-3">
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {request.client_name || "—"}
                </p>
                <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                  {request.vehicle_number || "—"}
                </p>
              </td>

              <td className="break-words px-2 py-3">
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {request.service_name || "—"}
                </p>
                <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-[10px] text-slate-500 dark:text-slate-400">
                  {request.problem_description || "—"}
                </p>
              </td>

              <td className="px-3 py-3">
                <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium capitalize dark:bg-white/10">
                {request.priority || "normal"}</span>
              </td>

              <td className="px-3 py-3 whitespace-nowrap">
                {formatDate(request.preferred_date)}
              </td>

              <td className="break-words px-2 py-3">
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold capitalize ${statusClass(
                    request.status
                  )}`}
                >
                  {formatStatus(request.status)}
                </span>
              </td>
              <td className="break-words px-3 py-3">
                {request.paymentStatus === "paid" && (
                  <button
                    type="button"
                    onClick={() => showPaymentDetails(request)}
                    aria-label={"View payment details for " + (request.request_code || request.request_id)}
                    className="rounded-md bg-emerald-100 px-2 py-1 font-semibold text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-400/15 dark:text-emerald-300"
                  >
                    Paid
                  </button>
                )}
                {request.paymentStatus === "pending" && (
                  <span className="rounded-md bg-amber-100 px-2 py-1 font-semibold text-amber-800 dark:bg-amber-400/15 dark:text-amber-300">
                    Pending
                  </span>
                )}
                {request.paymentStatus === "awaiting_quote" && (
                  <span className="text-slate-500 dark:text-slate-400">
                    Awaiting quote approval
                  </span>
                )}
                {(!request.paymentStatus || request.paymentStatus === "unavailable") && (
                  <span className="text-slate-500 dark:text-slate-400">
                    Unavailable
                  </span>
                )}
              </td>
              <td className="break-words px-2 py-3">
                {assignedPartner ? (
                  <>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {assignedPartner.business_name}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                      {assignedPartner.partner_name}
                    </p>
                  </>
                ) : (
                  <span className="text-slate-500 dark:text-slate-400">
                    Not assigned
                  </span>
                )}
              </td>

              <td className="px-2 py-3">
                {isManageable(request.status) ? (
                  <div className="space-y-1.5">
                    <select
                      aria-label={`Partner for request ${request.request_id}`}
                      value={selectedPartners[request.request_id] || ""}
                      onChange={event =>
                        setSelectedPartners(current => ({
                          ...current,
                          [request.request_id]: event.target.value,
                        }))
                      }
                      disabled={savingId !== null || choices.length === 0}
                      className="w-full rounded-md border border-slate-200 bg-slate-50 px-1.5 py-1.5 text-[10px] text-slate-800 outline-none focus:border-violet-500 dark:border-white/10 dark:bg-[#242a3b] dark:text-white"
                    >
                      <option value="">
                        {choices.length
                          ? "Select partner"
                          : "No eligible partner"}
                      </option>

                      {choices.map(partner => (
                        <option
                          key={partner.partner_id}
                          value={partner.partner_id}
                        >
                          {partner.partner_name}
                        </option>
                      ))}
                    </select>

                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        disabled={
                          savingId !== null ||
                          !selectedPartners[request.request_id] ||
                          choices.length === 0
                        }
                        onClick={() => handleAssign(request)}
                        className="rounded-md bg-violet-600 px-2 py-1.5 text-[10px] font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {savingId === request.request_id
                          ? "Saving..."
                          : request.status === "pending"
                            ? "Assign"
                            : "Reassign"}
                      </button>

                      <button
                        type="button"
                        disabled={savingId !== null}
                        onClick={() => showCancelDialog(request)}
                        className="rounded-md border border-rose-300 px-2 py-1.5 text-[10px] font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-400/30 dark:text-rose-300 dark:hover:bg-rose-400/10"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>

  <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-3 py-2.5 text-[10px] dark:border-white/[0.06]">
    <p className="text-slate-500 dark:text-slate-400">
      Showing {firstRow}–{lastRow} of {totalRequests} requests
    </p>

    <div className="flex items-center gap-1.5">
      <button
        type="button"
        disabled={loading || currentPage <= 1}
        onClick={() => setPage(currentPage - 1)}
        className="rounded-md border border-slate-200 px-2.5 py-1.5 text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-slate-300"
      >
        Previous
      </button>

      <span className="px-1 text-slate-500 dark:text-slate-400">
        {currentPage} / {totalPages}
      </span>

      <button
        type="button"
        disabled={loading || currentPage >= totalPages}
        onClick={() => setPage(currentPage + 1)}
        className="rounded-md border border-slate-200 px-2.5 py-1.5 text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-slate-300"
      >
        Next
      </button> 
    </div>
  </footer>
</section>
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-request-title"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-[#191e2d]"
          >
            <h2
              id="cancel-request-title"
              className="text-base font-semibold text-slate-900 dark:text-slate-100"
            >
              Cancel request #{cancelTarget.request_id}
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Enter the reason for cancelling this request.
            </p>

            <textarea
              value={cancellationReason}
              onChange={event => setCancellationReason(event.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Cancellation reason"
              className="mt-3 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-violet-500 dark:border-white/10 dark:bg-[#242a3b] dark:text-white"
            />

            <div className="mt-1 flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
              {cancelError ? (
                <p role="alert" className="text-red-600 dark:text-red-300">
                  {cancelError}
                </p>
              ) : (
                <span />
              )}
              <span>{cancellationReason.length}/500</span>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                disabled={savingId !== null}
                onClick={closeCancelDialog}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 dark:border-white/10 dark:text-slate-300"
              >
                Keep request
              </button>
              <button
                type="button"
                disabled={savingId !== null || !cancellationReason.trim()}
                onClick={handleCancel}
                className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingId === cancelTarget.request_id
                  ? "Cancelling..."
                  : "Confirm cancellation"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
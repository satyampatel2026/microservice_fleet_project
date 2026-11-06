import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { Search, ArrowDownUp, ChevronDown, Eye, UsersRound, RefreshCw, X, Loader2, ShieldCheck, Truck, Check } from "lucide-react";
import { getClients, getClientDetails, updateClientStatus } from "../../services/clientService";
import { getVerificationList, saveVerification } from "../../services/verificationService";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("");
  const [status, setStatus] = useState("");
  const [businessStatus, setBusinessStatus] = useState("");
  const [vehicleApproval, setVehicleApproval] = useState("");
  const [reviewVehicleStatus, setReviewVehicleStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [detailsMode, setDetailsMode] = useState("business");
  const [statusBusy, setStatusBusy] = useState(null);
  const [failedChange, setFailedChange] = useState(null);
  const statusLock = useRef(false);

  async function handleStatusChange(client, requestedStatus) {
    if (statusLock.current) return;
    const nextStatus = requestedStatus || (client.status === "active" ? "inactive" : "active");
    statusLock.current = true;
    setStatusBusy(client.client_id);
    try {
      const confirmation = await Swal.fire({
        titleText: nextStatus === "active" ? "Activate client?" : "Deactivate client?",
        text: nextStatus === "active" ? `${client.name} will be allowed to sign in.` : `${client.name} will be blocked from login and protected APIs that check active account status.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: nextStatus === "active" ? "Activate" : "Deactivate",
        confirmButtonColor: nextStatus === "active" ? "#059669" : "#dc2626",
        focusCancel: true,
      });
      if (!confirmation.isConfirmed) return;
      await updateClientStatus(client.client_id, nextStatus);
      setFailedChange(null);
      setReload((value) => value + 1);
      Swal.fire({ toast: true, position: "top-end", icon: "success", titleText: "Client status updated", timer: 2500, showConfirmButton: false });
    } catch (error) {
      // Dono services mein update partial hua ho to SAME target status retry karo.
      setFailedChange({ client, status: nextStatus, message: error.message });
      setReload((value) => value + 1);
      Swal.fire({ icon: "error", titleText: "Status update incomplete", text: error.message });
    } finally {
      statusLock.current = false;
      setStatusBusy(null);
    }
  }

  // Search/filter/page badalne par backend se current page mangwao.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    const timer = setTimeout(async () => {
      try {
        const result = await getClients(search, status, page, limit, sort, businessStatus, vehicleApproval);
        if (cancelled) return;
        setClients(result.data);
        setStats(result.stats);
        setPagination(result.pagination);
        setPage(result.pagination.page);
      } catch (error) {
        if (!cancelled) setError(error.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, status, page, limit, sort, businessStatus, vehicleApproval, reload]);

  function openReview(client, mode, initialVehicleStatus) {
    setReviewVehicleStatus(initialVehicleStatus || vehicleApproval || "all");
    setDetailsMode(mode);
    setSelectedId(client.client_id);
  }

  const start = pagination.total === 0 ? 0 : (pagination.page - 1) * limit + 1;
  const end = Math.min(pagination.page * limit, pagination.total);

  return (
    <div className="-mt-2 w-full min-w-0 space-y-2 lg:-mt-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-violet-50 p-2 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300"><UsersRound size={17} /></span>
          <div><h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Clients Management</h3><p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Personal details, business verification and vehicle reviews.</p></div>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5" aria-label="Client counts">
            {[
              { label: "Total", value: stats?.total, color: "text-violet-600 dark:text-violet-300", dot: "bg-violet-500" },
              { label: "Active", value: stats?.active, color: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
              { label: "Inactive", value: stats?.inactive, color: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
              { label: "Pending Clients", value: stats?.pending_clients, color: "text-orange-600 dark:text-orange-300", dot: "bg-orange-500" },
              { label: "Pending Vehicles", value: stats?.pending_vehicles, color: "text-rose-600 dark:text-rose-300", dot: "bg-rose-500" },
            ].map((card) => <div key={card.label} className="min-w-[72px] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 dark:border-white/10 dark:bg-[#191e2d]"><p className="flex items-center gap-1.5 text-[10px] text-slate-400"><span className={`h-1.5 w-1.5 rounded-full ${card.dot}`} />{card.label}</p><p className={`mt-0.5 text-sm font-semibold leading-4 tabular-nums ${card.color}`}>{card.value ?? "—"}</p></div>)}
          </div>
        <button type="button" onClick={() => setReload(reload + 1)} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"><RefreshCw size={13} className={loading ? "animate-spin" : ""} />Refresh</button>
        </div>
      </header>

      {failedChange && <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300"><p>{failedChange.message}</p><button type="button" disabled={statusBusy !== null} onClick={() => handleStatusChange(failedChange.client, failedChange.status)} className="mt-2 font-semibold underline disabled:opacity-50">Retry setting {failedChange.client.name} to {failedChange.status}</button></div>}

      <section className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#191e2d]">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-3 py-2.5 dark:border-white/10">
          <div className="relative w-full sm:max-w-xs"><Search size={15} className="pointer-events-none absolute left-3 top-2.5 text-slate-400" /><input type="search" aria-label="Search clients by code, name, email or mobile" placeholder="Search code, name, email or mobile..." maxLength={100} value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/5 dark:text-slate-200" /></div>
          {(search || status || businessStatus || vehicleApproval) && <button type="button" onClick={() => { setSearch(""); setStatus(""); setBusinessStatus(""); setVehicleApproval(""); setPage(1); }} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:text-violet-600 dark:text-slate-400"><X size={12} />Clear</button>}
          <span aria-live="polite" className="ml-auto text-[11px] text-slate-400">{loading ? "Loading..." : error ? "Unable to load records" : `${pagination.total} matching clients`}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead><tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400">
              <th scope="col" className="w-16 whitespace-nowrap px-3 py-2.5 text-center">Sr. No.</th>
              <th scope="col" className="w-16 px-3 py-2.5 text-center">Photo</th>
              <th scope="col" className="px-3 py-2.5" aria-sort={sort === "asc" ? "ascending" : sort === "desc" ? "descending" : "none"}><button type="button" onClick={() => { setSort(sort === "asc" ? "desc" : "asc"); setPage(1); }} title="Sort clients A–Z or Z–A" className={`inline-flex items-center gap-1.5 rounded py-1 text-[10px] font-semibold uppercase tracking-wide focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500 ${sort ? "text-violet-600 dark:text-violet-300" : ""}`}>Client<ArrowDownUp size={13} />{sort && <span className="text-[9px] font-medium">{sort === "asc" ? "A–Z" : "Z–A"}</span>}</button></th>
              <th scope="col" className="px-3 py-2.5">Email</th>
              <th scope="col" className="px-3 py-2.5">Mobile</th>
              <th scope="col" className="px-3 py-2.5"><span className={`inline-flex items-center gap-1.5 ${status ? "text-violet-600 dark:text-violet-300" : ""}`}>Status<span className="relative inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-violet-100 focus-within:ring-2 focus-within:ring-violet-400 dark:hover:bg-violet-500/10"><ChevronDown size={13} aria-hidden="true" /><select aria-label="Filter client status" title="Filter client status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="absolute inset-0 h-full w-full cursor-pointer opacity-0"><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></span>{status && <span className="text-[10px] capitalize">{status}</span>}</span></th>
              <th scope="col" className="whitespace-nowrap px-3 py-2.5"><span className={`inline-flex items-center gap-1 ${businessStatus ? "text-violet-600 dark:text-violet-300" : ""}`}>Business<span className="relative inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-violet-100 focus-within:ring-2 focus-within:ring-violet-400 dark:hover:bg-violet-500/10"><ChevronDown size={13} aria-hidden="true"/><select aria-label="Filter business verification" title="Filter client business verification" value={businessStatus} onChange={event=>{setBusinessStatus(event.target.value);setPage(1);}} className="absolute inset-0 h-full w-full cursor-pointer opacity-0"><option value="">All clients</option><option value="pending">Pending</option><option value="verified">Verified</option><option value="rejected">Rejected</option></select></span>{businessStatus && <span className="text-[9px] capitalize">{businessStatus}</span>}</span></th>
              <th scope="col" className="whitespace-nowrap px-3 py-2.5">Registered</th>
              <th scope="col" className="whitespace-nowrap px-3 py-2.5 text-center"><span className={`inline-flex items-center gap-1 ${vehicleApproval ? "text-violet-600 dark:text-violet-300" : ""}`}>Vehicles<span className="relative inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-violet-100 focus-within:ring-2 focus-within:ring-violet-400 dark:hover:bg-violet-500/10"><ChevronDown size={13} aria-hidden="true"/><select aria-label="Filter clients by vehicle approval" title="Filter vehicle verification" value={vehicleApproval} onChange={event=>{setVehicleApproval(event.target.value);setPage(1);}} className="absolute inset-0 h-full w-full cursor-pointer opacity-0"><option value="">All vehicles</option><option value="pending">Has pending vehicles</option><option value="verified">Has verified vehicles</option><option value="rejected">Has rejected vehicles</option></select></span>{vehicleApproval && <span className="text-[9px] capitalize">{vehicleApproval}</span>}</span></th>
              <th scope="col" className="whitespace-nowrap px-3 py-2.5 text-center">View Details</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
              {loading ? <tr><td colSpan={10} className="px-3 py-12"><span role="status" className="flex items-center justify-center gap-2 text-xs text-slate-400"><Loader2 size={16} className="animate-spin" />Loading clients...</span></td></tr> : error ? <tr><td colSpan={10} className="px-3 py-8 text-center"><p role="alert" className="text-xs text-red-500">{error}</p><button type="button" onClick={() => setReload(reload + 1)} className="mt-2 text-xs font-semibold text-violet-600">Retry</button></td></tr> : clients.length === 0 ? <tr><td colSpan={10} className="px-3 py-12 text-center text-xs text-slate-400">No clients found. Try another search or status.</td></tr> : clients.map((client, index) => (
                <tr key={client.client_id} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02]">
                  <td className="px-3 py-2.5 text-center align-middle tabular-nums text-slate-500 dark:text-slate-400">{(pagination.page - 1) * limit + index + 1}</td>
                  <td className="px-3 py-2.5 text-center"><button type="button" onClick={()=>openReview(client,"personal")} title="View personal details" aria-label={`Personal details of ${client.name}`} className="rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500"><ProfilePhoto url={client.photo_url} name={client.name} /></button></td>
                  <td className="px-3 py-2.5"><p title={client.name} className="max-w-[170px] truncate font-semibold text-slate-800 dark:text-slate-100">{client.name}</p><p className="mt-0.5 text-[10px] text-slate-400">{client.client_code || "—"}</p></td>
                  <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300"><p title={client.email} className="max-w-[220px] truncate">{client.email}</p></td>
                  <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-slate-500 dark:text-slate-400">{client.mobile}</td>
                  <td className="px-3 py-2.5">
                    <button type="button" role="switch" aria-checked={client.status === "active"} aria-label={`Account access for ${client.name}`} title={client.status === "active" ? "Deactivate client" : "Activate client"} disabled={statusBusy !== null || failedChange !== null} onClick={() => handleStatusChange(client)} className="inline-flex items-center gap-2 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500 disabled:cursor-not-allowed disabled:opacity-50">
                      <span className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${client.status === "active" ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}><span className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${client.status === "active" ? "translate-x-4" : "translate-x-0"}`} /></span>
                      <span className="text-[10px] capitalize text-slate-500 dark:text-slate-400">{statusBusy === client.client_id ? "Updating..." : client.status}</span>
                    </button>
                  </td>
                  <td className="px-3 py-2.5"><button type="button" onClick={()=>openReview(client,"business")} title="Review client business" className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${client.business_verification_status==="verified"?"bg-emerald-500/10 text-emerald-600 dark:text-emerald-300":client.business_verification_status==="rejected"?"bg-red-500/10 text-red-500":"bg-amber-500/10 text-amber-600 dark:text-amber-300"}`}><ShieldCheck size={12}/>{client.business_verification_status||"pending"}</button></td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-[11px] text-slate-500 dark:text-slate-400">{formatDate(client.created_at)}</td>
                  <td className="px-3 py-2.5 text-center"><button type="button" onClick={()=>openReview(client,"vehicles")} title="Review this client's vehicles" className="inline-flex items-center gap-1.5 rounded-md border border-violet-200 bg-violet-50 px-2 py-1.5 text-violet-600 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-300"><Truck size={14}/>{client.vehicle_count??0}</button>{Number(client.pending_vehicle_count)>0 && <button type="button" onClick={()=>openReview(client,"vehicles","pending")} title="Review pending vehicles only" className="mx-auto mt-1 block whitespace-nowrap rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 hover:bg-amber-500/20 dark:text-amber-300">{client.pending_vehicle_count} pending</button>}</td>
                  <td className="px-3 py-2.5 text-center"><button type="button" onClick={() => openReview(client, "business")} title="Business details and verification" aria-label={`View details for ${client.name}`} className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-violet-100 bg-violet-50 text-violet-600 hover:bg-violet-100 dark:border-violet-400/15 dark:bg-violet-400/10 dark:text-violet-300"><Eye size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-3 py-2.5 text-[11px] text-slate-500 dark:border-white/10 dark:text-slate-400">
          <span>{loading ? "Updating list..." : error ? "Records unavailable" : `Showing ${start}–${end} of ${pagination.total}`}</span>
          <div className="flex flex-wrap items-center gap-2">
            <select aria-label="Clients per page" disabled={loading} value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }} className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-white/10 dark:bg-[#191e2d]"><option value={10}>10 / page</option><option value={20}>20 / page</option><option value={50}>50 / page</option></select>
            <button type="button" disabled={loading || !!error || page <= 1} onClick={() => setPage(page - 1)} className="rounded-md border border-slate-200 px-2.5 py-1.5 disabled:opacity-40 dark:border-white/10">Previous</button>
            <span>Page {pagination.page} / {pagination.totalPages}</span>
            <button type="button" disabled={loading || !!error || page >= pagination.totalPages} onClick={() => setPage(page + 1)} className="rounded-md border border-slate-200 px-2.5 py-1.5 disabled:opacity-40 dark:border-white/10">Next</button>
          </div>
        </div>
      </section>
      {selectedId !== null && <ClientReviewDialog key={`${detailsMode}-${selectedId}`} clientId={selectedId} mode={detailsMode} initialVehicleStatus={reviewVehicleStatus} onSaved={()=>setReload(value=>value+1)} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

// Same page ke andar personal/business/vehicle review dialog.
function ClientReviewDialog({ clientId, mode, initialVehicleStatus = "all", onSaved, onClose }) {
  const dialog = useRef(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [vehicleLoading, setVehicleLoading] = useState(true);
  const [vehicleError, setVehicleError] = useState("");
  const [vehicleStatus, setVehicleStatus] = useState(initialVehicleStatus);
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [vehiclePage, setVehiclePage] = useState(1);
  const [vehiclePagination, setVehiclePagination] = useState({ total: 0, totalPages: 1 });
  const [vehicleReload, setVehicleReload] = useState(0);

  useEffect(() => { dialog.current.showModal(); }, []);
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError("");
    getClientDetails(clientId).then(result => {
      if (!result.data) throw new Error("Client details unavailable");
      if (!cancelled) setClient(result.data);
    }).catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [clientId, retry]);

  // This filter is sent to backend, not only applied on the displayed rows.
  useEffect(() => {
    if (mode !== "vehicles") return;
    let cancelled = false;
    const controller = new AbortController();
    setVehicleLoading(true); setVehicleError("");
    const timer = setTimeout(async () => {
      try {
        const result = await getVerificationList("vehicles", {
          clientId: String(clientId), status: vehicleStatus,
          page: String(vehiclePage), search: vehicleSearch,
        }, controller.signal);
        if (cancelled) return;
        setVehicles(result.data);
        setVehiclePagination(result.pagination);
        setVehiclePage(result.pagination.page);
      } catch (err) { if (!cancelled) setVehicleError(err.message); }
      finally { if (!cancelled) setVehicleLoading(false); }
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); controller.abort(); };
  }, [mode, clientId, vehicleStatus, vehicleSearch, vehiclePage, vehicleReload]);

  async function submitReview(kind, id, decision, reason) {
    if (busy) return;
    setBusy(true); setActionError("");
    try {
      await saveVerification(kind, id, decision, reason);
      onSaved();
      if (kind === "vehicles") setVehicleReload(value => value + 1);
      else setRetry(value => value + 1);
    } catch (err) { setActionError(err.message); }
    finally { setBusy(false); }
  }

  const title = mode === "personal" ? "Personal Details" : mode === "business" ? "Business Details" : "Client Vehicles";
  const field = "rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 dark:border-white/10 dark:bg-[#191e2d] dark:text-slate-200";
  return <dialog ref={dialog} onClose={onClose} onCancel={event => { if (busy) event.preventDefault(); }} aria-labelledby="client-review-title"
    className={`fixed inset-0 m-auto max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-0 text-slate-700 shadow-2xl backdrop:bg-slate-950/50 dark:border-white/10 dark:bg-[#191e2d] dark:text-slate-200 ${mode === "vehicles" ? "max-w-5xl" : mode === "personal" ? "max-w-sm" : "max-w-lg"}`}>
    <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-white/10"><div><h2 id="client-review-title" className="text-sm font-semibold">{title}</h2><p className="mt-0.5 text-[10px] text-slate-400">{client?.name || "Loading client..."} · {client?.client_code || ""}</p></div><button type="button" disabled={busy} onClick={() => dialog.current.close()} aria-label="Close details" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-white/5"><X size={17} /></button></header>
    <div className="p-4">
      {actionError && <p role="alert" className="mb-3 rounded-lg bg-red-500/10 p-2 text-xs text-red-500">{actionError}</p>}
      {loading ? <p role="status" className="flex items-center gap-2 py-6 text-xs text-slate-400"><Loader2 size={15} className="animate-spin" />Loading details...</p> : error ? <p role="alert" className="text-xs text-red-500">{error}<button type="button" onClick={() => setRetry(value => value + 1)} className="ml-2 underline">Retry</button></p> : client && <>
        {mode === "personal" && <>
          <div className="mb-4 flex items-center gap-3"><ProfilePhoto url={client.photo_url} name={client.name} /><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{client.name}</p><p className="mt-0.5 text-[10px] text-slate-400">{client.client_code}</p>{client.photo_url && <a href={client.photo_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[10px] text-violet-500">Open photo</a>}</div></div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            <DetailField label="Email" value={client.email} />
            <DetailField label="Mobile" value={client.mobile} />
            <DetailField label="Gender" value={client.gender} />
            <DetailField label="Account status" value={client.status} />
            <DetailField label="Personal address" value={client.personal_address} wide />
            <DetailField label="Registered" value={formatDate(client.created_at)} wide />
          </dl>
        </>}
        {mode === "business" && <>
          <div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-semibold">{client.company_name || "Company not provided"}</h3><ReviewBadge status={client.business_verification_status} /></div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            <DetailField label="Business type" value={client.business_type} />
            <DetailField label="GSTIN" value={client.gstin} />
            <DetailField label="PAN" value={client.pan_number} />
            <DetailField label="Aadhaar" value={client.aadhaar_last4 ? `XXXXXXXX${client.aadhaar_last4}` : "Not provided"} />
            <DetailField label="Reviewed" value={formatDate(client.business_reviewed_at)} wide />
          </dl>
          {client.business_rejection_reason && <p className="mt-3 text-xs text-red-500">Reason: {client.business_rejection_reason}</p>}
          <details className="mt-4 rounded-lg border border-slate-200 dark:border-white/10"><summary className="cursor-pointer px-3 py-2 text-xs text-violet-500">Accepted Terms & Conditions · {client.terms_version || "—"}</summary><p className="max-h-40 overflow-y-auto whitespace-pre-wrap border-t border-slate-100 p-3 text-xs leading-6 dark:border-white/10">{client.terms_content || "Not available"}</p></details>
          <div className="mt-4 border-t border-slate-100 pt-3 dark:border-white/10"><ReviewButtons status={client.business_verification_status || "pending"} busy={busy} onSubmit={(decision, reason) => submitReview("businesses", clientId, decision, reason)} /></div>
        </>}
        {mode === "vehicles" && <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><p className="text-xs text-slate-400">{vehiclePagination.total} vehicles belonging to this client</p><button type="button" disabled={busy || vehicleLoading} onClick={()=>setVehicleReload(value=>value+1)} title="Refresh vehicles and RC links" aria-label="Refresh vehicles and RC links" className="rounded p-1 text-violet-500 disabled:opacity-40"><RefreshCw size={13}/></button></div><div className="flex flex-wrap gap-2"><input aria-label="Search client vehicles" placeholder="Search vehicle number..." maxLength={100} value={vehicleSearch} disabled={busy} onChange={event => { setVehicleSearch(event.target.value); setVehiclePage(1); }} className={field} /><select aria-label="Filter vehicle approval" value={vehicleStatus} disabled={busy} onChange={event => { setVehicleStatus(event.target.value); setVehiclePage(1); }} className={field}>{["all", "pending", "verified", "rejected"].map(value => <option key={value}>{value}</option>)}</select></div></div>
          {vehicleError && <p role="alert" className="mb-2 text-xs text-red-500">{vehicleError}<button type="button" onClick={() => setVehicleReload(value => value + 1)} className="ml-2 underline">Retry</button></p>}
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-white/10"><table className="w-full text-left text-xs"><thead className="bg-slate-50 text-[10px] text-slate-500 dark:bg-white/5 dark:text-slate-400"><tr>{["Vehicle", "Registration / Expiry", "RC", "Approval", "Review"].map(label => <th key={label} className="px-3 py-2.5">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 dark:divide-white/10">
            {vehicleLoading ? <tr><td colSpan={5} className="p-6 text-center text-slate-400">Loading vehicles...</td></tr> : vehicleError ? null : vehicles.map(vehicle => <tr key={vehicle.vehicle_id}>
              <td className="whitespace-nowrap px-3 py-3"><p className="font-semibold">{vehicle.vehicle_number}</p><p className="mt-1 text-[10px] text-slate-400">{[vehicle.vehicle_type, vehicle.brand, vehicle.model].filter(Boolean).join(" / ")}</p><p className="mt-1 text-[10px] text-slate-400">Account: {vehicle.status}</p></td>
              <td className="whitespace-nowrap px-3 py-3"><p>{vehicle.registration_date || "Not provided"}</p><p className="mt-1 text-[10px] text-slate-400">Expiry: {vehicle.expiry_date || "Not provided"}</p></td>
              <td className="px-3 py-3">{Boolean(vehicle.rc_url) ? <a href={vehicle.rc_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-violet-500"><Eye size={14} />View RC</a> : <span className="text-slate-400">Missing</span>}</td>
              <td className="px-3 py-3"><ReviewBadge status={vehicle.approval_status} />{vehicle.rejection_reason && <p className="mt-2 max-w-44 text-[10px] text-red-500">{vehicle.rejection_reason}</p>}</td>
              <td className="min-w-44 px-3 py-3"><ReviewButtons status={vehicle.approval_status} busy={busy} onSubmit={(decision, reason) => submitReview("vehicles", vehicle.vehicle_id, decision, reason)} /></td>
            </tr>)}
            {!vehicleLoading && !vehicleError && !vehicles.length && <tr><td colSpan={5} className="p-6 text-center text-slate-400">No matching vehicles for this client.</td></tr>}
          </tbody></table></div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400"><span>Page {vehiclePage} / {vehiclePagination.totalPages}</span><div className="flex gap-2"><button type="button" disabled={busy || vehicleLoading || !!vehicleError || vehiclePage <= 1} onClick={() => setVehiclePage(value => value - 1)} className={`${field} disabled:opacity-40`}>Previous</button><button type="button" disabled={busy || vehicleLoading || !!vehicleError || vehiclePage >= vehiclePagination.totalPages} onClick={() => setVehiclePage(value => value + 1)} className={`${field} disabled:opacity-40`}>Next</button></div></div>
        </>}
      </>}
    </div>
  </dialog>;
}

function DetailField({ label, value, wide }) {
  return <div className={wide ? "col-span-2" : ""}><dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt><dd className="mt-0.5 whitespace-pre-wrap break-words text-xs leading-5">{value || "Not provided"}</dd></div>;
}
function ReviewBadge({ status }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium ${status === "verified" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" : status === "rejected" ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-600 dark:text-amber-300"}`}><ShieldCheck size={12} />{status || "pending"}</span>;
}
// Reject reason form stays INSIDE the dialog; no nested popup/focus problems.
function ReviewButtons({ status, busy, onSubmit }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  if (status !== "pending") return <p className="text-[10px] text-slate-400">Reviewed</p>;
  if (rejecting) return <div className="space-y-2"><textarea aria-label="Rejection reason" value={reason} maxLength={500} rows={3} disabled={busy} onChange={event => setReason(event.target.value)} placeholder="Rejection reason (3-500 characters)" className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-700 outline-none focus:border-violet-400 dark:border-white/10 dark:bg-[#191e2d] dark:text-slate-200" />{error && <p role="alert" className="text-[10px] text-red-500">{error}</p>}<div className="flex gap-2"><button type="button" disabled={busy} onClick={() => { if (reason.trim().length < 3) return setError("Enter at least 3 characters"); setError(""); onSubmit("rejected", reason.trim()); }} className="rounded-lg bg-red-600 px-3 py-2 text-[11px] font-medium text-white disabled:opacity-40">Reject</button><button type="button" disabled={busy} onClick={() => { setRejecting(false); setError(""); }} className="rounded-lg border border-slate-200 px-3 py-2 text-[11px] dark:border-white/10">Cancel</button></div></div>;
  return <div className="flex gap-2"><button type="button" disabled={busy} onClick={() => onSubmit("verified", "")} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-medium text-white disabled:opacity-40"><Check size={13} />Verify</button><button type="button" disabled={busy} onClick={() => setRejecting(true)} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-[11px] font-medium text-red-500 disabled:opacity-40 dark:border-red-400/20"><X size={13} />Reject</button></div>;
}

// Photo na ho ya load fail ho to naam ke initials dikhenge.
function ProfilePhoto({ url, name }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [url]);
  const initials = (name || "User").trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  if (!url || failed) return <span aria-label={`No photo for ${name || "user"}`} className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-violet-100 bg-violet-50 text-[10px] font-semibold text-violet-600 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-300">{initials}</span>;
  return <span aria-label={`Profile photo of ${name || "user"}`} className="mx-auto block h-9 w-9 overflow-hidden rounded-full border border-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500 dark:border-white/10"><img src={url} alt={`${name || "User"} profile`} loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover" /></span>;
}

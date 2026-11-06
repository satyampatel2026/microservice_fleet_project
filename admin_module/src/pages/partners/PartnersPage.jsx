import { useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import { ArrowDownUp, ChevronDown, Eye, X, Wrench, Layers3, CheckCircle2, FileText, ExternalLink, Search, RefreshCw, ClipboardCheck } from "lucide-react";
import { getPartners, updatePartnerStatus, getPartnerServiceCatalog, getKycDetails, verifyKyc, rejectKyc } from "../../services/partnerService";

// Sirf is file ko replace karna hai. API functions purani service file mein rahenge.
export default function PartnersPage() {
  const [partners, setPartners] = useState([]);
  const [stats, setStats] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [catalogError, setCatalogError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [kycStatus, setKycStatus] = useState("");
  const [sort, setSort] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [servicesPartner, setServicesPartner] = useState(null);
  const [kycId, setKycId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [limit, setLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  // Search rukne ke 400ms baad backend se current page lao.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    const timer = setTimeout(async () => {
      try {
        const result = await getPartners(search, status, page, limit, sort, kycStatus);
        if (cancelled) return;
        setPartners(result.data || []);
        setStats(result.stats);
        setTotalPages(result.pagination.totalPages);
        setTotalRecords(result.pagination.total);
        setPage(result.pagination.page);
      } catch (error) {
        if (!cancelled) setError(error.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 400);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [search, status, page, limit, sort, kycStatus, reload]);

  useEffect(() => {
    let cancelled = false;
    getPartnerServiceCatalog().then((result) => {
      if (!cancelled) { setCatalog(result.data || []); setCatalogError(""); }
    }).catch((error) => { if (!cancelled) setCatalogError(error.message); });
    return () => { cancelled = true; };
  }, [reload]);

  async function changeStatus(partner) {
    const nextStatus = partner.status === "active" ? "inactive" : "active";
    const result = await Swal.fire({
      icon: "warning", title: nextStatus === "active" ? "Activate partner?" : "Deactivate partner?",
      text: partner.partner_name, showCancelButton: true, confirmButtonText: "Yes, continue",
      confirmButtonColor: "#7c3aed",
    });
    if (!result.isConfirmed) return;
    setUpdatingId(partner.partner_id);
    try {
      await updatePartnerStatus(partner.partner_id, nextStatus);
      setReload((value) => value + 1);
      Swal.fire({ icon: "success", title: "Partner status updated", timer: 1600, showConfirmButton: false });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Unable to update status", text: error.message });
    } finally { setUpdatingId(null); }
  }

  function kycUpdated(updated) {
    setReload((value) => value + 1);
    setPartners((rows) => rows.map((partner) =>
      partner.kyc_id === updated.kyc_id ? { ...partner, kyc_status: updated.kyc_status } : partner
    ));
  }

  const buttonClass = "partner-table-action inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40";
  return (
    <div className="partner-management -mt-2 w-full min-w-0 space-y-2 text-slate-700 lg:-mt-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-1"><h3 className="text-base font-semibold text-slate-900">Partner Management</h3><p className="mt-0.5 text-[11px] text-slate-500">Manage partners, services and KYC verification.</p></div>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4" aria-label="Partner statistics">
          {[
            { label: "Total Partners", value: stats?.total, color: "text-violet-700", dot: "bg-violet-500" },
            { label: "Verified KYC", value: stats?.verified, color: "text-emerald-700", dot: "bg-emerald-500" },
            { label: "Rejected KYC", value: stats?.rejected, color: "text-red-600", dot: "bg-red-500" },
            { label: "Pending KYC", value: stats?.pending, color: "text-amber-700", dot: "bg-amber-500" },
          ].map((card) => (
            <div key={card.label} className="min-w-[82px] rounded-lg border border-slate-200 bg-white px-2 py-1.5">
              <p className="flex items-center gap-1.5 whitespace-nowrap text-[10px] font-medium text-slate-500"><span className={`h-1.5 w-1.5 rounded-full ${card.dot}`} />{card.label}</p>
              <p className={`mt-0.5 text-sm font-semibold leading-4 tabular-nums ${card.color}`}>{card.value ?? "—"}</p>
            </div>
          ))}
        </div>
        <button type="button" disabled={loading} onClick={() => setReload((value) => value + 1)} className={buttonClass}><RefreshCw size={14} className={loading ? "animate-spin" : ""} />Refresh</button>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-3">
          <div className="relative max-w-sm"><Search size={15} className="absolute left-3 top-3 text-slate-400" /><input aria-label="Search partners" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search code, name, email or mobile..." className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" /></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 text-[11px] text-slate-500"><tr>
              <th className="w-14 px-3 py-3 text-center">Sr. No.</th><th className="w-16 px-3 py-3 text-center">Photo</th><th className="px-3 py-3" aria-sort={sort === "asc" ? "ascending" : sort === "desc" ? "descending" : "none"}><button type="button" onClick={() => { setSort(sort === "asc" ? "desc" : "asc"); setPage(1); }} className="inline-flex items-center gap-1.5" title="Sort partner name A–Z / Z–A">Partner <ArrowDownUp size={13} />{sort && <span className="text-[10px] text-violet-600">{sort === "asc" ? "A–Z" : "Z–A"}</span>}</button></th><th className="px-3 py-3">Joined</th>
              <th className="px-3 py-3"><div className="inline-flex items-center gap-1">Status<span className="relative inline-flex h-6 w-6 items-center justify-center"><ChevronDown size={13} /><select aria-label="Filter partner status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="absolute inset-0 w-full cursor-pointer opacity-0"><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></span>{status && <span className="text-violet-600">({status})</span>}</div></th>
              <th className="px-3 py-3"><span className={`inline-flex items-center gap-1 ${kycStatus ? "text-violet-600" : ""}`}>KYC<span className="relative inline-flex h-6 w-6 items-center justify-center"><ChevronDown size={13} /><select aria-label="Filter KYC status" value={kycStatus} onChange={(event) => { setKycStatus(event.target.value); setPage(1); }} className="absolute inset-0 h-full w-full cursor-pointer opacity-0"><option value="">All KYC</option><option value="pending">Pending</option><option value="verified">Verified</option><option value="rejected">Rejected</option><option value="not_submitted">Not submitted</option></select></span>{kycStatus && <span className="text-[10px] font-normal capitalize">({kycStatus.replace("_", " ")})</span>}</span></th><th className="px-3 py-3 text-center">View Details</th><th className="px-3 py-3 text-center">Services</th><th className="px-3 py-3 text-center">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? <tr><td colSpan={9} className="p-8 text-center text-slate-400">Loading partners...</td></tr> : error ? <tr><td colSpan={9} className="p-6 text-center"><p role="alert" className="mb-3 text-red-600">{error}</p><button type="button" className={buttonClass} onClick={() => setReload((value) => value + 1)}>Retry</button></td></tr> : partners.length === 0 ? <tr><td colSpan={9} className="p-8 text-center text-slate-400">No partners found. Try changing your search or status filter.</td></tr> : partners.map((partner, index) => (
                <tr key={partner.partner_id} className="hover:bg-slate-50/60">
                  <td className="px-3 py-3 text-center text-slate-400">{(page - 1) * limit + index + 1}</td>
                  <td className="px-3 py-3 text-center"><ProfilePhoto url={partner.photo_url} name={partner.partner_name} /></td>
                  <td className="px-3 py-3"><p className="max-w-[180px] truncate font-semibold text-slate-800" title={partner.partner_name}>{partner.partner_name}</p><p className="mt-1 text-[10px] text-slate-400">{partner.partner_code || "—"}</p></td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-500">{partner.created_at ? new Date(partner.created_at).toLocaleDateString("en-IN") : "—"}</td>
                  <td className="px-3 py-3"><KycStatusBadge status={partner.status} /></td>
                  <td className="px-3 py-3"><KycStatusBadge status={partner.kyc_status || "not submitted"} /></td>
                  <td className="px-3 py-3 text-center"><button type="button" title="View personal details" aria-label={`View details for ${partner.partner_name}`} onClick={() => setSelectedPartner(partner)} className={buttonClass}><Eye size={14} /></button></td>
                  <td className="px-3 py-3 text-center"><button type="button" title="View selected services" aria-label={`View services for ${partner.partner_name}`} onClick={() => setServicesPartner(partner)} className={buttonClass}><Wrench size={14} /></button></td>
                  <td className="px-3 py-3"><div className="flex items-center justify-center gap-2"><button type="button" disabled={!partner.kyc_id} title={!partner.kyc_id ? "KYC not submitted" : "Review KYC"} onClick={() => setKycId(partner.kyc_id)} className={buttonClass}><ClipboardCheck size={13} />Review</button><button type="button" disabled={updatingId === partner.partner_id} onClick={() => changeStatus(partner)} className={buttonClass}>{updatingId === partner.partner_id ? "Saving..." : partner.status === "active" ? "Deactivate" : "Activate"}</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/40 px-4 py-3">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <label className="flex items-center gap-2">
              Rows per page
              <select value={limit} disabled={loading} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-violet-200 disabled:opacity-50">
                {[10, 25, 50, 100].map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <span aria-live="polite">{loading ? "Loading..." : `${totalRecords === 0 ? 0 : (page - 1) * limit + 1}–${Math.min(page * limit, totalRecords)} of ${totalRecords} partners`}</span>
          </div>
          <nav aria-label="Partner table pagination" className="flex flex-wrap items-center gap-1">
            <button type="button" disabled={loading || page <= 1} onClick={() => setPage(page - 1)} className={buttonClass}>Previous</button>
            {getPageNumbers(page, totalPages).map((number) => (
              typeof number === "string" ? <span key={number} className="px-1.5 text-xs text-slate-400" aria-hidden="true">…</span> :
              <button key={number} type="button" aria-label={`Go to page ${number}`} aria-current={number === page ? "page" : undefined} disabled={loading} onClick={() => setPage(number)} className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-xs font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500 disabled:opacity-50 ${number === page ? "border-violet-600 bg-violet-600 text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:bg-violet-50"}`}>{number}</button>
            ))}
            <button type="button" disabled={loading || page >= totalPages} onClick={() => setPage(page + 1)} className={buttonClass}>Next</button>
          </nav>
        </div>
      </div>
      {selectedPartner && <PersonalDetails partner={selectedPartner} onClose={() => setSelectedPartner(null)} />}
      {servicesPartner && (catalogError ? <div role="dialog" aria-modal="true" aria-label="Services unavailable" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="max-w-sm rounded-xl bg-white p-5"><p role="alert" className="text-sm text-red-600">{catalogError}</p><button className={buttonClass} onClick={() => setServicesPartner(null)}>Close</button><button className={buttonClass} onClick={() => setReload((value) => value + 1)}>Retry</button></div></div> : <PartnerServicesModal partner={servicesPartner} serviceCatalog={catalog} onClose={() => setServicesPartner(null)} />)}
      {kycId && <KycReview kycId={kycId} onClose={() => setKycId(null)} onStatusChange={kycUpdated} />}
    </div>
  );
}

function PersonalDetails({ partner, onClose }) {
  useModalKeyboard(onClose);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><section role="dialog" aria-modal="true" aria-labelledby="partner-details-title" className="partner-modal-panel w-full max-w-md rounded-xl bg-white shadow-xl"><div className="flex items-center justify-between border-b p-4"><h2 id="partner-details-title" className="text-sm font-semibold">Personal Details</h2><button type="button" onClick={onClose} aria-label="Close details"><X size={18} /></button></div><div className="grid grid-cols-2 gap-4 p-4"><KycDetailItem label="Partner Name" value={partner.partner_name} /><KycDetailItem label="Partner Code" value={partner.partner_code} /><KycDetailItem label="Email" value={partner.email} /><KycDetailItem label="Mobile" value={partner.mobile} /><KycDetailItem label="Gender" value={partner.gender ? partner.gender[0].toUpperCase() + partner.gender.slice(1) : "Not provided"} /><div className="col-span-2"><KycDetailItem label="Personal Address" value={partner.personal_address || "Not provided"} /></div></div></section></div>;
}
function KycDetailItem({ label, value }) {
  return <div className="min-w-0"><p className="text-[11px] text-slate-400">{label}</p><div className="mt-1 whitespace-pre-wrap break-words text-xs font-medium text-slate-700">{value || "—"}</div></div>;
}
function KycStatusBadge({ status }) {
  const color = ["active", "verified"].includes(status) ? "bg-emerald-50 text-emerald-700" : ["inactive", "rejected"].includes(status) ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700";
  return <span className={`inline-flex whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-medium capitalize ${color}`}>{status}</span>;
}
function KycRejectModal({ open, rejectionReason, rejectError, actionLoading, onChange, onCancel, onReject }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"><section role="dialog" aria-modal="true" aria-labelledby="reject-title" className="partner-modal-panel w-full max-w-md rounded-xl bg-white p-5 shadow-xl"><h3 id="reject-title" className="text-sm font-semibold">Reject KYC</h3><p className="mt-1 text-xs text-slate-500">Provide a reason (10–255 characters).</p><label htmlFor="rejection-reason" className="mt-4 block text-xs font-medium">Rejection Reason</label><textarea id="rejection-reason" rows={4} maxLength={255} value={rejectionReason} disabled={actionLoading} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(rejectError)} aria-describedby="reject-error" className="mt-2 w-full resize-none rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-violet-400" /><div className="mt-1 flex justify-between gap-3 text-[11px]"><p id="reject-error" role="alert" className="text-red-600">{rejectError}</p><span className="text-slate-400">{rejectionReason.length}/255</span></div><div className="mt-4 flex justify-end gap-2"><button type="button" disabled={actionLoading} onClick={onCancel} className="rounded-lg border px-3 py-2 text-xs">Cancel</button><button type="button" disabled={actionLoading} onClick={onReject} className="rounded-lg bg-red-600 px-3 py-2 text-xs text-white disabled:opacity-50">{actionLoading ? "Rejecting..." : "Reject KYC"}</button></div></section></div>;
}

const BACKEND_URL = "http://localhost:5000";

function KycReview({
  kycId,
  onClose,
  onStatusChange,
}) {
  const [kyc, setKyc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  useModalKeyboard(() => { if (actionLoading) return; if (rejectModalOpen) setRejectModalOpen(false); else onClose(); });

  useEffect(() => {
    if (!kycId) return;
    let cancelled = false;

    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getKycDetails(kycId);
        if (!cancelled) setKyc(response.data);
      } catch (err) {
        if (!cancelled) setError(err.message || "Unable to load KYC details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDetails();
    return () => { cancelled = true; };
  }, [kycId]);

  if (!kycId) return null;

  const getDocumentUrl = (documentPath, documentType) => {
  if (!documentPath || !kyc?.kyc_id) return null;

  return `${BACKEND_URL}/api/admin/kyc/${kyc.kyc_id}/document/${documentType}`;
};

  const handleVerify = async () => {
    const result = await Swal.fire({
      title: "Verify KYC?",
      text: "Are you sure you want to verify this KYC?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Verify",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#16a34a",
    });

    if (!result.isConfirmed) return;

    try {
      setActionLoading(true);
      const response = await verifyKyc(kyc.kyc_id);

      await Swal.fire({
        title: "Verified",
        text: response.message || "KYC verified successfully.",
        icon: "success",
        confirmButtonColor: "#16a34a",
      });

      const updatedKyc = {
        ...kyc,
        kyc_status: "verified",
        verified_at: new Date().toISOString(),
        rejection_reason: null,
      };

      setKyc(updatedKyc);
      if (onStatusChange) onStatusChange(updatedKyc);
    } catch (err) {
      await Swal.fire({
        title: "Verification Failed",
        text: err.message || "Unable to verify KYC.",
        icon: "error",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = rejectionReason.trim();

    if (!reason) {
      setRejectError("Rejection reason is required.");
      return;
    }
    if (reason.length < 10) {
      setRejectError("Reason must be at least 10 characters.");
      return;
    }
    if (reason.length > 255) {
      setRejectError("Reason cannot exceed 255 characters.");
      return;
    }

    const result = await Swal.fire({
      title: "Reject KYC?",
      text: "This KYC will be marked as rejected.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Reject",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) return;

    try {
      setActionLoading(true);
      const response = await rejectKyc(kyc.kyc_id, reason);

      await Swal.fire({
        title: "KYC Rejected",
        text: response.message || "KYC rejected successfully.",
        icon: "success",
        confirmButtonColor: "#16a34a",
      });

      const updatedKyc = {
        ...kyc,
        kyc_status: "rejected",
        rejection_reason: reason,
        verified_at: null,
      };

      setKyc(updatedKyc);
      if (onStatusChange) onStatusChange(updatedKyc);
      setRejectModalOpen(false);
      setRejectionReason("");
      setRejectError("");
    } catch (err) {
      await Swal.fire({
        title: "Rejection Failed",
        text: err.message || "Unable to reject KYC.",
        icon: "error",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = () => {
    setRejectError("");
    setRejectModalOpen(true);
  };

  const closeRejectModal = () => {
    if (actionLoading) return;
    setRejectModalOpen(false);
    setRejectionReason("");
    setRejectError("");
  };

  const handleRejectionReasonChange = (value) => {
    setRejectionReason(value);
    if (rejectError) setRejectError("");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-3 backdrop-blur-sm sm:p-5">
      <div className="mx-auto my-4 max-w-3xl">
        <div className="partner-modal-panel overflow-hidden rounded-xl bg-white shadow-xl">
          
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div>
              <h3 className="text-base font-semibold text-gray-900">KYC Review</h3>
              {kyc && (
                <p className="text-xs text-gray-500 font-mono mt-0.5">ID: {kyc.kyc_id}</p>
              )}
            </div>

            <button
              type="button"
              disabled={actionLoading} onClick={onClose}
              aria-label="Close KYC review"
              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="space-y-4 p-4 sm:p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-5 w-32 rounded bg-gray-200" />
                <div className="h-20 rounded-lg bg-gray-200" />
                <div className="h-32 rounded-lg bg-gray-200" />
              </div>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="p-4 sm:p-6">
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="font-medium text-red-700 text-sm">Failed to load KYC</p>
                <p className="mt-0.5 text-xs text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Content */}
          {!loading && !error && kyc && (
            <div className="space-y-4 p-4 sm:p-5">

              {/* Partner & KYC Grid Info */}
              <div className="grid gap-3 md:grid-cols-2">
                
                {/* Partner Details */}
                <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                  <SectionTitle title="Partner Details" />
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <KycDetailItem label="Partner Name" value={kyc.partner_name} />
                    <KycDetailItem label="Email" value={kyc.email} />
                    <KycDetailItem label="Mobile" value={kyc.mobile} />
                    <KycDetailItem label="Owner Name" value={kyc.owner_name} />
                    <KycDetailItem label="Business Name" value={kyc.business_name} />
                    <KycDetailItem label="KYC Status" value={<KycStatusBadge status={kyc.kyc_status} />} />
                    <div className="sm:col-span-2">
                      <KycDetailItem label="Business Address" value={kyc.business_address} />
                    </div>
                  </div>
                </section>

                {/* KYC Information */}
                <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                  <SectionTitle title="KYC Numbers & Dates" />
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <KycDetailItem label="PAN Number" value={kyc.pan_number} />
                    <KycDetailItem label="Aadhaar Number" value={kyc.aadhaar_number} />
                    <KycDetailItem label="GST Number" value={kyc.gst_number || "-"} />
                    <KycDetailItem label="Submitted On" value={kyc.submitted_at ? new Date(kyc.submitted_at).toLocaleString("en-IN") : "-"} />
                    <KycDetailItem label="Verified On" value={kyc.verified_at ? new Date(kyc.verified_at).toLocaleString("en-IN") : "-"} />
                  </div>
                </section>

              </div>

              {/* Documents */}
              <section>
                <SectionTitle title="Uploaded Documents" />
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <DocumentLink title="PAN" fileName={kyc.pan_document} fileUrl={getDocumentUrl(kyc.pan_document,"pan")} />
                  <DocumentLink title="Aadhaar" fileName={kyc.aadhaar_document} fileUrl={getDocumentUrl(kyc.aadhaar_document,"aadhaar")} />
                  <DocumentLink title="GST" fileName={kyc.gst_document} fileUrl={getDocumentUrl(kyc.gst_document,"gst")} />
                </div>
              </section>

              {/* Rejection Reason (if rejected) */}
              {kyc.kyc_status === "rejected" && kyc.rejection_reason && (
                <section>
                  <SectionTitle title="Rejection Reason" />
                  <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="text-xs sm:text-sm leading-relaxed text-red-700">
                      {kyc.rejection_reason}
                    </p>
                  </div>
                </section>
              )}

              {/* Actions Footer */}
              <div className="flex flex-col-reverse gap-2.5 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={actionLoading} onClick={onClose}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                >
                  Close
                </button>

                {kyc.kyc_status === "pending" && (
                  <>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={openRejectModal}
                      className="rounded-lg bg-red-600 px-4 py-2 text-xs sm:text-sm font-medium text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
                    >
                      Reject KYC
                    </button>

                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleVerify}
                      className="rounded-lg bg-green-600 px-4 py-2 text-xs sm:text-sm font-medium text-white shadow-sm transition hover:bg-green-700 disabled:opacity-50"
                    >
                      {actionLoading ? "Processing..." : "Verify KYC"}
                    </button>
                  </>
                )}
              </div>

            </div>
          )}
        </div>
      </div>

      <KycRejectModal
        open={rejectModalOpen}
        rejectionReason={rejectionReason}
        rejectError={rejectError}
        actionLoading={actionLoading}
        onChange={handleRejectionReasonChange}
        onCancel={closeRejectModal}
        onReject={handleReject}
      />
    </div>
  );
}

function SectionTitle({ title }) {
  return (
    <h5 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-500">
      {title}
    </h5>
  );
}

// Preview load nahi hota. Protected document API new tab mein khulti hai.
function DocumentLink({ title, fileName, fileUrl }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-2 text-slate-700"><FileText size={15} className="text-violet-500" /><p className="text-xs font-semibold">{title}</p></div>
      {fileName && fileUrl ? (
        <a href={fileUrl} target="_blank" rel="noopener noreferrer" aria-label={`View ${title} document in a new tab`} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-2 text-[11px] font-semibold text-violet-700 hover:bg-violet-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500">
          View Document <ExternalLink size={12} />
        </a>
      ) : <p className="mt-3 text-[11px] text-slate-400">Not uploaded</p>}
    </div>
  );
}

function PartnerServicesModal({
  partner,
  serviceCatalog = [],
  onClose,
}) {
  const selectedServices = useMemo(() => {
    if (!partner) return [];

    const selectedIds = new Set(
      (partner.service_ids || []).map(Number)
    );

    return serviceCatalog
      .map((category) => ({
        category_id: category.category_id,
        category_name: category.category_name,
        services: (category.services || []).filter((service) =>
          selectedIds.has(Number(service.service_id))
        ),
      }))
      .filter((category) => category.services.length > 0);
  }, [partner, serviceCatalog]);

  useEffect(() => {
    if (!partner) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    };

    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [partner, onClose]);

  if (!partner) return null;

  const totalServices = selectedServices.reduce(
    (total, category) => total + category.services.length,
    0
  );

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="partner-services-title"
        className="partner-modal-panel w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Wrench size={17} />
            </div>

            <div>
              <h3
                id="partner-services-title"
                className="text-sm font-semibold text-slate-900"
              >
                Partner Services
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Services registered by this partner
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={17} />
          </button>
        </div>

        {/* Partner details */}
        <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-3">
          <p className="text-sm font-semibold text-slate-800">
            {partner.partner_name}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Partner ID #{partner.partner_id}
          </p>
        </div>

        {/* Body */}
        <div className="max-h-[50vh] overflow-y-auto px-5 py-4">
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
              <CheckCircle2 size={13} />
              {totalServices} Services
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              <Layers3 size={13} />
              {selectedServices.length} Categories
            </span>
          </div>

          {selectedServices.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
              <Wrench
                size={24}
                className="mx-auto mb-2 text-slate-300"
              />
              <p className="text-xs text-slate-500">
                No services found in the current catalog.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedServices.map((category) => (
                <div
                  key={category.category_id}
                  className="rounded-xl border border-slate-200 bg-white p-3.5"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h5 className="text-xs font-semibold text-slate-800">
                      {category.category_name}
                    </h5>

                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                      {category.services.length}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {category.services.map((service) => (
                      <span
                        key={service.service_id}
                        className="rounded-md border border-violet-100 bg-violet-50 px-2.5 py-1.5 text-xs font-medium text-violet-700"
                      >
                        {service.service_name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-100 bg-slate-50/50 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
// Escape se modal band karo; alert open ho to Escape alert handle karega.
function useModalKeyboard(onClose) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKey(event) {
      if (event.key === "Escape" && !Swal.isVisible()) closeRef.current();
    }
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, []);
}

// Chhoti list mein saare numbers; badi list mein current page ke paas ke numbers.
function getPageNumbers(page, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  if (page <= 4) return [1, 2, 3, 4, 5, "end-gap", totalPages];
  if (page >= totalPages - 3) {
    return [1, "start-gap", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, "start-gap", page - 1, page, page + 1, "end-gap", totalPages];
}

// Photo na ho ya load fail ho to naam ke initials dikhenge.
function ProfilePhoto({ url, name }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [url]);
  const initials = (name || "User").trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  if (!url || failed) return <span aria-label={`No photo for ${name || "user"}`} className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-violet-100 bg-violet-50 text-[10px] font-semibold text-violet-600 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-300">{initials}</span>;
  return <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`View profile photo of ${name || "user"}`} title="Open photo in new tab" className="mx-auto block h-9 w-9 overflow-hidden rounded-full border border-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500 dark:border-white/10"><img src={url} alt={`${name || "User"} profile`} loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover" /></a>;
}

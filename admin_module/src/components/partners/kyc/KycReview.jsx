import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import {
  getKycDetails,
  verifyKyc,
  rejectKyc,
} from "../../../services/partnerService";

import KycStatusBadge from "./KycStatusBadge";
import KycDetailItem from "./KycDetailItem";
import KycDocumentCard from "./KycDocumentCard";
import KycRejectModal from "./KycRejectModal";

const BACKEND_URL = "http://localhost:5000";

export default function KycReview({
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

  useEffect(() => {
    if (!kycId) return;

    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getKycDetails(kycId);
        setKyc(response.data);
      } catch (err) {
        setError(err.message || "Unable to load KYC details.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
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
      closeRejectModal();
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-2 sm:p-4">
      <div className="mx-auto min-h-full max-w-5xl">
        <div className="overflow-hidden rounded-xl bg-white shadow-xl">
          
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
              onClick={onClose}
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
            <div className="space-y-5 p-4 sm:p-6">

              {/* Partner & KYC Grid Info */}
              <div className="grid gap-6 lg:grid-cols-2">
                
                {/* Partner Details */}
                <section className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
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
                <section className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
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
                <div className="mt-3 grid gap-4 sm:grid-cols-3">
                  <KycDocumentCard title="PAN" fileName={kyc.pan_document} fileUrl={getDocumentUrl(kyc.pan_document,"pan")} />
                  <KycDocumentCard title="Aadhaar" fileName={kyc.aadhaar_document} fileUrl={getDocumentUrl(kyc.aadhaar_document,"aadhaar")} />
                  <KycDocumentCard title="GST" fileName={kyc.gst_document} fileUrl={getDocumentUrl(kyc.gst_document,"gst")} />
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
                  onClick={onClose}
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
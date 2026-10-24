
import {
  FileText,
  ExternalLink,
  Pencil,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building2,
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000";

const getDocumentUrl = (document, documentType) => {
  if (!document) return "";

  const allowedTypes = ["pan", "aadhaar", "gst"];

  if (!allowedTypes.includes(documentType)) return "";

  return `${API_BASE_URL}/api/partner/kyc/document/${documentType}`;
};

const statusClass = (status) => {
  const classes = {
    verified: "bg-emerald-50 text-emerald-700 border-emerald-100",
    rejected: "bg-red-50 text-red-700 border-red-100",
    pending: "bg-amber-50 text-amber-700 border-amber-100",
    submitted: "bg-teal-50 text-teal-700 border-teal-100",
  };

  return (
    classes[status] ||
    "bg-slate-50 text-slate-600 border-slate-200"
  );
};

const DetailRow = ({
  label,
  value,
  badge,
  badgeClass = "bg-[#F1F6F4] text-[#0F766E] border-[#E2EBE8]",
  valueClass = "text-[11px] font-semibold text-[#092B31]",
}) => (
  <tr className="transition-colors hover:bg-[#FAFCFB]">
    <td className="px-4 py-3 text-[11px] font-medium text-slate-500 sm:px-5">
      {label}
    </td>

    <td className={`break-words px-4 py-3 ${valueClass}`}>
      {value || "-"}
    </td>

    <td className="px-4 py-3 sm:px-5">
      <span
        className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${badgeClass}`}
      >
        {badge}
      </span>
    </td>
  </tr>
);

const DocumentRow = ({
  label,
  document,
  documentType,
  onViewDocument,
  optional = false,
}) => {
  const exists = Boolean(document);

  return (
    <tr className="transition-colors hover:bg-[#FAFCFB]">
      <td className="px-4 py-3 text-[11px] font-medium text-slate-500 sm:px-5">
        <span className="inline-flex items-center gap-2">
          <FileText size={14} className="shrink-0 text-teal-700" />
          {label}
        </span>
      </td>

      <td className="px-4 py-3">
        {exists ? (
          <button
            type="button"
            onClick={() => onViewDocument(document, documentType)}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-teal-700 transition-colors hover:text-teal-900"
          >
            View Document
            <ExternalLink size={12} />
          </button>
        ) : (
          <span className="text-[11px] text-slate-400">
            Not uploaded
          </span>
        )}
      </td>

      <td className="px-4 py-3 sm:px-5">
        {exists ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
            <CheckCircle2 size={12} />
            Uploaded
          </span>
        ) : optional ? (
          <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
            Optional
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-[10px] font-semibold text-red-600">
            <AlertCircle size={12} />
            Missing
          </span>
        )}
      </td>
    </tr>
  );
};

const KycDetails = ({
  kyc,
  isVerified,
  onEdit,
  setError,
}) => {
  const handleViewDocument = async (document, documentType) => {
    const newTab = window.open("", "_blank");

    if (!newTab) {
      setError("Please allow pop-ups to view the document.");
      return;
    }

    try {
      const url = getDocumentUrl(document, documentType);

      if (!url) {
        newTab.close();
        setError("Document is not available.");
        return;
      }

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(
          `Unable to open document (${response.status})`
        );
      }

      const blob = await response.blob();

      if (
        !blob.type.startsWith("image/") &&
        blob.type !== "application/pdf"
      ) {
        throw new Error(
          "Server did not return a valid document."
        );
      }

      const blobUrl = window.URL.createObjectURL(blob);

      newTab.location.href = blobUrl;

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 60000);
    } catch (err) {
      console.error("Document open error:", err);

      newTab.close();

      setError(
        err?.message || "Unable to open document."
      );
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-[#E2EBE8] bg-white shadow-[0_3px_16px_rgba(7,27,34,0.035)]">

      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EDF2F0] px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-teal-100 bg-teal-50 text-teal-700">
            <Building2 size={18} />
          </div>

          <div>
            <h3 className="text-[14px] font-bold text-[#092B31]">
              KYC Details
            </h3>

            <p className="mt-0.5 text-[11px] text-slate-500">
              Your submitted KYC information
            </p>
          </div>
        </div>

        {!isVerified ? (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-gradient-to-r from-[#0E3940] to-[#0F766E] px-4 text-[11px] font-bold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            <Pencil size={14} />
            Edit KYC
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700">
            <ShieldCheck size={13} />
            Verified
          </span>
        )}
      </div>

      {/* DETAILS TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] table-auto text-left">
          <thead>
            <tr className="border-b border-[#EDF2F0] bg-[#F8FBFA]">
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500 sm:px-5">
                Field
              </th>

              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                Details
              </th>

              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500 sm:px-5">
                Status
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#EDF2F0]">
            <DetailRow
              label="Owner Name"
              value={kyc.owner_name}
              badge="Personal"
            />

            <DetailRow
              label="Business Name"
              value={kyc.business_name}
              badge="Business"
            />

            <DetailRow
              label="Business Address"
              value={kyc.business_address}
              badge="Address"
              valueClass="max-w-md text-[11px] leading-5 text-slate-700"
            />

            <DetailRow
              label="PAN Number"
              value={kyc.pan_number}
              badge="PAN"
              badgeClass="border-teal-100 bg-teal-50 text-teal-700"
              valueClass="font-mono text-[11px] font-semibold text-[#092B31]"
            />

            <DetailRow
              label="GST Number"
              value={kyc.gst_number}
              badge="GST"
              badgeClass="border-[#F0E4C9] bg-[#FBF6EB] text-[#A7823D]"
              valueClass="font-mono text-[11px] font-semibold text-[#092B31]"
            />

            <DetailRow
              label="Aadhaar Number"
              value={kyc.aadhaar_number}
              badge="Aadhaar"
              badgeClass="border-teal-100 bg-teal-50 text-teal-700"
              valueClass="font-mono text-[11px] font-semibold text-[#092B31]"
            />

            {/* KYC STATUS */}
            <tr className="transition-colors hover:bg-[#FAFCFB]">
              <td className="px-4 py-3 text-[11px] font-medium text-slate-500 sm:px-5">
                KYC Status
              </td>

              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold capitalize ${statusClass(
                    kyc.kyc_status
                  )}`}
                >
                  {kyc.kyc_status || "Pending"}
                </span>
              </td>

              <td className="px-4 py-3 text-[11px] text-slate-500 sm:px-5">
                Verification
              </td>
            </tr>

            {/* DOCUMENTS */}
            <DocumentRow
              label="PAN Document"
              document={kyc.pan_document}
              documentType="pan"
              onViewDocument={handleViewDocument}
            />

            <DocumentRow
              label="Aadhaar Document"
              document={kyc.aadhaar_document}
              documentType="aadhaar"
              onViewDocument={handleViewDocument}
            />

            <DocumentRow
              label="GST Document"
              document={kyc.gst_document}
              documentType="gst"
              onViewDocument={handleViewDocument}
              optional
            />
          </tbody>
        </table>
      </div>

      {/* FOOTER */}
      <div className="flex items-center gap-2 border-t border-[#EDF2F0] bg-[#FCFDFC] px-4 py-3 sm:px-5">
        <ShieldCheck size={14} className="text-teal-700" />

        <p className="text-[10px] text-slate-500">
          Your verification information is managed through the partner portal.
        </p>
      </div>
    </section>
  );
};

export default KycDetails;

const API_BASE_URL = "http://localhost:5000";

const getDocumentUrl = (document, documentType) => {
  if (!document) return "";

  const allowedTypes = ["pan", "aadhaar", "gst"];

  if (!allowedTypes.includes(documentType)) return "";

  return `${API_BASE_URL}/api/partner/kyc/document/${documentType}`;
};

const statusClass = (status) => {
    const classes = {
        verified: "bg-emerald-100 text-emerald-700",
        rejected: "bg-red-100 text-red-700",
        pending: "bg-amber-100 text-amber-700",
        submitted: "bg-blue-100 text-blue-700"
    };

    return (
        classes[status] ||
        "bg-slate-100 text-slate-600"
    );
};

const DetailRow = ({
    label,
    value,
    badge,
    badgeClass = "bg-slate-100 text-slate-600",
    valueClass = "text-sm font-semibold text-slate-900"
}) => (
    <tr>
        <td className="px-6 py-4 text-sm font-medium text-slate-600">
            {label}
        </td>

        <td className={`px-6 py-4 ${valueClass}`}>
            {value || "-"}
        </td>

        <td className="px-6 py-4">
            <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}
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
    optional = false
}) => {
   const exists = Boolean(document);
    console.log("DocumentRow Render:", {
  label,
  exists,
  documentType,
});
return (
        <tr>
            <td className="px-6 py-4 text-sm font-medium text-slate-600">
                {label}
            </td>

            <td className="px-6 py-4">
                {exists ? (
                    <button
                        type="button"
                        onClick={() => onViewDocument(document,documentType)}
                        className="font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                        View Document
                    </button>
                ) : (
                    <span className="text-sm text-slate-400">
                        Not uploaded
                    </span>
                )}
            </td>

            <td className="px-6 py-4">
                {exists ? (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                        Uploaded
                    </span>
                ) : optional ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                        Optional
                    </span>
                ) : (
                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
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
    setError
}) => {
    const handleViewDocument = async (document,documentType) => {
        const newTab = window.open("", "_blank");

        if (!newTab) {
            setError("Please allow pop-ups to view the document.");
            return;
        }

        try {
            const url = getDocumentUrl(document,documentType);

            if (!url) {
                newTab.close();
                setError("Document is not available.");
                return;
            }
            const response = await fetch(url, {
                method: "GET",
                credentials: "include"
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
                err?.message ||
                    "Unable to open document."
            );
        }
    };

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-base font-bold text-slate-900">
                        KYC Details
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Your submitted KYC information.
                    </p>
                </div>

                {!isVerified && (
                    <button
                        type="button"
                        onClick={onEdit}
                        className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                    >
                        Edit KYC
                    </button>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Field
                            </th>

                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Details
                            </th>

                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Status
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">

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
                            valueClass="max-w-md text-sm text-slate-700"
                        />

                        <DetailRow
                            label="PAN Number"
                            value={kyc.pan_number}
                            badge="PAN"
                            badgeClass="bg-blue-50 text-blue-600"
                            valueClass="font-mono text-sm font-semibold text-slate-900"
                        />

                        <DetailRow
                            label="GST Number"
                            value={kyc.gst_number}
                            badge="GST"
                            badgeClass="bg-purple-50 text-purple-600"
                            valueClass="font-mono text-sm font-semibold text-slate-900"
                        />

                        <DetailRow
                            label="Aadhaar Number"
                            value={kyc.aadhaar_number}
                            badge="Aadhaar"
                            badgeClass="bg-orange-50 text-orange-600"
                            valueClass="font-mono text-sm font-semibold text-slate-900"
                        />

                        <tr>
                            <td className="px-6 py-4 text-sm font-medium text-slate-600">
                                KYC Status
                            </td>

                            <td className="px-6 py-4">
                                <span
                                    className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${statusClass(
                                        kyc.kyc_status
                                    )}`}
                                >
                                    {kyc.kyc_status || "Pending"}
                                </span>
                            </td>

                            <td className="px-6 py-4 text-sm text-slate-500">
                                Verification
                            </td>
                        </tr>

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
        </div>
    );
};

export default KycDetails;
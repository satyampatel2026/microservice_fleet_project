
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  ExternalLink,
  X,
  LockKeyhole,
  AlertCircle,
} from "lucide-react";

const DocumentCard = ({
  type,
  document,
  selectedFile,
  error,
  onFileChange,
  onRemove,
  disabled = false,
}) => {
  const titles = {
    pan_document: "PAN Document",
    aadhaar_document: "Aadhaar Document",
    gst_document: "GST Document",
  };

  const title = titles[type] || "Document";
  const inputId = `file-${type}`;

  const existingUrl =
    document && typeof document === "object"
      ? document.url
      : document;

  const existingName =
    document && typeof document === "object"
      ? document.name
      : "Existing document";

  const formatSize = (bytes) => {
    if (!bytes) return "";

    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const handleChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (file) {
      onFileChange(type, file);
    }

    // Allow selecting the same file again.
    event.target.value = "";
  };

  return (
    <div className="rounded-2xl border border-[#E2EBE8] bg-white p-4 shadow-[0_3px_14px_rgba(7,27,34,0.035)] transition-colors hover:border-teal-200">

      {/* DOCUMENT HEADER */}
      <div className="mb-3 flex items-start gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-teal-100 bg-teal-50 text-teal-700">
          <FileText size={17} />
        </div>

        <div className="min-w-0">
          <h3 className="text-[12px] font-bold text-[#092B31]">
            {title}
          </h3>

          <p className="mt-0.5 text-[10px] text-slate-500">
            PDF, JPG, PNG · Maximum 5 MB
          </p>
        </div>
      </div>

      {/* EXISTING DOCUMENT */}
      {document && !selectedFile && (
        <div className="mb-3 rounded-xl border border-emerald-100 bg-[#EDF9F6] p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-teal-700">
                <CheckCircle2 size={16} />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-bold text-teal-800">
                  Uploaded
                </p>

                <p className="truncate text-[10px] text-teal-700">
                  {existingName}
                </p>
              </div>
            </div>

            {existingUrl && (
              <a
                href={existingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-teal-200 bg-white px-2.5 py-1.5 text-[10px] font-bold !text-teal-700 !no-underline transition-colors hover:bg-teal-50 hover:!text-teal-800"
              >
                View
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>
      )}

      {/* NEW SELECTED DOCUMENT */}
      {selectedFile && (
        <div className="mb-3 rounded-xl border border-teal-200 bg-teal-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-teal-700">
                <CheckCircle2 size={16} />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-bold text-[#0E3940]">
                  New document selected
                </p>

                <p
                  className="max-w-[170px] truncate text-[10px] text-teal-700"
                  title={selectedFile.name}
                >
                  {selectedFile.name}
                </p>

                <p className="mt-0.5 text-[10px] text-slate-500">
                  {formatSize(selectedFile.size)}
                </p>
              </div>
            </div>

            {!disabled && (
              <button
                type="button"
                onClick={() => onRemove(type)}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-bold text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <X size={12} />
                Remove
              </button>
            )}
          </div>
        </div>
      )}

      {/* UPLOAD AREA */}
      {!disabled && (
        <label
          htmlFor={inputId}
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#BBD6D0] bg-[#F8FBFA] px-3 py-4 text-center transition-all hover:border-[#14B8A6] hover:bg-teal-50"
        >
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl border border-teal-100 bg-white text-teal-700 shadow-sm">
            <UploadCloud size={18} />
          </div>

          <p className="text-[11px] font-bold text-[#0E3940]">
            {selectedFile
              ? "Change document"
              : "Select document"}
          </p>

          <p className="mt-1 text-[10px] text-slate-400">
            Click to browse files
          </p>

          <input
            id={inputId}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleChange}
            className="sr-only"
          />
        </label>
      )}

      {/* VERIFIED KYC */}
      {disabled && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-[#E2EBE8] bg-[#F8FBFA] px-3 py-3 text-center">
          <LockKeyhole
            size={14}
            className="shrink-0 text-teal-700"
          />

          <p className="text-[10px] font-medium text-slate-500">
            KYC verified. Document cannot be changed.
          </p>
        </div>
      )}

      {/* VALIDATION ERROR */}
      {error && (
        <div
          role="alert"
          className="mt-2 flex items-start gap-1.5 text-[10px] font-semibold text-red-600"
        >
          <AlertCircle
            size={13}
            className="mt-0.5 shrink-0"
          />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default DocumentCard;

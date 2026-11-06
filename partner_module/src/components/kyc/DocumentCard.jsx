import { useEffect, useRef, useState } from "react";
import { FileText, Upload, ExternalLink, X } from "lucide-react";

// Existing component ka naam same rakha hai, lekin design ab compact row hai.
export default function DocumentCard({
  type,
  document,
  selectedFile,
  error,
  onFileChange,
  onRemove,
  disabled = false,
}) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState("");
  const titles = { pan_document: "PAN Document", aadhaar_document: "Aadhaar Document", gst_document: "GST Document" };
  const title = titles[type] || "Document";
  const existingUrl = typeof document === "object" ? document?.url : document;

  useEffect(() => {
    if (!selectedFile || !["image/jpeg", "application/pdf"].includes(selectedFile.type) || selectedFile.size > 200 * 1024) {
      setPreview(""); return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  function selectFile(event) {
    const file = event.target.files?.[0];
    if (file) onFileChange(type, file);
    event.target.value = "";
  }

  const viewUrl = selectedFile ? preview : existingUrl;
  const buttonClass = "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="px-3 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <FileText size={15} className="shrink-0 text-teal-600" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-[#18383C]">{title}{type === "gst_document" && <span className="ml-1.5 text-[9px] font-normal text-slate-400">If applicable</span>}</p>
            <p className="mt-0.5 max-w-[240px] truncate text-[10px] text-slate-400" title={selectedFile?.name}>
              {selectedFile ? `${selectedFile.name} · ${Math.ceil(selectedFile.size / 1024)} KB` : existingUrl ? "Document uploaded" : "No file selected"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <input ref={inputRef} type="file" accept=".jpg,.jpeg,.pdf" onChange={selectFile} disabled={disabled} className="hidden" aria-label={`Upload ${title}`} />
          <button type="button" disabled={disabled} onClick={() => inputRef.current?.click()} className={`${buttonClass} border-teal-100 bg-teal-50 text-teal-700 hover:border-teal-200 hover:bg-teal-100`}><Upload size={12} />{selectedFile || existingUrl ? "Change" : "Upload"}</button>
          {viewUrl ? <a href={viewUrl} target="_blank" rel="noopener noreferrer" aria-label={`View ${selectedFile ? "selected" : "saved"} ${title}`} className={`${buttonClass} border-slate-200 bg-white !text-slate-600 !no-underline hover:bg-slate-50`}>View<ExternalLink size={11} /></a> : <button type="button" disabled className={`${buttonClass} border-slate-200 bg-white text-slate-400`}>View<ExternalLink size={11} /></button>}
          {selectedFile && <button type="button" disabled={disabled} onClick={() => onRemove(type)} aria-label={`Cancel new ${title} selection`} title="Cancel selection" className="flex h-8 w-6 items-center justify-center rounded text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"><X size={13} /></button>}
        </div>
      </div>
      {error && <p role="alert" className="mt-1.5 pl-[23px] text-[10px] text-red-600">{error}</p>}
    </div>
  );
}

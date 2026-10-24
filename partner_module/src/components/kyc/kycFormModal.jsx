
import {
  X,
  ShieldCheck,
  FileCheck2,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";

import DocumentCard from "./DocumentCard";

const InputField = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  maxLength,
  className = "",
  ...props
}) => (
  <div className={className}>
    <label
      htmlFor={name}
      className="block text-[11px] font-semibold text-[#18383C]"
    >
      {label}
      <span className="ml-1 text-red-500">*</span>
    </label>

    <input
      id={name}
      type="text"
      name={name}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      maxLength={maxLength}
      aria-invalid={Boolean(error)}
      className={`mt-1.5 h-10 w-full rounded-xl border bg-[#F8FBFA] px-3 text-[12px] text-[#092B31] outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
        error
          ? "border-red-300 focus:border-red-400 focus:ring-red-500/10"
          : "border-[#E2EBE8] focus:border-teal-400 focus:ring-teal-500/10"
      }`}
      {...props}
    />

    {error && (
      <p className="mt-1 text-[10px] font-medium text-red-600">
        {error}
      </p>
    )}
  </div>
);

const KycFormModal = ({
  kyc,
  formik,
  submitting,
  modalError,
  onClose,
}) => {
  const getError = (name) =>
    formik.touched[name] ? formik.errors[name] : null;

  const handleInputChange = (event) => {
    formik.setFieldValue(
      event.target.name,
      event.target.value
    );
  };

  const handleFileChange = (type, file) => {
    formik.setFieldTouched(type, true);
    formik.setFieldValue(type, file);
  };

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#071B22]/75 p-2 backdrop-blur-[5px] sm:p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="kyc-modal-title"
        className="flex max-h-[95dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
      >
        {/* MODAL HEADER */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#E2EBE8] bg-white px-4 py-3.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0E3940] text-[#D6B77B]">
              <ShieldCheck size={19} />
            </div>

            <div className="min-w-0">
              <h2
                id="kyc-modal-title"
                className="text-[15px] font-extrabold text-[#092B31]"
              >
                {kyc ? "Update KYC" : "Submit KYC"}
              </h2>

              <p className="mt-0.5 text-[10px] text-slate-500 sm:text-[11px]">
                Manage business details and verification documents
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close KYC form"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F1F6F4] text-slate-500 transition-colors hover:bg-teal-50 hover:text-teal-700 disabled:opacity-50"
          >
            <X size={17} />
          </button>
        </div>

        <form
          onSubmit={formik.handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          {/* SUBMISSION ERROR */}
          {modalError && (
            <div
              role="alert"
              className="mx-4 mt-3 flex shrink-0 items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-red-700 sm:mx-5"
            >
              <AlertCircle
                size={17}
                className="mt-0.5 shrink-0"
              />

              <div>
                <p className="text-[11px] font-bold">
                  Unable to save KYC
                </p>

                <p className="mt-0.5 text-[11px]">
                  {modalError}
                </p>
              </div>
            </div>
          )}

          {/* SCROLLABLE CONTENT */}
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            {/* BUSINESS INFORMATION */}
            <div className="mb-3 flex items-center gap-2">
              <div className="h-4 w-1 rounded-full bg-[#0F766E]" />

              <h3 className="text-[12px] font-bold text-[#092B31]">
                Business Information
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
              <InputField
                label="Owner Name"
                name="owner_name"
                value={formik.values.owner_name}
                onChange={handleInputChange}
                onBlur={formik.handleBlur}
                error={getError("owner_name")}
                placeholder="Enter owner name"
              />

              <InputField
                label="Business Name"
                name="business_name"
                value={formik.values.business_name}
                onChange={handleInputChange}
                onBlur={formik.handleBlur}
                error={getError("business_name")}
                placeholder="Enter business name"
              />

              <InputField
                label="PAN Number"
                name="pan_number"
                value={formik.values.pan_number}
                maxLength={10}
                onChange={(event) => {
                  formik.setFieldValue(
                    "pan_number",
                    event.target.value
                      .toUpperCase()
                      .replace(/\s/g, "")
                  );
                }}
                onBlur={formik.handleBlur}
                error={getError("pan_number")}
                placeholder="ABCDE1234F"
              />

              <InputField
                label="GST Number"
                name="gst_number"
                value={formik.values.gst_number}
                maxLength={15}
                onChange={(event) => {
                  formik.setFieldValue(
                    "gst_number",
                    event.target.value
                      .toUpperCase()
                      .replace(/\s/g, "")
                  );
                }}
                onBlur={formik.handleBlur}
                error={getError("gst_number")}
                placeholder="23ABCDE1234F1Z5"
              />

              <InputField
                label="Aadhaar Number"
                name="aadhaar_number"
                value={formik.values.aadhaar_number}
                maxLength={12}
                inputMode="numeric"
                onChange={(event) => {
                  formik.setFieldValue(
                    "aadhaar_number",
                    event.target.value.replace(/\D/g, "")
                  );
                }}
                onBlur={formik.handleBlur}
                error={getError("aadhaar_number")}
                placeholder="Enter 12 digit Aadhaar"
              />

              <div>
                <label
                  htmlFor="business_address"
                  className="block text-[11px] font-semibold text-[#18383C]"
                >
                  Business Address
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <textarea
                  id="business_address"
                  name="business_address"
                  rows={2}
                  value={formik.values.business_address}
                  onChange={handleInputChange}
                  onBlur={formik.handleBlur}
                  placeholder="Enter complete business address"
                  aria-invalid={Boolean(
                    getError("business_address")
                  )}
                  className={`mt-1.5 w-full resize-none rounded-xl border bg-[#F8FBFA] px-3 py-2.5 text-[12px] text-[#092B31] outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                    getError("business_address")
                      ? "border-red-300 focus:border-red-400 focus:ring-red-500/10"
                      : "border-[#E2EBE8] focus:border-teal-400 focus:ring-teal-500/10"
                  }`}
                />

                {getError("business_address") && (
                  <p className="mt-1 text-[10px] font-medium text-red-600">
                    {getError("business_address")}
                  </p>
                )}
              </div>
            </div>

            {/* VERIFICATION DOCUMENTS */}
            <div className="mt-5 border-t border-[#EDF2F0] pt-4">
              <div className="mb-3 flex items-start gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                  <FileCheck2 size={17} />
                </div>

                <div>
                  <h3 className="text-[12px] font-bold text-[#092B31]">
                    Verification Documents
                  </h3>

                  <p className="mt-0.5 text-[10px] leading-4 text-slate-500">
                    Existing documents are shown below. Select a new
                    file only if you want to replace it.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {[
                  "pan_document",
                  "aadhaar_document",
                  "gst_document",
                ].map((type) => (
                  <DocumentCard
                    key={type}
                    type={type}
                    document={kyc?.[type]}
                    selectedFile={formik.values[type]}
                    error={getError(type)}
                    onFileChange={handleFileChange}
                    onRemove={() =>
                      formik.setFieldValue(type, null)
                    }
                    disabled={false}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[#E2EBE8] bg-white px-4 py-3 sm:px-5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="h-9 rounded-xl border border-[#E2EBE8] bg-white px-4 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-[#F8FBFA] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-9 min-w-[130px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0E3940] to-[#0F766E] px-4 text-[11px] font-bold text-white shadow-[0_4px_14px_rgba(15,118,110,0.18)] transition-all hover:shadow-[0_7px_20px_rgba(15,118,110,0.25)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  {kyc ? "Update KYC" : "Submit KYC"}
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KycFormModal;

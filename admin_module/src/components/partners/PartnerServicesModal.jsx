import { useEffect, useMemo } from "react";
import { X, Wrench, Layers3, CheckCircle2 } from "lucide-react";

export default function PartnerServicesModal({
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
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
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
            <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
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
                        className="rounded-md border border-blue-100 bg-blue-50/60 px-2.5 py-1.5 text-xs font-medium text-blue-700"
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
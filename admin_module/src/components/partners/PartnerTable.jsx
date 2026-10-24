import { useState } from "react";
import { Eye } from "lucide-react";
import PartnerServicesModal from "./PartnerServicesModal";
import PartnerStatusBadge from "./PartnerStatusBadge";
import PartnerTableSkeleton from "./PartnerTableSkeleton";
import EmptyState from "../common/EmptyState";
import ErrorState from "../common/ErrorState";
import Pagination from "../common/Pagination";

export default function PartnerTable({
  partners,
  serviceCatalog = [],
  loading,
  error,
  page,
  totalPages,
  onPageChange,
  onStatusChange,
  onRetry,
}) {
  const [selectedPartner, setSelectedPartner] = useState(null);
  if (loading) {
    return <PartnerTableSkeleton />;
  }

  if (error) {
    return (
      <ErrorState
        title="Unable to load partners"
        message={error}
        onRetry={onRetry}
      />
    );
  }

  if (!partners.length) {
    return (
      <EmptyState
        title="No partners found"
        message="Try changing your search or filter."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Desktop Table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left">
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Partner
              </th>

              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Email
              </th>

              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Mobile
              </th>

              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Joined
              </th>

              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>

              {/* Action column ko left align kar diya hai taaki wo zyada side me na jaye */}
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                View & Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {partners.map((partner) => {
              const isActive = partner.status === "active";

              return (
                <tr
                  key={partner.partner_id}
                  className="transition hover:bg-slate-50/50"
                >
                  <td className="px-6 py-3.5">
                    <div>
                      <p className="font-medium text-slate-900">
                        {partner.partner_name}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500">
                        ID: {partner.partner_id}
                      </p>
                    </div>
                  </td>

                  <td className="px-6 py-3.5 text-sm text-slate-600">
                    {partner.email}
                  </td>

                  <td className="px-6 py-3.5 text-sm text-slate-600">
                    {partner.mobile}
                  </td>

                  <td className="px-6 py-3.5 text-sm text-slate-600">
                    {new Date(
                      partner.created_at
                    ).toLocaleDateString("en-IN")}
                  </td>

                  <td className="px-6 py-3.5">
                    <PartnerStatusBadge
                      status={partner.status}
                    />
                  </td>

                  <td className="px-6 py-3.5">
                    <button
  type="button"
  onClick={() => setSelectedPartner(partner)}
  title="View Partner Services"
  aria-label={`View services of ${partner.partner_name}`}
  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600 transition hover:border-blue-200 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300"
>
  <Eye size={17} strokeWidth={1.8} />
</button>
                    <button
                      onClick={() =>
                        onStatusChange(partner)
                      }
                      className={`rounded-lg px-3 py-2 text-sm font-medium shadow-sm transition focus:outline-none ${
                        isActive
                          ? "border border-red-200 bg-white text-red-600 hover:border-red-300 hover:bg-red-50 focus:ring-2 focus:ring-red-100"
                          : "border border-green-200 bg-white text-green-600 hover:border-green-300 hover:bg-green-50 focus:ring-2 focus:ring-green-100"
                      }`}
                    >
                      {isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="divide-y divide-slate-100 md:hidden">
        {partners.map((partner) => {
          const isActive = partner.status === "active";

          return (
            <div
              key={partner.partner_id}
              className="p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">
                    {partner.partner_name}
                  </p>

                  <p className="mt-0.5 text-sm text-slate-500">
                    {partner.email}
                  </p>

                  <p className="mt-0.5 text-sm text-slate-500">
                    {partner.mobile}
                  </p>
                </div>

                <PartnerStatusBadge
                  status={partner.status}
                />
              </div>

              <div className="mt-3 flex items-center justify-between pt-1">
                <p className="text-xs text-slate-500">
                  Joined{" "}
                  {new Date(
                    partner.created_at
                  ).toLocaleDateString("en-IN")}
                </p>
                  <button
  type="button"
  onClick={() => setSelectedPartner(partner)}
  title="View Partner Services"
  aria-label={`View services of ${partner.partner_name}`}
  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600 transition hover:border-blue-200 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300"
>
  <Eye size={17} strokeWidth={1.8} />
</button>
                <button
                  onClick={() =>
                    onStatusChange(partner)
                  }
                  className={`rounded-lg px-3 py-2 text-sm font-medium shadow-sm transition focus:outline-none ${
                    isActive
                      ? "border border-red-200 bg-white text-red-600 hover:border-red-300 hover:bg-red-50 focus:ring-2 focus:ring-red-100"
                      : "border border-green-200 bg-white text-green-600 hover:border-green-300 hover:bg-green-50 focus:ring-2 focus:ring-green-100"
                  }`}
                >
                  {isActive ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-slate-100 px-4 py-3">
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>
      <PartnerServicesModal
  partner={selectedPartner}
  serviceCatalog={serviceCatalog}
  onClose={() => setSelectedPartner(null)}
/>
    </div>
  );
}
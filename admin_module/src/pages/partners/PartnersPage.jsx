import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import PartnerTable from "../../components/partners/PartnerTable";
import {
  getPartners,
  updatePartnerStatus,getPartnerServiceCatalog
} from "../../services/partnerService";

export default function PartnersPage() {
    // Backend se sirf current page ke partners milenge
  const [partners, setPartners] = useState([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [serviceCatalog, setServiceCatalog] = useState([]);

  // Retry ya status update ke baad list reload karne ke liye
  const [reload, setReload] = useState(0);

  const LIMIT = 10;

  // Catalog sirf page open hone par load karo
  useEffect(() => {
    let cancelled = false;

    getPartnerServiceCatalog()
      .then((result) => {
        if (!cancelled) {
          setServiceCatalog(result.data || []);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          Swal.fire({
            icon: "error",
            title: "Service catalog unavailable",
            text: error.message,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Search, status, page ya reload badalne par list fetch karo
  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError("");

    // 400ms tak koi naya change nahi hua, tab request bhejo
    const timer = setTimeout(async () => {
      try {
        const result = await getPartners(
          search,
          status,
          page,
          LIMIT
        );

        // Purani request ka result ignore karo
        if (cancelled) return;

        setPartners(result.data);
        setTotalPages(result.pagination.totalPages);
        setPage(result.pagination.page);
      } catch (error) {
        if (!cancelled) {
          setError(error.message || "Unable to load partners");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 400);

    // Naya change aaye to purana timer cancel karo
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, status, page, reload]);

  const fetchPartners = () => {
    setReload((value) => value + 1);
  };

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusFilter = (value) => {
    setStatus(value);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };
  // Activate / deactivate
  const handleStatusChange = async (partner) => {
    const isCurrentlyActive =
      partner.status === "active";

    const newStatus = isCurrentlyActive
      ? "inactive"
      : "active";

    const result = await Swal.fire({
      title: isCurrentlyActive
        ? "Deactivate Partner?"
        : "Activate Partner?",

      text: isCurrentlyActive
        ? `${partner.partner_name} will become inactive.`
        : `${partner.partner_name} will become active again.`,

      icon: "warning",

      showCancelButton: true,

      confirmButtonText: isCurrentlyActive
        ? "Yes, Deactivate"
        : "Yes, Activate",

      cancelButtonText: "Cancel",

      confirmButtonColor: isCurrentlyActive
        ? "#dc2626"
        : "#16a34a",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      Swal.fire({
        title: "Updating...",
        text: "Please wait.",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      await updatePartnerStatus(
        partner.partner_id,
        newStatus
      );

      fetchPartners();

      await Swal.fire({
        icon: "success",
        title: "Success",
        text:
          newStatus === "active"
            ? "Partner activated successfully."
            : "Partner deactivated successfully.",

        timer: 1800,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text:
          error.message ||
          "Unable to update partner status.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-6">
          <h3 className="text-2xl font-bold tracking-tight text-gray-900">
            Partners
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Manage registered partners and their account
            status.
          </p>
        </div>

        {/* Main Card */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* Toolbar */}
          <div className="border-b border-gray-100 p-4 sm:p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

              {/* Search */}
              <div className="relative w-full md:max-w-sm">
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="m21 21-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    handleSearch(e.target.value)
                  }
                  placeholder="Search partner..."
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                />
              </div>

              {/* Status Filter */}
              <select
                value={status}
                onChange={(e) =>
                  handleStatusFilter(e.target.value)
                }
               className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 shadow-sm outline-none transition hover:border-gray-300 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 md:w-auto"
              >
                <option value="">
                  All Status
                </option>

                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>
              </select>
            </div>
          </div>

          {/* Table */}
          <PartnerTable
            partners={partners}
            loading={loading}
            error={error}
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onStatusChange={handleStatusChange}
            onRetry={fetchPartners}
            serviceCatalog={serviceCatalog}
          />
        </div>
      </div>
    </div>
  );
}

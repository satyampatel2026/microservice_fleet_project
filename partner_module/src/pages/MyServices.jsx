import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  Wrench,
  Search,
  Save,
  CheckCircle2,
  Loader2,
  RefreshCw,
  X,
  ChevronDown,
  AlertCircle,
  Layers3,
  SlidersHorizontal,
} from "lucide-react";

import Layout from "../layouts/Layout";
import {
  getPartnerServiceCatalog,
  getMyServices,
  updateMyServices,
} from "../services/partnerService";

const filters = [
  { id: "all", label: "All" },
  { id: "selected", label: "Selected" },
  { id: "unselected", label: "Not Selected" },
];

export default function MyServices() {
  const [catalog, setCatalog] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [expandedCategory, setExpandedCategory] = useState(null);

  const loadServices = async () => {
    try {
      setLoading(true);
      setError("");

      const [catalogResponse, myServicesResponse] =
        await Promise.all([
          getPartnerServiceCatalog(),
          getMyServices(),
        ]);

      const categories = catalogResponse.data || [];
      const assignedIds =
        myServicesResponse.data?.service_ids || [];

      setCatalog(categories);
      setSelectedIds(assignedIds.map(Number));
      setSavedIds(assignedIds.map(Number));
    } catch (err) {
      setError(err.message || "Unable to load services.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const availableIds = useMemo(
    () =>
      new Set(
        catalog.flatMap((category) =>
          (category.services || []).map((service) =>
            Number(service.service_id)
          )
        )
      ),
    [catalog]
  );

  const hasChanges = useMemo(() => {
    const current = [...selectedIds].sort((a, b) => a - b);
    const saved = [...savedIds].sort((a, b) => a - b);

    return JSON.stringify(current) !== JSON.stringify(saved);
  }, [selectedIds, savedIds]);

  const filteredCatalog = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return catalog
      .map((category) => {
        const categoryMatches = category.category_name
          .toLowerCase()
          .includes(keyword);

        const services = (category.services || []).filter(
          (service) => {
            const id = Number(service.service_id);

            const matchesSearch =
              !keyword ||
              categoryMatches ||
              service.service_name
                .toLowerCase()
                .includes(keyword);

            const matchesFilter =
              filter === "all" ||
              (filter === "selected" &&
                selectedIds.includes(id)) ||
              (filter === "unselected" &&
                !selectedIds.includes(id));

            return matchesSearch && matchesFilter;
          }
        );

        return { ...category, services };
      })
      .filter((category) => category.services.length > 0);
  }, [catalog, search, filter, selectedIds]);

  const toggleService = (serviceId) => {
    const id = Number(serviceId);

    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const handleSave = async () => {
    if (!hasChanges || saving) return;

    const unavailableIds = savedIds.filter(
      (id) => !availableIds.has(id)
    );

    if (unavailableIds.length > 0) {
      await Swal.fire({
        icon: "warning",
        title: "Services Unavailable",
        text: "Some of your assigned services are no longer active. Please contact the administrator before updating your services.",
        confirmButtonColor: "#0F766E",
      });

      return;
    }

    const result = await Swal.fire({
      title: "Update Services?",
      text: "Your selected services will be updated.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Save Changes",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#0F766E",
    });

    if (!result.isConfirmed) return;

    try {
      setSaving(true);

      const idsToSave = selectedIds.filter((id) =>
        availableIds.has(id)
      );

      const response = await updateMyServices(idsToSave);

      const updatedIds = (
        response.data?.service_ids || idsToSave
      ).map(Number);

      setSelectedIds(updatedIds);
      setSavedIds(updatedIds);

      await Swal.fire({
        icon: "success",
        title: "Services Updated",
        text: "Your services have been saved successfully.",
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: err.message || "Unable to update services.",
      });
    } finally {
      setSaving(false);
    }
  };

  // LOADING
  if (loading) {
    return (
      <Layout activePath="/partner/services">
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-100 bg-teal-50">
            <Loader2
              size={25}
              className="animate-spin text-teal-700"
            />
          </div>

          <p className="text-[12px] font-semibold text-[#0E3940]">
            Loading your services...
          </p>
          <p className="text-[11px] text-slate-400">
            Fetching your workshop catalog
          </p>
        </div>
      </Layout>
    );
  }

  // ERROR
  if (error) {
    return (
      <Layout activePath="/partner/services">
        <div className="mx-auto flex min-h-[55vh] max-w-lg items-center justify-center">
          <div className="w-full rounded-2xl border border-red-100 bg-white p-7 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-500">
              <AlertCircle size={23} />
            </div>

            <h2 className="mt-4 text-[15px] font-bold text-[#092B31]">
              Unable to load services
            </h2>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              {error}
            </p>

            <button
              type="button"
              onClick={loadServices}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0F766E] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#0E5957]"
            >
              <RefreshCw size={14} />
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout activePath="/partner/services">
      <div className="mx-auto w-full max-w-[1600px] space-y-4">

        {/* PAGE HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-100 bg-teal-50 text-teal-700">
              <Wrench size={19} />
            </div>

            <div>
              <h3 className="text-[18px] font-extrabold tracking-tight text-[#092B31] sm:text-[20px]">
                My Services
              </h3>

              <p className="mt-0.5 text-[11px] text-slate-500">
                Manage the services you offer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-semibold sm:inline-flex ${
                hasChanges
                  ? "border-amber-100 bg-amber-50 text-amber-700"
                  : "border-teal-100 bg-teal-50 text-teal-700"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  hasChanges ? "bg-amber-500" : "bg-teal-500"
                }`}
              />

              {hasChanges ? "Unsaved changes" : "Up to date"}
            </span>

            <button
              type="button"
              onClick={loadServices}
              disabled={saving || hasChanges}
              title={
                hasChanges
                  ? "Save changes before refreshing"
                  : "Refresh services"
              }
              aria-label="Refresh services"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E2EBE8] bg-white text-slate-500 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* SUMMARY */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-[#E2EBE8] bg-white px-4 py-3 shadow-[0_3px_14px_rgba(7,27,34,0.03)]">
          <div className="flex items-center gap-2">
            <Layers3 size={15} className="text-teal-700" />
            <span className="text-[11px] text-slate-500">
              Total Services
            </span>
            <span className="text-[13px] font-bold text-[#092B31]">
              {availableIds.size}
            </span>
          </div>

          <div className="hidden h-5 w-px bg-[#E2EBE8] sm:block" />

          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-teal-600" />
            <span className="text-[11px] text-slate-500">
              Selected
            </span>
            <span className="text-[13px] font-bold text-teal-700">
              {selectedIds.length}
            </span>
          </div>

          <div className="hidden h-5 w-px bg-[#E2EBE8] sm:block" />

          <div className="flex items-center gap-1.5">
            <CheckCircle2
              size={14}
              className={
                hasChanges
                  ? "text-amber-500"
                  : "text-emerald-600"
              }
            />
            <span className="text-[11px] text-slate-500">
              {hasChanges
                ? "Changes pending"
                : "All changes saved"}
            </span>
          </div>
        </div>

        {/* SEARCH + FILTERS */}
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#E2EBE8] bg-white p-3 shadow-[0_3px_14px_rgba(7,27,34,0.03)]">
          <div className="relative min-w-[200px] flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search services or categories..."
              aria-label="Search services or categories"
              className="h-9 w-full rounded-xl border border-[#E2EBE8] bg-[#F8FBFA] pl-10 pr-9 text-[11px] text-[#092B31] outline-none transition-all placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-700"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 rounded-xl bg-[#F1F6F4] p-1">
            <SlidersHorizontal
              size={14}
              className="ml-2 hidden text-slate-400 sm:block"
            />

            {filters.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                aria-pressed={filter === item.id}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${
                  filter === item.id
                    ? "bg-white text-teal-700 shadow-sm"
                    : "text-slate-500 hover:text-[#092B31]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* SERVICE CATEGORIES */}
        <section className="overflow-hidden rounded-2xl border border-[#E2EBE8] bg-white shadow-[0_3px_16px_rgba(7,27,34,0.035)]">
          <div className="flex items-center justify-between gap-3 border-b border-[#EDF2F0] bg-[#F9FBFA] px-4 py-3">
            <div className="flex items-center gap-2">
              <Layers3 size={15} className="text-teal-700" />

              <h3 className="text-[12px] font-bold text-[#092B31]">
                Service Categories
              </h3>
            </div>

            <span className="rounded-full border border-[#E2EBE8] bg-white px-2.5 py-1 text-[10px] font-medium text-slate-500">
              {filteredCatalog.length} categories
            </span>
          </div>

          {filteredCatalog.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <Search
                size={24}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 text-[12px] font-semibold text-slate-600">
                No matching services found
              </p>

              <p className="mt-1 text-[11px] text-slate-400">
                Try changing your search or filters.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
                className="mt-4 text-[11px] font-bold text-teal-700 hover:text-teal-900"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#EDF2F0]">
              {filteredCatalog.map((category) => {
                const categoryId = Number(category.category_id);

                const isOpen =
                  expandedCategory === categoryId ||
                  search.trim() !== "" ||
                  filter !== "all";

                const selectedCount = category.services.filter(
                  (service) =>
                    selectedIds.includes(
                      Number(service.service_id)
                    )
                ).length;

                return (
                  <div key={categoryId}>
                    {/* CATEGORY HEADER */}
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedCategory((current) =>
                          current === categoryId
                            ? null
                            : categoryId
                        )
                      }
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-[#F8FBFA]"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <ChevronDown
                          size={16}
                          className={`shrink-0 text-teal-700 transition-transform duration-200 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />

                        <span className="truncate text-[12px] font-bold text-[#18383C]">
                          {category.category_name}
                        </span>

                        <span className="hidden rounded-lg bg-[#F1F6F4] px-2 py-1 text-[10px] text-slate-500 sm:inline">
                          {category.services.length} services
                        </span>
                      </div>

                      <span className="shrink-0 rounded-full border border-teal-100 bg-teal-50 px-2.5 py-1 text-[10px] font-semibold text-teal-700">
                        {selectedCount} selected
                      </span>
                    </button>

                    {/* CATEGORY SERVICES */}
                    {isOpen && (
                      <div className="border-t border-[#EDF2F0] bg-[#FAFCFB] px-4 py-3">
                        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                          {category.services.map((service) => {
                            const id = Number(service.service_id);
                            const checked = selectedIds.includes(id);

                            return (
                              <label
                                key={id}
                                className={`flex min-h-10 cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-all ${
                                  checked
                                    ? "border-teal-200 bg-[#EDF9F6]"
                                    : "border-[#E2EBE8] bg-white hover:border-teal-200 hover:bg-teal-50/30"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleService(id)}
                                  disabled={saving}
                                  className="h-3.5 w-3.5 shrink-0 accent-[#0F766E]"
                                />

                                <span className="min-w-0 flex-1 text-[11px] font-medium text-[#18383C]">
                                  {service.service_name}
                                </span>

                                {checked && (
                                  <CheckCircle2
                                    size={14}
                                    className="shrink-0 text-teal-600"
                                  />
                                )}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* SAVE BAR */}
        {hasChanges && (
          <div className="sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal-200 bg-white/95 px-4 py-3 shadow-[0_12px_35px_rgba(7,27,34,0.13)] backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <AlertCircle
                size={17}
                className="shrink-0 text-[#B08C4C]"
              />

              <p className="text-[11px] font-medium text-[#18383C]">
                You have unsaved changes to your services.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0E3940] to-[#0F766E] px-4 text-[11px] font-bold text-white shadow-[0_5px_15px_rgba(15,118,110,0.18)] transition-all hover:shadow-[0_8px_20px_rgba(15,118,110,0.25)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}

              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}

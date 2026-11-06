import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  Wrench,
  Search,
  Save,
  Loader2,
  RefreshCw,
  X,
  AlertCircle,
  Layers3,
} from "lucide-react";

import Layout from "../layouts/Layout";
import {
  getPartnerServiceCatalog,
  getMyServices,
  updateMyServices,
} from "../services/partnerService";

export default function MyServices() {
  const [catalog, setCatalog] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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

  // Ek service = ek row. Search sirf frontend par hoti hai.
  const serviceRows = catalog.flatMap((category) =>
    (category.services || []).map((service) => ({
      ...service,
      category_name: category.category_name || "Uncategorized",
    }))
  );
  const keyword = search.trim().toLowerCase();
  const filteredServices = serviceRows.filter((service) => {
    const serviceName = String(service.service_name || "").toLowerCase();
    const categoryName = String(service.category_name || "").toLowerCase();
    return serviceName.includes(keyword) || categoryName.includes(keyword);
  });

  const toggleService = (serviceId) => {
    const id = Number(serviceId);

    if (!selectedIds.includes(id) && selectedIds.length >= 100) {
      Swal.fire({ icon: "warning", title: "Selection limit", text: "You can select up to 100 services." });
      return;
    }
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

  const selectedServiceCount = selectedIds.filter((id) => availableIds.has(id)).length;
  const selectedCategoryCount = catalog.filter((category) =>
    (category.services || []).some((service) => selectedIds.includes(Number(service.service_id)))
  ).length;

  return (
    <Layout activePath="/partner/services">
      <div className="w-full space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="mr-2"><h3 className="text-lg font-semibold text-[#092B31]">My Services</h3><p className="mt-1 text-xs text-slate-500">Choose the services your business offers.</p></div>
          <div className="flex flex-wrap gap-2">
            <div className="rounded-lg border border-teal-100 bg-white px-2.5 py-1.5 shadow-sm"><p className="flex items-center gap-1.5 text-[10px] text-slate-500"><Wrench size={11} />Services</p><p className="mt-0.5 text-sm font-semibold tabular-nums text-teal-700">{selectedServiceCount}<span className="text-xs font-normal text-slate-400"> / {availableIds.size}</span></p></div>
            <div className="rounded-lg border border-teal-100 bg-white px-2.5 py-1.5 shadow-sm"><p className="flex items-center gap-1.5 text-[10px] text-slate-500"><Layers3 size={11} />Categories</p><p className="mt-0.5 text-sm font-semibold tabular-nums text-teal-700">{selectedCategoryCount}<span className="text-xs font-normal text-slate-400"> / {catalog.length}</span></p></div>
          </div>
          <button type="button" onClick={loadServices} disabled={saving || hasChanges} title={hasChanges ? "Save changes before refreshing" : "Refresh services"} className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 disabled:opacity-40"><RefreshCw size={14} />Refresh</button>
        </div>

        <section className="overflow-hidden rounded-xl border border-[#E2EBE8] bg-white shadow-sm" aria-label="Service selection">
          <div className="border-b border-slate-100 p-3">
            <div className="relative max-w-sm"><Search size={15} className="pointer-events-none absolute left-3 top-3 text-slate-400" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search categories or services..." aria-label="Search categories or services" className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-8 text-xs outline-none focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100" />{search && <button type="button" aria-label="Clear search" onClick={() => setSearch("")} className="absolute right-2 top-2.5 text-slate-400"><X size={14} /></button>}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[440px] text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] text-slate-500"><tr>
                <th scope="col" className="w-12 px-4 py-2.5 text-center"><span className="sr-only">Select service</span><span aria-hidden="true">✓</span></th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Service</th>
                <th scope="col" className="w-[38%] px-4 py-2.5 font-semibold">Category</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filteredServices.length === 0 ? <tr><td colSpan={3} className="p-8 text-center text-slate-400">No matching services found.</td></tr> : filteredServices.map((service) => {
                  const id = Number(service.service_id);
                  const checked = selectedIds.includes(id);
                  return <tr key={id} className={checked ? "bg-teal-50/50" : "hover:bg-slate-50"}>
                    <td className="px-4 py-2.5 text-center"><input id={`service-${id}`} type="checkbox" checked={checked} disabled={saving} onChange={() => toggleService(id)} aria-label={`Select ${service.service_name} in ${service.category_name}`} className="h-3.5 w-3.5 cursor-pointer rounded accent-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:cursor-not-allowed" /></td>
                    <td className="px-3 py-2.5"><label htmlFor={`service-${id}`} className="cursor-pointer font-medium text-slate-700">{service.service_name}</label></td>
                    <td className="px-4 py-2.5 text-slate-500">{service.category_name}</td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        </section>

        {hasChanges && <div className="sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-teal-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur"><p className="flex items-center gap-2 text-xs text-slate-600"><AlertCircle size={15} className="text-amber-600" />You have unsaved changes.</p><button type="button" onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-50">{saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}{saving ? "Saving..." : "Save Changes"}</button></div>}
      </div>
    </Layout>
  );
}

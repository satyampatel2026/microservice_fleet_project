
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  getCategories,
  getServices,
  createService,
  updateService,
} from "../../services/partnerService";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
});

export default function Services() {
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    category_id: "",
    service_name: "",
    description: "",
    status: "active",
  });

  const loadData = async () => {
    try {
      setLoading(true);

      const categoryResponse = await getCategories();
      const serviceResponse = await getServices();

      setCategories(categoryResponse.data || []);
      setServices(serviceResponse.data || []);
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddForm = () => {
    setEditingId(null);
    setForm({
      category_id: "",
      service_name: "",
      description: "",
      status: "active",
    });
    setShowForm(true);
  };

  const openEditForm = (service) => {
    setEditingId(service.service_id);
    setForm({
      category_id: String(service.category_id),
      service_name: service.service_name,
      description: service.description || "",
      status: service.status,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.category_id || !form.service_name.trim()) {
      Swal.fire(
        "Error",
        "Category and service name are required",
        "error"
      );
      return;
    }

    const payload = {
      category_id: Number(form.category_id),
      service_name: form.service_name.trim(),
      description: form.description,
      status: form.status,
    };

    try {
      setSaving(true);

      if (editingId !== null) {
        await updateService(editingId, payload);
      } else {
        await createService(payload);
      }

      setShowForm(false);
      await loadData();

      Swal.fire({
        icon: "success",
        title: editingId !== null
          ? "Service Updated"
          : "Service Created",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    } finally {
      setSaving(false);
    }
  };

 const toggleStatus = async (service) => {
  const isActive = service.status === "active";
  const newStatus = isActive ? "inactive" : "active";

  const result = await Swal.fire({
    title: isActive ? "Deactivate Service?" : "Activate Service?",
    text: isActive
      ? `"${service.service_name}" will no longer be available for new partner selections.`
      : `"${service.service_name}" will become available for partner selections.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: isActive ? "Yes, Deactivate" : "Yes, Activate",
    cancelButtonText: "Cancel",
    confirmButtonColor: isActive ? "#dc2626" : "#16a34a",
    cancelButtonColor: "#64748b",
    reverseButtons: true,
  });

  if (!result.isConfirmed) return;

  try {
    await updateService(service.service_id, {
      category_id: service.category_id,
      service_name: service.service_name,
      description: service.description || "",
      status: newStatus,
    });

    await loadData();

    Toast.fire({
      icon: "success",
      title: isActive
        ? "Service deactivated successfully"
        : "Service activated successfully",
    });
  } catch (error) {
    Toast.fire({
      icon: "error",
      title: error.message || "Failed to update service status",
    });
  }
};

  const getCategoryName = (categoryId) => {
    for (const category of categories) {
      if (category.category_id === Number(categoryId)) {
        return category.category_name;
      }
    }

    return "Unknown";
  };
  
return (
  <div className="w-full space-y-5 sm:space-y-6">
    {/* Page Header */}
    <section className="relative overflow-hidden rounded-2xl border border-violet-400/15 bg-gradient-to-r from-[#151a2b] via-[#211b40] to-[#151a2b] px-5 py-4 shadow-[0_8px_28px_rgba(39,29,90,0.22)] transition-shadow duration-300 hover:shadow-[0_12px_34px_rgba(39,29,90,0.30)] sm:px-6">
      <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-300">
            Service Management
          </p>

          <h3 className="mt-1 text-lg font-bold tracking-tight text-white sm:text-xl">
            Category Services
          </h3>

          <p className="mt-1 text-xs text-slate-300">
            Manage services offered by partners
          </p>
        </div>

        <button
          type="button"
          onClick={openAddForm}
          className="self-start rounded-xl border border-violet-400/25 bg-violet-500/20 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-violet-500/35 active:scale-[0.98] sm:self-auto"
        >
          + Add Service
        </button>
      </div>
    </section>

    {/* Services Table */}
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_6px_24px_rgba(15,23,42,0.10)] transition-shadow duration-300 hover:shadow-[0_12px_32px_rgba(15,23,42,0.15)] dark:border-white/[0.08] dark:bg-[#191e2d] dark:shadow-[0_8px_28px_rgba(0,0,0,0.30)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[750px] text-left text-sm">
          <thead className="border-b border-slate-200/80 bg-slate-50/80 dark:border-white/[0.08] dark:bg-white/[0.04]">
            <tr>
              {[
                "Sr. No.",
                "Service",
                "Category",
                "Status",
                "Action",
              ].map((heading) => (
                <th
                  key={heading}
                  className="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-12 text-center text-sm text-slate-500 dark:text-slate-400"
                >
                  Loading services...
                </td>
              </tr>
            ) : services.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-12 text-center text-sm text-slate-500 dark:text-slate-400"
                >
                  No services found
                </td>
              </tr>
            ) : (
              services.map((service, index) => (
                <tr
                  key={service.service_id}
                  className="transition-colors hover:bg-violet-50/50 dark:hover:bg-violet-400/[0.05]"
                >
                  <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                    {index + 1}
                  </td>

                  <td className="px-5 py-3.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {service.service_name}
                  </td>

                  <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-300">
                    {getCategoryName(service.category_id)}
                  </td>

                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                        service.status === "active"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-400"
                          : "border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-400"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          service.status === "active"
                            ? "bg-emerald-500"
                            : "bg-red-500"
                        }`}
                      />
                      {service.status}
                    </span>
                  </td>

                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditForm(service)}
                        className="rounded-lg border border-violet-200/70 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-100 dark:border-violet-400/15 dark:bg-violet-400/10 dark:text-violet-300 dark:hover:bg-violet-400/20"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleStatus(service)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          service.status === "active"
                            ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-400/15 dark:bg-amber-400/10 dark:text-amber-400 dark:hover:bg-amber-400/20"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-400/15 dark:bg-emerald-400/10 dark:text-emerald-400 dark:hover:bg-emerald-400/20"
                        }`}
                      >
                        {service.status === "active"
                          ? "Deactivate"
                          : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>

    {/* Add / Edit Service Modal */}
    {showForm && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="service-modal-title"
          className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.30)] dark:border-white/10 dark:bg-[#191e2d] dark:shadow-[0_24px_70px_rgba(0,0,0,0.55)]"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-5 py-4 dark:border-white/[0.08] dark:bg-white/[0.03]">
            <div>
              <h2
                id="service-modal-title"
                className="text-sm font-bold text-slate-900 dark:text-white"
              >
                {editingId !== null ? "Edit Service" : "Add Service"}
              </h2>

              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                Manage partner service details
              </p>
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={() => setShowForm(false)}
              aria-label="Close service modal"
              className="rounded-lg px-2.5 py-1.5 text-lg text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-white/10 dark:hover:text-white"
            >
              ×
            </button>
          </div>

          {/* Modal Form */}
          <form
            onSubmit={handleSubmit}
            className="max-h-[75vh] space-y-4 overflow-y-auto p-5"
          >
            {/* Category */}
            <div>
              <label
                htmlFor="service-category"
                className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Category
              </label>

              <select
                id="service-category"
                required
                value={form.category_id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category_id: e.target.value,
                  })
                }
                className="w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-800 outline-none transition-all focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-[#242a3b] dark:text-white dark:focus:border-violet-400"
              >
                <option value="">Select Category</option>

                {categories.map((category) => (
                  <option
                    key={category.category_id}
                    value={category.category_id}
                  >
                    {category.category_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Service Name */}
            <div>
              <label
                htmlFor="service-name"
                className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Service Name
              </label>

              <input
                id="service-name"
                required
                value={form.service_name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    service_name: e.target.value,
                  })
                }
                placeholder="e.g. Engine Repair"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-800 outline-none transition-all focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-violet-400 dark:focus:bg-[#242a3b]"
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="service-description"
                className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Description
              </label>

              <textarea
                id="service-description"
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
                rows={3}
                className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-800 outline-none transition-all focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:focus:border-violet-400 dark:focus:bg-[#242a3b]"
              />
            </div>

            {/* Status */}
            <div>
              <label
                htmlFor="service-status"
                className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Status
              </label>

              <select
                id="service-status"
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value,
                  })
                }
                className="w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-800 outline-none transition-all focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-[#242a3b] dark:text-white dark:focus:border-violet-400"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-white/[0.08]">
              <button
                type="button"
                disabled={saving}
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:bg-white/10"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-[0_4px_12px_rgba(124,58,237,0.25)] transition-all hover:bg-violet-700 hover:shadow-[0_6px_16px_rgba(124,58,237,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Service"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
);

}

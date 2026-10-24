import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  ArrowUpRight,
  Wrench,
  Droplets,
  ShieldCheck,
  BatteryCharging,
  CircleGauge,
  Truck,
  SlidersHorizontal,
} from "lucide-react";
import { motion } from "motion/react";

const services = [
  {
    id: 1,
    title: "Vehicle Maintenance",
    category: "Maintenance",
    description:
      "Keep your fleet running smoothly with regular inspections and preventive maintenance.",
    icon: Wrench,
    gradient: "from-violet-600/30 to-indigo-600/10",
  },
  {
    id: 2,
    title: "Vehicle Washing",
    category: "Cleaning",
    description:
      "Professional interior and exterior cleaning services for your commercial vehicles.",
    icon: Droplets,
    gradient: "from-sky-600/30 to-cyan-600/10",
  },
  {
    id: 3,
    title: "Vehicle Inspection",
    category: "Inspection",
    description:
      "Detailed vehicle inspections to improve safety and reduce unexpected breakdowns.",
    icon: ShieldCheck,
    gradient: "from-emerald-600/30 to-teal-600/10",
  },
  {
    id: 4,
    title: "Battery Services",
    category: "Maintenance",
    description:
      "Battery health checks, replacement support, and reliable maintenance solutions.",
    icon: BatteryCharging,
    gradient: "from-amber-600/30 to-orange-600/10",
  },
  {
    id: 5,
    title: "Tyre Services",
    category: "Maintenance",
    description:
      "Tyre inspection, replacement, balancing, and maintenance for better road performance.",
    icon: CircleGauge,
    gradient: "from-fuchsia-600/30 to-purple-600/10",
  },
  {
    id: 6,
    title: "Fleet Assistance",
    category: "Assistance",
    description:
      "Convenient roadside support and assistance for your fleet service requirements.",
    icon: Truck,
    gradient: "from-blue-600/30 to-violet-600/10",
  },
];

const categories = [
  "All Services",
  "Maintenance",
  "Cleaning",
  "Inspection",
  "Assistance",
];

export default function ServicesPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Services");

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesCategory =
        activeCategory === "All Services" ||
        service.category === activeCategory;

      const searchText = search.trim().toLowerCase();

      const matchesSearch =
        service.title.toLowerCase().includes(searchText) ||
        service.description.toLowerCase().includes(searchText);

      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory]);

  return (
    <main className="min-h-screen bg-[#090b12] text-white">
      <section className="relative overflow-hidden px-6 pb-16 pt-36">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[450px] w-[650px] max-w-full -translate-x-1/2 rounded-full bg-violet-600/15 blur-[120px]" />

        <div className="relative mx-auto max-w-6xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-sm text-violet-200">
              <SlidersHorizontal size={15} />
              Explore Fleet Services
            </div>

            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Everything your fleet
              <span className="mt-2 block gradient-text">
                needs to keep moving.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl leading-8 text-gray-400">
              Explore professional fleet services designed to simplify
              maintenance, improve reliability, and support your operations.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-28">
        <div className="mb-10 flex flex-col gap-6">
          <div className="relative max-w-xl">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
            />

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search fleet services..."
              aria-label="Search fleet services"
              className="w-full rounded-2xl border border-white/10 bg-[#131622] py-4 pl-12 pr-5 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-violet-400"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                aria-pressed={activeCategory === category}
                className={`rounded-full border px-5 py-2.5 text-sm transition ${
                  activeCategory === category
                    ? "border-violet-400 bg-violet-500 text-white"
                    : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:text-white"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <p className="mb-6 text-sm text-gray-500">
          Showing {filteredServices.length} services
        </p>

        {filteredServices.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredServices.map((service, index) => {
              const Icon = service.icon;

              return (
                <motion.article
                  key={service.id}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="group overflow-hidden rounded-3xl border border-white/10 bg-[#111521] transition hover:border-violet-400/30"
                >
                  <div
                    className={`flex h-48 items-center justify-center bg-gradient-to-br ${service.gradient}`}
                  >
                    <div className="rounded-3xl border border-white/15 bg-white/10 p-6 text-white shadow-xl backdrop-blur">
                      <Icon size={46} strokeWidth={1.5} />
                    </div>
                  </div>

                  <div className="p-7">
                    <span className="text-xs font-medium uppercase tracking-widest text-violet-400">
                      {service.category}
                    </span>

                    <h2 className="mt-3 text-xl font-semibold">
                      {service.title}
                    </h2>

                    <p className="mt-4 min-h-24 text-sm leading-7 text-gray-400">
                      {service.description}
                    </p>

                    <Link
                      to={`/services/${service.id}`}
                      className="inline-flex items-center gap-2 font-medium text-violet-300 transition group-hover:gap-3"
                    >
                      View Details
                      <ArrowUpRight size={18} />
                    </Link>
                  </div>
                </motion.article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-[#111521] px-6 py-16 text-center">
            <Search size={36} className="mx-auto text-gray-500" />
            <h2 className="mt-5 text-xl font-semibold">
              No services found
            </h2>
            <p className="mt-3 text-sm text-gray-400">
              Try another keyword or select a different category.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setActiveCategory("All Services");
              }}
              className="mt-6 rounded-full bg-violet-500 px-6 py-3 text-sm font-medium hover:bg-violet-400"
            >
              Clear Filters
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
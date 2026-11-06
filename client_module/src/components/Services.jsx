import { useState } from "react";
import {
  Wrench,
  Fuel,
  ShieldCheck,
  Truck,
  Droplets,
  BatteryCharging,
  CircleGauge,
  Search,MapPin,Users
} from "lucide-react";

const services = [
  {
    icon: Wrench,
    title: "Vehicle Maintenance",
    category: "Maintenance",
    description:
      "Regular inspections and maintenance to keep your vehicles running smoothly.",
  },
  {
    icon: Truck,
    title: "Fleet Assistance",
    category: "Assistance",
    description:
      "Support for your fleet's vehicle service and operational requirements.",
  },
  {
    icon: Fuel,
    title: "Fuel Management",
    category: "Management",
    description:
      "Explore solutions for managing vehicle fuel requirements.",
  },
  {
    icon: ShieldCheck,
    title: "Vehicle Inspection",
    category: "Inspection",
    description:
      "Vehicle inspections to help maintain safety and identify maintenance needs.",
  },
  {
    icon: Droplets,
    title: "Vehicle Washing",
    category: "Cleaning",
    description:
      "Interior and exterior cleaning services for your vehicles.",
  },
  {
    icon: BatteryCharging,
    title: "Battery Services",
    category: "Maintenance",
    description:
      "Battery inspections, maintenance and replacement support.",
  },
  {
    icon: CircleGauge,
    title: "Tyre Services",
    category: "Maintenance",
    description:
      "Tyre inspection, balancing and replacement services.",
  },
  {
  icon: MapPin,
  title: "GPS Vehicle Tracking",
  category: "Tracking",
  description:
    "Monitor vehicle locations and track fleet movement using GPS.",
},
{
  icon: Users,
  title: "Driver Management",
  category: "Management",
  description:
    "Organize driver profiles, vehicle assignments and driver-related records.",
},
];

// Categories services ki list se banti hain.
const categories = [
  "All Services",
  ...new Set(services.map((service) => service.category)),
];

export default function Services() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Services");

  const searchText = search.trim().toLowerCase();

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.title.toLowerCase().includes(searchText) ||
      service.description.toLowerCase().includes(searchText);

    const matchesCategory =
      category === "All Services" ||
      service.category === category;

    return matchesSearch && matchesCategory;
  });

  return (
    <section
      id="services"
      className="scroll-mt-24 bg-[#0d101a] px-6 py-20 text-white sm:py-24"
    >
      <div className="mx-auto max-w-7xl">
        {/* Heading */}
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">
            Our Services
          </p>

          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything your fleet needs.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-gray-400">
            Discover essential vehicle services through one connected platform.
          </p>
        </div>

        {/* Search */}
        <div className="relative mx-auto max-w-lg">
          <Search
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
          />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search services..."
            aria-label="Search services"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-violet-400"
          />
        </div>

        {/* Category filters */}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              aria-pressed={category === item}
              className={`rounded-full border px-4 py-2 text-xs font-medium transition ${
                category === item
                  ? "border-violet-500 bg-violet-500 text-white"
                  : "border-white/10 bg-white/[0.03] text-gray-400 hover:border-violet-400/40 hover:text-white"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <p
          aria-live="polite"
          className="mb-4 mt-8 text-xs text-gray-500"
        >
          Showing {filteredServices.length} services
        </p>

        {/* Service cards */}
        {filteredServices.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredServices.map((service) => {
              const Icon = service.icon;

              return (
                <article
                  key={service.title}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition duration-300 hover:border-violet-400/40 hover:bg-white/[0.05]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
                    <Icon size={22} aria-hidden="true" />
                  </div>

                  <p className="mt-5 text-[10px] font-semibold uppercase tracking-widest text-violet-400">
                    {service.category}
                  </p>

                  <h3 className="mt-2 text-lg font-semibold">
                    {service.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-gray-400">
                    {service.description}
                  </p>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center">
            <Search
              size={28}
              aria-hidden="true"
              className="mx-auto text-gray-500"
            />

            <h3 className="mt-4 font-semibold">
              No services found
            </h3>

            <p className="mt-2 text-sm text-gray-400">
              Try another keyword or category.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategory("All Services");
              }}
              className="mt-5 rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium transition hover:bg-violet-400"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
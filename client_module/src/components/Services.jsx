import {
  Wrench,
  Fuel,
  ShieldCheck,
  Truck,
  ArrowUpRight,
} from "lucide-react";

const services = [
  {
    icon: Wrench,
    title: "Vehicle Maintenance",
    description: "Keep your vehicles running smoothly with maintenance services.",
  },
  {
    icon: Truck,
    title: "Fleet Assistance",
    description: "Get support for your fleet's operational requirements.",
  },
  {
    icon: Fuel,
    title: "Fuel Management",
    description: "Explore solutions for managing vehicle fuel requirements.",
  },
  {
    icon: ShieldCheck,
    title: "Vehicle Inspection",
    description: "Find inspection services to help maintain vehicle safety.",
  },
];

export default function Services() {
  return (
    <section id="services" className="bg-[#0d101a] px-6 py-28 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-400">
            Our Services
          </p>

          <h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
            Everything your fleet needs.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-gray-400">
            Discover essential vehicle services through one connected platform.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {services.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group flex gap-6 rounded-3xl border border-white/10 bg-white/[0.03] p-8 transition duration-300 hover:border-violet-400/40 hover:bg-white/[0.06]"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300">
                <Icon size={25} />
              </div>

              <div>
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-gray-400">
                  {description}
                </p>
                <ArrowUpRight className="mt-5 text-violet-400" size={20} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
import Reveal from "./Reveal";
import {
  ShieldCheck,
  CalendarCheck,
  ClipboardList,
  Wrench,
  ArrowUpRight,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Wrench,
    title: "Fleet Services",
    description:
      "Explore essential vehicle maintenance, repairs, and fleet support services.",
  },
  {
    icon: ShieldCheck,
    title: "Verified Partners",
    description:
      "Connect with trusted service partners through a structured platform.",
  },
  {
    icon: CalendarCheck,
    title: "Easy Booking",
    description:
      "Request services with a simple and convenient booking experience.",
  },
  {
    icon: ClipboardList,
    title: "Request Management",
    description:
      "Keep your service requests organized and accessible in one place.",
  },
  {
    icon: Zap,
    title: "Simplified Workflow",
    description:
      "Reduce manual coordination and streamline your service experience.",
  },
  {
    icon: ArrowUpRight,
    title: "One Connected Platform",
    description:
      "Bring clients, service partners, and fleet operations together.",
  },
];

export default function Features() {
  return (
    <section id="features" className="bg-[#090b12] px-6 py-28 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 max-w-2xl">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-400">
            Powerful Features
          </span>
          <h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
            Built for smarter fleet operations.
          </h2>
          <p className="mt-6 leading-8 text-gray-400">
            Everything you need to discover, request, and manage fleet services
            through a modern digital experience.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }, index) => (
  <Reveal key={title} delay={Math.min(index % 3, 2) * 0.1}>
    <div className="glass-card group h-full rounded-3xl p-8 transition-all duration-300 hover:-translate-y-2 hover:border-violet-400/40 hover:shadow-[0_20px_60px_rgba(139,92,246,0.12)]">
      <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300">
        <Icon size={25} />
      </div>

      <h3 className="text-xl font-semibold">{title}</h3>

      <p className="mt-4 text-sm leading-7 text-gray-400">
        {description}
      </p>

      <ArrowUpRight
        size={20}
        className="mt-8 text-gray-500 transition group-hover:text-violet-300"
      />
    </div>
  </Reveal>
))}
        </div>
      </div>
    </section>
  );
}

import { ShieldCheck, Users, Truck, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";

const highlights = [
  {
    icon: ShieldCheck,
    title: "Reliable Services",
    description: "Discover services designed to keep your fleet running smoothly.",
  },
  {
    icon: Users,
    title: "Trusted Partners",
    description: "Connect with service providers through one convenient platform.",
  },
  {
    icon: Truck,
    title: "Simpler Management",
    description: "Organize your fleet service needs in a more efficient way.",
  },
];

export default function About() {
  return (
    <section
      id="about"
      className="scroll-mt-24 bg-[#090b12] px-6 py-28 text-white"
    >
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-violet-400">
            About FLEETROVA
          </p>

          <h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
            A smarter way to keep
            <span className="block gradient-text">
              your fleet moving.
            </span>
          </h2>

          <p className="mt-6 text-base leading-8 text-gray-400">
            FLEETROVA is a fleet services platform concept designed to
            bring vehicle owners and service partners together. Our goal
            is to make discovering, requesting, and managing fleet
            services easier through one seamless digital experience.
          </p>

          <Link
            to="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-violet-500 px-6 py-3 text-sm font-semibold transition hover:bg-violet-400"
          >
            Get Started <ArrowUpRight size={17} />
          </Link>
        </motion.div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {highlights.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-white/10 bg-[#111521] p-7"
            >
              <div className="mb-5 inline-flex rounded-xl bg-violet-500/10 p-3 text-violet-300">
                <Icon size={23} />
              </div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-gray-400">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

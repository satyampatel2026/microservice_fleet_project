import { ArrowUpRight, Sparkles } from "lucide-react";
import { motion } from "motion/react";

export default function CTA() {
  return (
    <section className="relative overflow-hidden bg-[#090b12] px-6 py-28 text-white">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-violet-400/20 bg-[#151125] px-6 py-20 text-center sm:px-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,#6d28d940,transparent_65%)]" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-sm text-violet-200">
            <Sparkles size={15} />
            Your fleet, simplified
          </div>

          <h2 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Ready to transform the way
            <span className="block gradient-text">
              you manage fleet services?
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-xl leading-8 text-gray-400">
            Discover services, connect with trusted partners, and manage
            your fleet requirements through one platform.
          </p>

          <a
            href="/register"
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 font-semibold text-[#090b12] transition hover:bg-violet-200"
          >
            Get Started
            <ArrowUpRight size={18} />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
import DashboardPreview from "./DashboardPreview";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { motion } from "motion/react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#090b12] px-6 pb-24 pt-44 text-white">

      {/* Background Glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-glow absolute left-1/2 top-12 h-[500px] w-[700px] max-w-full -translate-x-1/2 rounded-full bg-violet-600/20 blur-[130px]" />

        <div className="absolute right-0 top-72 h-[350px] w-[350px] rounded-full bg-indigo-600/10 blur-[110px]" />
      </div>

      <div className="relative mx-auto max-w-6xl text-center">

        {/* Hero Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-sm text-violet-200">
            <Sparkles size={15} />
            The smarter way to manage fleet services
          </div>

          <h1 className="mx-auto max-w-5xl text-5xl font-semibold leading-[1.12] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
            Everything your fleet needs.

            <span className="mt-2 block bg-gradient-to-r from-violet-300 via-indigo-300 to-sky-300 bg-clip-text text-transparent">
              All in one place.
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-gray-400 sm:text-lg">
            Discover reliable fleet services, connect with verified service
            partners, and manage your service requests through one seamless
            platform.
          </p>

          {/* Buttons */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">

            <a
              href="/register"
              className="flex items-center gap-2 rounded-full bg-violet-500 px-8 py-4 font-medium text-white transition hover:bg-violet-400"
            >
              Get Started
              <ArrowRight size={18} />
            </a>

            <a
              href="#how-it-works"
              className="flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-8 py-4 font-medium transition hover:bg-white/10"
            >
              <Play size={17} />
              See How It Works
            </a>

          </div>
        </motion.div>

        {/* New Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="relative mx-auto mt-20 max-w-6xl"
        >
          <div className="absolute -inset-8 rounded-[3rem] bg-violet-600/15 blur-3xl" />

          <div className="relative rounded-[2rem] border border-white/15 bg-gradient-to-b from-white/15 to-white/5 p-2 shadow-2xl shadow-violet-950/40 sm:p-3">

            <DashboardPreview />

          </div>
        </motion.div>

      </div>
    </section>
  );
}
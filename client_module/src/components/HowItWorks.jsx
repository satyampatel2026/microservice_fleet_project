const steps = [
  {
    number: "01",
    title: "Explore Services",
    description:
      "Browse available vehicle and fleet services based on your needs.",
  },
  {
    number: "02",
    title: "Choose a Partner",
    description:
      "Find a suitable service partner and submit your service request.",
  },
  {
    number: "03",
    title: "Manage Your Request",
    description:
      "Stay organized and manage your service requests in one place.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden bg-[#090b12] px-6 py-28 text-white"
    >
      <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/10 blur-[100px]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-400">
            Simple Process
          </p>

          <h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
            How it works
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-gray-400">
            Get started with fleet services in three simple steps.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="rounded-3xl border border-white/10 bg-[#111521] p-8"
            >
              <span className="bg-gradient-to-r from-violet-300 to-indigo-400 bg-clip-text text-5xl font-bold text-transparent">
                {step.number}
              </span>

              <h3 className="mt-8 text-xl font-semibold">{step.title}</h3>

              <p className="mt-4 text-sm leading-7 text-gray-400">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
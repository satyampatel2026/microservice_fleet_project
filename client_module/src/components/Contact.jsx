
import { useState } from "react";
import { Mail, ArrowUpRight, MessageSquare } from "lucide-react";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <section
      id="contact"
      className="scroll-mt-24 bg-[#090b12] px-6 py-28 text-white"
    >
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-violet-400">
            Contact Us
          </p>

          <h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
            Let's start a
            <span className="block gradient-text">conversation.</span>
          </h2>

          <p className="mt-6 max-w-md text-base leading-8 text-gray-400">
            Have a question, suggestion, or want to learn more about
            FLEETROVA? Send us a message using the form.
          </p>

          <div className="mt-9 flex items-center gap-3 text-sm text-gray-400">
            <Mail size={20} className="text-violet-400" />
            Contact information will be available soon.
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#111521] p-7 sm:p-9">
          <div className="mb-7 flex items-center gap-3">
            <span className="rounded-xl bg-violet-500/10 p-3 text-violet-300">
              <MessageSquare size={22} />
            </span>
            <div>
              <h3 className="text-xl font-semibold">Send a message</h3>
              <p className="mt-1 text-xs text-gray-500">
                Frontend demo form
              </p>
            </div>
          </div>

          {submitted ? (
            <div role="status" className="rounded-xl border border-violet-400/20 bg-violet-500/10 p-5 text-sm text-violet-200">
              Demo form completed. Your message has not been sent yet.
              Contact form integration will be added later.
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-4 block font-semibold underline"
              >
                Write another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="contact-name" className="mb-2 block text-sm text-gray-300">
                  Full Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  placeholder="Your name"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-gray-500 focus:border-violet-400"
                />
              </div>

              <div>
                <label htmlFor="contact-email" className="mb-2 block text-sm text-gray-300">
                  Email Address
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-gray-500 focus:border-violet-400"
                />
              </div>

              <div>
                <label htmlFor="contact-message" className="mb-2 block text-sm text-gray-300">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={5}
                  placeholder="How can we help?"
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-gray-500 focus:border-violet-400"
                />
              </div>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-6 py-3.5 text-sm font-semibold transition hover:bg-violet-400"
              >
                Submit Demo Message <ArrowUpRight size={17} />
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

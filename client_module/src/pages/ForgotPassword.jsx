import { useState, useRef } from "react";
import TurnstileCaptcha from "../components/TurnstileCaptcha"; 
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import { motion } from "motion/react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
const captchaRef = useRef(null);
const [error, setError] = useState("");

  const handleSubmit = (e) => {
  e.preventDefault();

  if (!email.trim()) {
    setError("Please enter your email address.");
    return;
  }

  if (!captchaToken) {
    setError("Please complete CAPTCHA verification.");
    return;
  }

  setError("");

  // Backend API integration pending.
  // Abhi koi OTP ya password reset email nahi bheja ja raha.
  setSubmitted(true);
};
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#090b12] px-5 py-16 text-white">
      <div className="pointer-events-none absolute left-1/2 top-1/4 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-600/20 blur-[110px]" />

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <Link
          to="/"
         className="mb-8 flex items-center justify-center !no-underline"
        >
      <img src="/fleetrova-logo.png" alt="FLEETROVA" className="h-14 w-auto max-w-[240px] object-contain"/>
        </Link>

        <div className="rounded-3xl border border-white/10 bg-[#111521] p-7 shadow-2xl sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300">
              <Mail size={25} />
            </div>

            <h1 className="text-3xl font-semibold">
              Forgot your password?
            </h1>

            <p className="mt-4 text-sm leading-7 text-gray-400">
              Enter your registered email address to request a
              password reset.
            </p>
          </div>

          {submitted ? (
            <div className="space-y-5 text-center">
              <div
                role="status"
                className="rounded-xl border border-violet-400/20 bg-violet-500/10 p-4 text-sm leading-6 text-violet-200"
              >
                Your email address has been captured in this demo.
                Password reset emails will work after backend
                integration.
              </div>

              <button
                type="button"
                onClick={() => {setSubmitted(false); setCaptchaToken(""); setError("");}}
                className="text-sm font-medium text-violet-400 hover:text-violet-300"
              >
                Try another email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm text-gray-300"
                >
                  Email Address
                </label>

                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-violet-400"
                />
              </div>
            {/* CAPTCHA Verification */}
<div className="flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-5">
  <TurnstileCaptcha
    ref={captchaRef}
    onVerify={(token) => {
      setCaptchaToken(token);
      setError("");
    }}
  />

  <p className="text-center text-xs text-gray-400">
    Complete security verification to request a password reset.
  </p>
</div>

{/* Error */}
{error && (
  <p
    role="alert"
    className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
  >
    {error}
  </p>
)}
              <button
                type="submit"
                disabled={!captchaToken}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-4 font-semibold transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Request Password Reset
                <ArrowRight size={18} />
              </button>
            </form>
          )}

          <Link
            to="/login"
            className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-400 transition hover:text-white"
          >
            <ArrowLeft size={17} />
            Back to Login
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
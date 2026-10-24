import { useState, useRef } from "react";
import TurnstileCaptcha from "../components/TurnstileCaptcha"; 
import { Link } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, LockKeyhole } from "lucide-react";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [captchaToken, setCaptchaToken] = useState("");
const captchaRef = useRef(null);
const [error, setError] = useState("");

  const handleSubmit = (e) => {
  e.preventDefault();

  if (!captchaToken) {
    setError("Please complete CAPTCHA verification.");
    return;
  }

  setError("");

  // Backend abhi nahi bana hai.
  // Future API mein email, password aur captchaToken bhejenge.
  console.log("Login form validated; backend integration pending");
};
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#090b12] px-5 py-16 text-white">
      <div className="pointer-events-none absolute left-1/2 top-1/4 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-600/20 blur-[110px]" />

      <div className="relative w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center !no-underline">
          <img src="/fleetrova-logo.png" alt="FLEETROVA" className="h-14 w-auto max-w-[240px] object-contain" />
        </Link>

        <div className="rounded-3xl border border-white/10 bg-[#111521] p-7 shadow-2xl sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300">
              <LockKeyhole size={23} />
            </div>

            <h1 className="text-3xl font-semibold">Welcome back</h1>
            <p className="mt-3 text-sm text-gray-400">
              Sign in to your FleetRova client account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm text-gray-300">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                placeholder="Enter your email"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-violet-400"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="password" className="text-sm text-gray-300">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-violet-400 hover:text-violet-300"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 pr-12 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-violet-400"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>
            {/* CAPTCHA */}
<div className="flex justify-center rounded-xl border border-white/10 bg-white/[0.04] p-4">
  <TurnstileCaptcha
    ref={captchaRef}
    onVerify={(token) => {
      setCaptchaToken(token);
      setError("");
    }}
  />
</div>

{error && (
  <p role="alert" className="text-sm text-red-400">
    {error}
  </p>
)}
            <button
              type="submit"
              disabled={!captchaToken}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-4 font-semibold transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sign In <ArrowRight size={18} />
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-gray-400">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-violet-400 hover:text-violet-300"
            >
              Create account
            </Link>
          </p>
        </div>

        <p className="mt-8 text-center text-xs text-gray-600">
          © {new Date().getFullYear()} FleetRova. All rights reserved.
        </p>
      </div>
    </main>
  );
}
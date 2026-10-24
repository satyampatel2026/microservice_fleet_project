import { useState, useRef } from "react";
import TurnstileCaptcha from "../components/TurnstileCaptcha";   
import { Link } from "react-router-dom";
import {
  UserRound,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";

const initialForm = {
  name: "",
  email: "",
  mobile: "",
  password: "",
  confirmPassword: "",
};

export default function Register() {
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
const captchaRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!/^[0-9]{10}$/.test(form.mobile)) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    if (!captchaToken) {
  setError("Please complete CAPTCHA verification.");
  return;
}
    setError("");

    // Client registration API will be integrated later.
    // Do not log passwords or sensitive form data.
    console.log("Registration form validated");
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#090b12] px-5 py-16 text-white">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/4 h-[450px] w-[450px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]" />

      <div className="relative w-full max-w-lg">
        {/* Logo */}
        <Link to="/" className="mb-8 flex items-center justify-center !no-underline" >
          <img src="/fleetrova-logo.png" alt="FLEETROVA" className="h-14 w-auto max-w-[240px] object-contain"/>
        </Link>

        {/* Form card */}
        <div className="rounded-3xl border border-white/10 bg-[#111521] p-7 shadow-2xl sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300">
              <UserRound size={23} />
            </div>

            <h1 className="text-3xl font-semibold">
              Create your account
            </h1>

            <p className="mt-3 text-sm text-gray-400">
              Join FleetRova and manage your fleet service needs.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm text-gray-300"
              >
                Full Name
              </label>

              <input
                id="name"
                type="text"
                name="name"
                required
                autoComplete="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm outline-none transition placeholder:text-gray-600 focus:border-violet-400"
              />
            </div>

            {/* Email */}
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
                name="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm outline-none transition placeholder:text-gray-600 focus:border-violet-400"
              />
            </div>

            {/* Mobile */}
            <div>
              <label
                htmlFor="mobile"
                className="mb-2 block text-sm text-gray-300"
              >
                Mobile Number
              </label>

              <input
                id="mobile"
                type="tel"
                name="mobile"
                required
                autoComplete="tel"
                inputMode="numeric"
                maxLength={10}
                pattern="[0-9]{10}"
                value={form.mobile}
                onChange={handleChange}
                placeholder="Enter 10-digit mobile number"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm outline-none transition placeholder:text-gray-600 focus:border-violet-400"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm text-gray-300"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 pr-12 text-sm outline-none transition placeholder:text-gray-600 focus:border-violet-400"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm text-gray-300"
              >
                Confirm Password
              </label>

              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  required
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 pr-12 text-sm outline-none transition placeholder:text-gray-600 focus:border-violet-400"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
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
            {/* Error */}
            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
              >
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!captchaToken}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-4 font-semibold transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Create Account
              <ArrowRight size={18} />
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-gray-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-violet-400 hover:text-violet-300"
            >
              Sign In
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
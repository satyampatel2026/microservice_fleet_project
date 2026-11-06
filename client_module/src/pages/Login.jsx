import { showToast, validateField, focusFirstError } from "../utils/authFeedback";
import { useState, useRef } from "react";
import TurnstileCaptcha from "../components/TurnstileCaptcha"; 
import { loginClient } from "../services/clientService";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, LockKeyhole } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [captchaKey, setCaptchaKey] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [captchaToken, setCaptchaToken] = useState("");
const captchaRef = useRef(null);
const [error, setError] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});

  function checkField(field) {
    const rule = field === "password" ? "loginPassword" : field;
    setFieldErrors((previous) => ({ ...previous, [field]: validateField(rule, form[field]) }));
  }

  function handleChange(field, value) {
    const nextForm = { ...form, [field]: value };
    setForm(nextForm);
    setError("");
    if (fieldErrors[field]) {
      const rule = field === "password" ? "loginPassword" : field;
      setFieldErrors((previous) => ({ ...previous, [field]: validateField(rule, value) }));
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lock.current) return;
    const errors = {
      email: validateField("email", form.email),
      password: validateField("loginPassword", form.password),
    };
    setFieldErrors(errors);
    if (focusFirstError(errors)) return;
    if (!captchaToken) { setError("Please complete CAPTCHA verification."); return; }
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await loginClient({ email: form.email.trim().toLowerCase(), password: form.password, captchaToken });
      showToast("success", "Welcome back. You are signed in.");
      navigate("/client/dashboard", { replace: true });
    } catch (error) {
      setError(error.message);
      showToast("error", error.message);
    } finally {
      lock.current = false;
      setBusy(false);
      setCaptchaToken("");
      setCaptchaKey((value) => value + 1);
    }
  };
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#090b12] px-5 py-16 text-white">

      <style>{`
        input[aria-invalid="true"] { border-color: #fb7185; }
        input[aria-invalid="true"]:focus { box-shadow: 0 0 0 3px rgba(251,113,133,.12); }
        .client-auth-toast.swal2-popup { border: 1px solid rgba(167,139,250,.22); border-radius: 14px; box-shadow: 0 16px 48px rgba(0,0,0,.3); font-family: inherit; font-size: 13px; }
        .client-auth-toast .swal2-timer-progress-bar { background: #a78bfa; }
        @media (prefers-reduced-motion: reduce) { .client-auth-toast { animation: none !important; } }
      `}</style>
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

          <form noValidate onSubmit={handleSubmit} className="space-y-5">
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
                  handleChange("email", e.target.value)
                }
                placeholder="Enter your email"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-violet-400"
               onBlur={() => checkField("email")} aria-invalid={!!fieldErrors.email} aria-describedby={fieldErrors.email ? "email-error" : undefined} disabled={busy} />
              {fieldErrors.email && <p id="email-error" role="alert" className="mt-1.5 text-xs leading-5 text-rose-300">{fieldErrors.email}</p>}
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
                    handleChange("password", e.target.value)
                  }
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 pr-12 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-violet-400"
                 onBlur={() => checkField("password")} aria-invalid={!!fieldErrors.password} aria-describedby={fieldErrors.password ? "password-error" : undefined} disabled={busy} />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
              {fieldErrors.password && <p id="password-error" role="alert" className="mt-1.5 text-xs leading-5 text-rose-300">{fieldErrors.password}</p>}
            </div>
            {/* CAPTCHA */}
<div className="flex justify-center rounded-xl border border-white/10 bg-white/[0.04] p-4">
  <TurnstileCaptcha key={captchaKey}
    ref={captchaRef}
    onVerify={(token) => {
      setCaptchaToken(token);
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
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-4 font-semibold transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Signing in..." : "Sign In"} <ArrowRight size={18} />
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
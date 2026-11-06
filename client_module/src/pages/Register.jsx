import { showToast, validateField, focusFirstError } from "../utils/authFeedback";
import { useState, useRef, useEffect } from "react";
import TurnstileCaptcha from "../components/TurnstileCaptcha";   
import { registerClient, getClientTerms } from "../services/clientService";
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
  const [terms, setTerms] = useState(null);
  const [termsError, setTermsError] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [captchaKey, setCaptchaKey] = useState(0);
  const lock = useRef(false);
  const termsRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    getClientTerms().then((result) => {
      if (!result.data?.content || !result.data?.version) throw new Error("Terms unavailable.");
      if (!cancelled) setTerms(result.data);
    }).catch((error) => { if (!cancelled) setTermsError(error.message); });
    return () => { cancelled = true; };
  }, []);

  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
const captchaRef = useRef(null);

  const [fieldErrors, setFieldErrors] = useState({});

  function checkField(field) {
    setFieldErrors((previous) => ({ ...previous, [field]: validateField(field, form[field], form.password) }));
  }

  const handleChange = (e) => {
    const { name } = e.target;
    const value = name === "mobile" ? e.target.value.replace(/[^0-9]/g, "").slice(0, 10) : e.target.value;
    const nextForm = { ...form, [name]: value };
    setForm(nextForm);
    setError("");
    setFieldErrors((previous) => {
      const nextErrors = { ...previous };
      if (previous[name]) nextErrors[name] = validateField(name, value, nextForm.password);
      if (name === "password" && nextForm.confirmPassword) {
        nextErrors.confirmPassword = validateField("confirmPassword", nextForm.confirmPassword, value);
      }
      return nextErrors;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lock.current || success) return;
    const errors = {
      name: validateField("name", form.name),
      email: validateField("email", form.email),
      mobile: validateField("mobile", form.mobile),
      password: validateField("password", form.password),
      confirmPassword: validateField("confirmPassword", form.confirmPassword, form.password),
      termsAccepted: termsAccepted ? "" : "Please accept the Terms & Conditions.",
    };
    setFieldErrors(errors);
    if (focusFirstError(errors)) return;
    if (!terms) { setError("Terms are unavailable. Refresh this page to retry."); return; }
    if (!captchaToken) { setError("Please complete CAPTCHA verification."); return; }
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await registerClient({
        name: form.name.trim(), email: form.email.trim().toLowerCase(), mobile: form.mobile,
        password: form.password, termsAccepted, termsVersion: terms.version, captchaToken,
      });
      setForm(initialForm);
      setFieldErrors({});
      showToast("success", "Account created. You can now sign in.");
      setSuccess("Account created successfully. Please sign in.");
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

          <form noValidate onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm text-gray-300"
              >
                Full Name
              </label>

              <input
                maxLength={100}
                id="name"
                type="text"
                name="name"
                required
                autoComplete="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm outline-none transition placeholder:text-gray-600 focus:border-violet-400"
               onBlur={() => checkField("name")} aria-invalid={!!fieldErrors.name} aria-describedby={fieldErrors.name ? "name-error" : undefined} disabled={busy} />
              {fieldErrors.name && <p id="name-error" role="alert" className="mt-1.5 text-xs leading-5 text-rose-300">{fieldErrors.name}</p>}
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
                maxLength={100}
                id="email"
                type="email"
                name="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm outline-none transition placeholder:text-gray-600 focus:border-violet-400"
               onBlur={() => checkField("email")} aria-invalid={!!fieldErrors.email} aria-describedby={fieldErrors.email ? "email-error" : undefined} disabled={busy} />
              {fieldErrors.email && <p id="email-error" role="alert" className="mt-1.5 text-xs leading-5 text-rose-300">{fieldErrors.email}</p>}
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
                pattern="[6-9][0-9]{9}"
                value={form.mobile}
                onChange={handleChange}
                placeholder="Enter 10-digit mobile number"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm outline-none transition placeholder:text-gray-600 focus:border-violet-400"
               onBlur={() => checkField("mobile")} aria-invalid={!!fieldErrors.mobile} aria-describedby={fieldErrors.mobile ? "mobile-error" : undefined} disabled={busy} />
              {fieldErrors.mobile && <p id="mobile-error" role="alert" className="mt-1.5 text-xs leading-5 text-rose-300">{fieldErrors.mobile}</p>}
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
                 onBlur={() => checkField("password")} aria-invalid={!!fieldErrors.password} aria-describedby={fieldErrors.password ? "password-error" : undefined} disabled={busy} />

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
              {fieldErrors.password && <p id="password-error" role="alert" className="mt-1.5 text-xs leading-5 text-rose-300">{fieldErrors.password}</p>}
            </div>

            <p className="-mt-2 text-[11px] leading-5 text-gray-400">Use at least 8 characters. Avoid reusing a password from another account.</p>
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
                 onBlur={() => checkField("confirmPassword")} aria-invalid={!!fieldErrors.confirmPassword} aria-describedby={fieldErrors.confirmPassword ? "confirmPassword-error" : undefined} disabled={busy} />

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
              {fieldErrors.confirmPassword && <p id="confirmPassword-error" role="alert" className="mt-1.5 text-xs leading-5 text-rose-300">{fieldErrors.confirmPassword}</p>}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <input id="termsAccepted" type="checkbox" checked={termsAccepted} disabled={!terms || busy || !!success} onChange={(event) => { setTermsAccepted(event.target.checked); setFieldErrors((previous) => ({ ...previous, termsAccepted: event.target.checked ? "" : "Please accept the Terms & Conditions." })); }} aria-invalid={!!fieldErrors.termsAccepted} aria-describedby={fieldErrors.termsAccepted ? "termsAccepted-error" : undefined} className="mt-1 accent-violet-500" />
                <label htmlFor="termsAccepted" className="text-gray-300">I agree to the Terms & Conditions.</label>
              </div>
              {fieldErrors.termsAccepted && <p id="termsAccepted-error" role="alert" className="text-xs text-rose-300">{fieldErrors.termsAccepted}</p>}
              <button type="button" disabled={!terms} onClick={() => termsRef.current.showModal()} className="text-violet-300 underline disabled:opacity-50">{terms ? `Read Terms & Conditions (${terms.version})` : "Loading terms..."}</button>
              {termsError && <p role="alert" className="text-red-300">{termsError} Refresh this page to retry.</p>}
            </div>
            {success && <p role="status" className="rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-300">{success} <Link to="/login" className="underline">Sign in</Link></p>}
            {/* CAPTCHA */}
<div className="flex justify-center rounded-xl border border-white/10 bg-white/[0.04] p-4">
  <TurnstileCaptcha key={captchaKey}
    ref={captchaRef}
    onVerify={(token) => {
      setCaptchaToken(token);
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
              disabled={busy || !terms || !!success}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-4 font-semibold transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Creating account..." : "Create Account"}
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
      <dialog ref={termsRef} aria-labelledby="terms-title" className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-2xl rounded-2xl border border-white/10 bg-[#111521] p-6 text-white backdrop:bg-black/70">
        <div className="flex items-center justify-between gap-4"><h2 id="terms-title" className="text-lg font-semibold">Terms & Conditions — {terms?.version}</h2><button type="button" onClick={() => termsRef.current.close()} className="rounded-lg border border-white/20 px-3 py-1 text-sm">Close</button></div>
        <p className="mt-4 max-h-[60vh] overflow-y-auto whitespace-pre-wrap break-words text-sm leading-7 text-gray-300">{terms?.content}</p>
      </dialog>
    </main>
  );
}
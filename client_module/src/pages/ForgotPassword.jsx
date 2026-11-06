import { showToast, validateField, focusFirstError } from "../utils/authFeedback";
import { useState, useRef } from "react";
import TurnstileCaptcha from "../components/TurnstileCaptcha"; 
import { forgotClientPassword, verifyClientOtp, resetClientPassword } from "../services/clientService";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import { motion } from "motion/react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState("email");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [captchaKey, setCaptchaKey] = useState(0);
  const lock = useRef(false);
  const [captchaToken, setCaptchaToken] = useState("");
const captchaRef = useRef(null);
const [error, setError] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});

  function checkField(field) {
    const values = { email, otp, newPassword, confirmPassword };
    setFieldErrors((previous) => ({ ...previous, [field]: validateField(field, values[field], newPassword) }));
  }

  function changeField(field, value) {
    if (field === "email") setEmail(value);
    if (field === "otp") setOtp(value.replace(/[^0-9]/g, "").slice(0, 6));
    if (field === "newPassword") setNewPassword(value);
    if (field === "confirmPassword") setConfirmPassword(value);
    setError("");
    setFieldErrors((previous) => {
      const nextErrors = { ...previous };
      if (previous[field]) nextErrors[field] = validateField(field, value, newPassword);
      if (field === "newPassword" && confirmPassword) nextErrors.confirmPassword = validateField("confirmPassword", confirmPassword, value);
      return nextErrors;
    });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lock.current) return;
    let errors = {};
    if (step === "email") errors.email = validateField("email", email);
    if (step === "otp") errors.otp = validateField("otp", otp);
    if (step === "password") {
      errors.newPassword = validateField("newPassword", newPassword);
      errors.confirmPassword = validateField("confirmPassword", confirmPassword, newPassword);
    }
    setFieldErrors(errors);
    if (focusFirstError(errors)) return;
    if (step === "email" && !captchaToken) { setError("Please complete CAPTCHA verification."); return; }
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      if (step === "email") {
        const result = await forgotClientPassword({ email: email.trim().toLowerCase(), captchaToken });
        setFieldErrors({});
        showToast("success", "Request received. Check your email if an active account exists.");
        setMessage(result.message);
        setStep("otp");
      } else if (step === "otp") {
        const result = await verifyClientOtp({ email: email.trim().toLowerCase(), otp });
        if (!result.resetToken) throw new Error("Reset token missing. Request a new OTP.");
        setFieldErrors({});
        showToast("success", "OTP verified. Set your new password.");
        setResetToken(result.resetToken);
        setOtp("");
        setMessage("OTP verified. Choose a new password.");
        setStep("password");
      } else if (step === "password") {
        await resetClientPassword({ resetToken, newPassword });
        setResetToken(""); setNewPassword(""); setConfirmPassword("");
        setFieldErrors({});
        showToast("success", "Password updated successfully.");
        setMessage("Password reset successfully. Please sign in.");
        setStep("done");
      }
    } catch (error) {
      setError(error.message);
      showToast("error", error.message);
    } finally {
      lock.current = false;
      setBusy(false);
      if (step === "email") { setCaptchaToken(""); setCaptchaKey((value) => value + 1); }
    }
  };

  const startAgain = () => {
    setFieldErrors({});
    setStep("email"); setOtp(""); setResetToken("");
    setNewPassword(""); setConfirmPassword(""); setError(""); setMessage("");
    setCaptchaToken(""); setCaptchaKey((value) => value + 1);
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
              {step === "email" ? "Forgot your password?" : step === "otp" ? "Verify your email" : step === "password" ? "Set a new password" : "Password updated"}
            </h1>

            <p className="mt-4 text-sm leading-7 text-gray-400">
              {step === "email" ? "Enter your registered email to request a reset OTP." : step === "otp" ? "Enter the 6-digit code sent to your email. It expires in 10 minutes." : step === "password" ? "Choose a new password with at least 8 characters." : "Your password has been changed. Sign in to continue."}
            </p>
          </div>

          {message && <p role="status" className="mb-5 rounded-xl border border-violet-400/20 bg-violet-500/10 p-4 text-sm leading-6 text-violet-200">{message}</p>}
          {step !== "done" && (
            <form noValidate onSubmit={handleSubmit} className="space-y-5">
              <fieldset disabled={busy} className="space-y-5">
                {step === "email" && <>
                  <div><label htmlFor="email" className="mb-2 block text-sm text-gray-300">Email address</label><input id="email" type="email" required maxLength={100} autoComplete="email" value={email} onChange={(event) => changeField("email", event.target.value)} placeholder="Enter registered email" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm outline-none focus:border-violet-400"  onBlur={() => checkField("email")} aria-invalid={!!fieldErrors.email} aria-describedby={fieldErrors.email ? "email-error" : undefined} disabled={busy} />
              {fieldErrors.email && <p id="email-error" role="alert" className="mt-1.5 text-xs leading-5 text-rose-300">{fieldErrors.email}</p>}</div>
                  <div className="flex justify-center rounded-xl border border-white/10 p-4"><TurnstileCaptcha key={captchaKey} ref={captchaRef} onVerify={(token) => { setCaptchaToken(token); }} /></div>
                </>}
                {step === "otp" && <div><label htmlFor="otp" className="mb-2 block text-sm text-gray-300">6-digit OTP</label><input id="otp" type="text" inputMode="numeric" autoComplete="one-time-code" required pattern="[0-9]{6}" maxLength={6} value={otp} onChange={(event) => changeField("otp", event.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm tracking-widest outline-none focus:border-violet-400"  onBlur={() => checkField("otp")} aria-invalid={!!fieldErrors.otp} aria-describedby={fieldErrors.otp ? "otp-error" : undefined} disabled={busy} />
              {fieldErrors.otp && <p id="otp-error" role="alert" className="mt-1.5 text-xs leading-5 text-rose-300">{fieldErrors.otp}</p>}</div>}
                {step === "password" && <>
                  <div><label htmlFor="newPassword" className="mb-2 block text-sm text-gray-300">New password</label><input id="newPassword" type="password" required minLength={8} autoComplete="new-password" value={newPassword} onChange={(event) => changeField("newPassword", event.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm outline-none focus:border-violet-400"  onBlur={() => checkField("newPassword")} aria-invalid={!!fieldErrors.newPassword} aria-describedby={fieldErrors.newPassword ? "newPassword-error" : undefined} disabled={busy} />
              {fieldErrors.newPassword && <p id="newPassword-error" role="alert" className="mt-1.5 text-xs leading-5 text-rose-300">{fieldErrors.newPassword}</p>}</div>
                  <div><label htmlFor="confirmPassword" className="mb-2 block text-sm text-gray-300">Confirm password</label><input id="confirmPassword" type="password" required autoComplete="new-password" value={confirmPassword} onChange={(event) => changeField("confirmPassword", event.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm outline-none focus:border-violet-400"  onBlur={() => checkField("confirmPassword")} aria-invalid={!!fieldErrors.confirmPassword} aria-describedby={fieldErrors.confirmPassword ? "confirmPassword-error" : undefined} disabled={busy} />
              {fieldErrors.confirmPassword && <p id="confirmPassword-error" role="alert" className="mt-1.5 text-xs leading-5 text-rose-300">{fieldErrors.confirmPassword}</p>}</div>
                </>}
              </fieldset>
              {error && <p role="alert" className="rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
              <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-4 font-semibold hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Please wait..." : step === "email" ? "Send OTP" : step === "otp" ? "Verify OTP" : "Reset password"}<ArrowRight size={18} /></button>
              {step !== "email" && <button type="button" disabled={busy} onClick={startAgain} className="text-sm text-violet-300 disabled:opacity-50">Request a new OTP / change email</button>}
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
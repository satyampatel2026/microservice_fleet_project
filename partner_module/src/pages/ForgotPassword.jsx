import { useState,useRef } from "react";
import TurnstileCaptcha from "../components/TurnstileCaptcha";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import {
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetForgotPassword,
} from "../services/partnerService";

const steps = [
  { number: 1, label: "Email" },
  { number: 2, label: "Verify OTP" },
  { number: 3, label: "Reset" },
];

const inputClass =
  "h-[50px] w-full rounded-xl border border-slate-200 " +
  "bg-[#F8FAFA] px-4 text-sm text-slate-800 outline-none " +
  "transition-all duration-200 placeholder:text-slate-400 " +
  "hover:border-teal-200 focus:border-teal-500 " +
  "focus:bg-white focus:ring-4 focus:ring-teal-500/10 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

const primaryButtonClass =
  "group flex h-[50px] w-full items-center justify-center gap-2 " +
  "rounded-xl bg-gradient-to-r from-[#0E3940] to-[#0F766E] " +
  "px-5 text-sm font-bold text-white " +
  "shadow-[0_8px_22px_rgba(15,118,110,0.24)] " +
  "transition-all duration-300 hover:-translate-y-0.5 " +
  "hover:shadow-[0_12px_30px_rgba(15,118,110,0.34)] " +
  "active:translate-y-0 disabled:cursor-not-allowed " +
  "disabled:opacity-60";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
const captchaRef = useRef(null);

  const clearMessages = () => {
    setMessage("");
    setError("");
  };
    const handleSendOtp = async (e) => {
  e.preventDefault();
  clearMessages();

  if (!email.trim()) {
    setError("Please enter your email");
    return;
  }

  if (!captchaToken) {
    setError("Please complete CAPTCHA verification");
    return;
  }

  try {
    setLoading(true);

    await sendForgotPasswordOtp(email.trim(), captchaToken);

    setMessage("OTP sent to your email");
    setStep(2);
  } catch (err) {
    console.error("Forgot Password Error:", err);
    setError(err.message || "Failed to send OTP");
  } finally {
    setLoading(false);
    setCaptchaToken("");
    captchaRef.current?.reset();
  }
};
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6 digit OTP");
      return;
    }

    try {
      setLoading(true);

      await verifyForgotPasswordOtp(email, otp);

      setMessage("OTP verified successfully");
      setStep(3);
    } catch (error) {
      console.error(error);
      setError(error.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!newPassword || !confirmPassword) {
      setError("Please enter both passwords");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      await resetForgotPassword(email, newPassword);

      setMessage("Password reset successfully");

      setEmail("");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      console.error(error);
      setError(error.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const pageContent = {
    1: {
      eyebrow: "ACCOUNT RECOVERY",
      title: "Forgot password?",
      description:
        "Enter your registered email address and we'll send you a verification code.",
      icon: Mail,
    },
    2: {
      eyebrow: "IDENTITY VERIFICATION",
      title: "Check your inbox.",
      description:
        "Enter the 6-digit verification code sent to your registered email.",
      icon: ShieldCheck,
    },
    3: {
      eyebrow: "SECURE YOUR ACCOUNT",
      title: "Create new password.",
      description:
        "Choose a new password to regain access to your partner workspace.",
      icon: KeyRound,
    },
  };

  const current = pageContent[step];
  const CurrentIcon = current.icon;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#071B22] px-4 py-10 font-sans selection:bg-teal-100 selection:text-teal-900 sm:px-6">
      <style>{`
        @keyframes recoveryFadeUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes recoveryGlow {
          0%, 100% {
            opacity: .35;
            transform: scale(1);
          }
          50% {
            opacity: .65;
            transform: scale(1.12);
          }
        }

        @keyframes recoveryFloat {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        .recovery-enter {
          animation: recoveryFadeUp .6s ease-out both;
        }

        .recovery-glow {
          animation: recoveryGlow 9s ease-in-out infinite;
        }

        .recovery-float {
          animation: recoveryFloat 6s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .recovery-enter,
          .recovery-glow,
          .recovery-float {
            animation: none !important;
          }
        }
      `}</style>

      {/* Background Effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="recovery-glow absolute -left-40 top-10 h-[450px] w-[450px] rounded-full bg-teal-500/20 blur-[110px]" />

        <div className="recovery-glow absolute -right-40 bottom-0 h-[480px] w-[480px] rounded-full bg-emerald-500/15 blur-[120px]" />

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)",
            backgroundSize: "46px 46px",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-[480px]">
        {/* Brand Logo */}
        <div className="recovery-enter mb-7 flex flex-col items-center text-center">
          <img
            src="/fleetrova-logo.png"
            alt="FLEETROVA"
            className="h-14 w-auto max-w-[230px] object-contain drop-shadow-[0_8px_20px_rgba(20,184,166,0.18)]"
          />

          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/[0.08] px-3.5 py-1.5">
            <Sparkles size={12} className="text-teal-300" />
            <span className="text-[10px] font-bold uppercase tracking-[0.17em] text-teal-300">
              Partner Workspace
            </span>
          </div>
        </div>

        {/* Premium Card */}
        <div className="recovery-enter overflow-hidden rounded-[28px] border border-white/20 bg-white shadow-[0_30px_90px_rgba(0,0,0,0.35)] transition-shadow duration-300 hover:shadow-[0_36px_100px_rgba(0,0,0,0.42)]">
          {/* Accent Bar */}
          <div className="h-1 w-full bg-gradient-to-r from-[#0E3940] via-[#14B8A6] to-[#D6B77B]" />

          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="mb-7 text-center">
              <div className="recovery-float mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-100 bg-teal-50 text-teal-700 shadow-[0_8px_25px_rgba(15,118,110,0.12)]">
                <CurrentIcon size={26} strokeWidth={1.7} />
              </div>

              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-teal-700">
                {current.eyebrow}
              </p>

              <h3 className="text-xl font-bold tracking-tight text-[#092B31] sm:text-[22px]">
                {current.title}
              </h3>

              <p className="mx-auto mt-2 max-w-[320px] text-xs leading-5 text-slate-500 sm:text-[13px]">
                {current.description}
              </p>
            </div>

            {/* Step Indicator */}
            <div
              className="mb-7 flex items-center justify-center"
              aria-label={`Step ${step} of 3`}
            >
              {steps.map((item, index) => (
                <div key={item.number} className="flex items-center">
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold transition-all duration-300 ${
                        step > item.number
                          ? "border-teal-600 bg-teal-600 text-white"
                          : step === item.number
                          ? "border-teal-600 bg-[#0E3940] text-white shadow-[0_5px_15px_rgba(15,118,110,0.25)]"
                          : "border-slate-200 bg-slate-100 text-slate-400"
                      }`}
                    >
                      {step > item.number ? (
                        <Check size={16} strokeWidth={2.5} />
                      ) : (
                        item.number
                      )}
                    </div>

                    <span
                      className={`whitespace-nowrap text-[10px] font-semibold ${
                        step >= item.number
                          ? "text-teal-800"
                          : "text-slate-400"
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>

                  {index < steps.length - 1 && (
                    <div
                      className={`mx-2 mb-5 h-[2px] w-10 rounded-full transition-colors duration-300 sm:mx-3 sm:w-14 ${
                        step > item.number
                          ? "bg-teal-500"
                          : "bg-slate-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Success Message */}
            {message && (
              <div
                role="status"
                className="recovery-enter mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700"
              >
                <CheckCircle2 size={17} className="shrink-0" />
                <span>{message}</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div
                role="alert"
                className="recovery-enter mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700"
              >
                <ShieldCheck size={17} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1 - Email */}
            {step === 1 && (
              <form
                onSubmit={handleSendOtp}
                className="recovery-enter space-y-5"
              >
                
<div>
  <label
    htmlFor="recovery-email"
    className="mb-2 block text-xs font-semibold text-slate-700"
  >
    Registered email address
  </label>

  <div className="relative">
    <span className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center">
      <Mail
        size={17}
        className="text-slate-400"
      />
    </span>

    <input
      id="recovery-email"
      type="email"
      autoComplete="email"
      placeholder="Enter registered email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      disabled={loading}
      className="h-12 w-full rounded-xl border border-slate-200 bg-[#F8FAFA] py-3 pl-12 pr-4 text-sm text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-teal-200 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 disabled:cursor-not-allowed disabled:opacity-60"
    />
  </div>
</div>
          {/* CAPTCHA VERIFICATION */}
<div className="flex flex-col items-center gap-1.5 rounded-lg border border-teal-100 bg-[#F8FBFA] px-3 py-3">
  <TurnstileCaptcha
    ref={captchaRef}
    onVerify={setCaptchaToken}
  />
  <p className="text-center text-[11px] text-slate-500">
    Complete security verification to receive your OTP.
  </p>
</div>
                <button
                  type="submit"
                  disabled={loading || !captchaToken}
                  className={primaryButtonClass}
                >
                  {loading ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      Send verification code
                      <ArrowRight
                        size={17}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 2 - Verify OTP */}
            {step === 2 && (
              <form
                onSubmit={handleVerifyOtp}
                className="recovery-enter space-y-5"
              >
                <div className="rounded-xl border border-teal-100 bg-teal-50/70 px-4 py-3">
                  <p className="text-xs leading-5 text-slate-600">
                    Verification code sent to
                  </p>

                  <p className="mt-0.5 break-all text-sm font-bold text-teal-800">
                    {email}
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="recovery-otp"
                    className="mb-2 block text-xs font-bold text-slate-700"
                  >
                    6-digit verification code
                  </label>

                  <input
                    id="recovery-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="Enter 6 digit OTP"
                    value={otp}
                    maxLength={6}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, ""))
                    }
                    disabled={loading}
                    className={`${inputClass} text-center text-lg font-semibold tracking-[0.45em] placeholder:text-sm placeholder:font-normal placeholder:tracking-normal`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={primaryButtonClass}
                >
                  {loading ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify OTP
                      <ArrowRight
                        size={17}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setStep(1);
                    clearMessages();
                  }}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 transition-all hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800 disabled:opacity-60"
                >
                  <ArrowLeft size={15} />
                  Change email address
                </button>
              </form>
            )}

            {/* STEP 3 - Reset Password */}
            {step === 3 && (
              <form
                onSubmit={handleResetPassword}
                className="recovery-enter space-y-5"
              >
                <div>
                  <label
                    htmlFor="new-password"
                    className="mb-2 block text-xs font-bold text-slate-700"
                  >
                    New password
                  </label>

                  <div className="relative">
                    <LockKeyhole
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={loading}
                      className={`${inputClass} pl-11 pr-12`}
                    />

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() =>
                        setShowNewPassword((prev) => !prev)
                      }
                      aria-label={
                        showNewPassword
                          ? "Hide new password"
                          : "Show new password"
                      }
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition-colors hover:bg-teal-50 hover:text-teal-700"
                    >
                      {showNewPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>

                  <p className="mt-1.5 text-[11px] text-slate-400">
                    Minimum 6 characters required.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="mb-2 block text-xs font-bold text-slate-700"
                  >
                    Confirm new password
                  </label>

                  <div className="relative">
                    <LockKeyhole
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="confirm-password"
                      type={
                        showConfirmPassword ? "text" : "password"
                      }
                      autoComplete="new-password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(e.target.value)
                      }
                      disabled={loading}
                      className={`${inputClass} pl-11 pr-12`}
                    />

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() =>
                        setShowConfirmPassword((prev) => !prev)
                      }
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition-colors hover:bg-teal-50 hover:text-teal-700"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={primaryButtonClass}
                >
                  {loading ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      Reset password
                      <ArrowRight
                        size={17}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Back to Login */}
            <div className="mt-7 border-t border-slate-100 pt-5">
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-xs font-bold text-teal-700 transition-colors hover:text-teal-900"
              >
                <ArrowLeft size={15} />
                Back to sign in
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-2 text-xs text-teal-100/70">
            <ShieldCheck size={15} className="text-teal-300" />
            Secure partner account recovery
          </div>

          <p className="text-[11px] text-slate-500">
            © 2026 FLEETROVA. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

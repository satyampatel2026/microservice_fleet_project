
import React, { useState,useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import TurnstileCaptcha from "../components/TurnstileCaptcha";
import { useFormik } from "formik";
import * as Yup from "yup";
import Swal from "sweetalert2";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Eye,
  EyeOff,
  Fingerprint,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Truck,
  Loader2,
} from "lucide-react";

import { loginPartner } from "../services/partnerService";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2200,
  timerProgressBar: true,
  width: 350,
  background: "#ffffff",
  color: "#0f172a",
  customClass: {
    popup: "!rounded-2xl !border !border-slate-200 !shadow-xl",
    title: "!text-sm !font-semibold",
    htmlContainer: "!text-xs !text-slate-500",
  },
});

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
const captchaRef = useRef(null);
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },

    validationSchema: Yup.object({
      email: Yup.string()
        .email("Please enter a valid email")
        .required("Email ID is required"),

      password: Yup.string().required(
        "Password is required"
      ),
    }),

    onSubmit: async (values) => {
  if (!captchaToken) {
    Toast.fire({
      icon: "warning",
      title: "CAPTCHA verification required",
      text: "Please complete the security verification.",
    });
    return;
  }

  try {
    setLoading(true);

    const data = await loginPartner({
      email: values.email.trim(),
      password: values.password,
      captchaToken,
    });

    await Toast.fire({
      icon: "success",
      title: "Login Successful",
      text: `Welcome back, ${
        data.partner?.partner_name || "Partner"
      }!`,
      timer: 1500,
    });

    navigate("/dashboard", { replace: true });
  } catch (error) {
    console.error("Login error:", error);

    Toast.fire({
      icon: "error",
      title: "Login Failed",
      text:
        error.message || "Invalid email or password",
      timer: 3000,
    });

    setCaptchaToken("");
    captchaRef.current?.reset();
  } finally {
    setLoading(false);
  }
},
  });
  const emailError =
    formik.touched.email && formik.errors.email;

  const passwordError =
    formik.touched.password &&
    formik.errors.password;

  return (
    <div className="min-h-[100dvh] bg-[#F5F8F7] font-sans text-slate-900 lg:h-[100dvh] lg:overflow-hidden selection:bg-teal-100 selection:text-teal-900">
      <style>{`
        @keyframes partnerFadeUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes partnerFloat {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-9px);
          }
        }

        @keyframes partnerGlow {
          0%, 100% {
            opacity: 0.35;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.12);
          }
        }

        @keyframes partnerShine {
          from {
            transform: translateX(-150%);
          }
          to {
            transform: translateX(250%);
          }
        }

        .partner-fade-up {
          animation: partnerFadeUp 0.7s ease-out both;
        }

        .partner-float {
          animation: partnerFloat 6s ease-in-out infinite;
        }

        .partner-glow {
          animation: partnerGlow 9s ease-in-out infinite;
        }

        .partner-login-button:hover .partner-shine {
          animation: partnerShine 1.1s ease-in-out;
        }

        @media (min-width: 1024px) and (max-height: 740px) {
          .partner-preview { margin-top: 12px; }
          .partner-eyebrow { display: none; }
          .partner-heading-icon { display: none; }
          .partner-heading { margin-bottom: 12px; }
          .partner-trust { margin-top: 10px; }
        }
        @media (min-width: 1024px) and (max-height: 640px) {
          .partner-preview { display: none; }
          .partner-form-area { padding-top: 10px; padding-bottom: 10px; }
          .partner-form-card { padding: 14px; }
          .partner-trust { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .partner-fade-up,
          .partner-float,
          .partner-glow,
          .partner-login-button:hover .partner-shine {
            animation: none !important;
          }
        }
      `}</style>

      <div className="flex min-h-[100dvh] lg:h-[100dvh] lg:min-h-0 lg:overflow-hidden">
        {/* LEFT BRAND PANEL */}
        <aside className="relative hidden h-[100dvh] w-[52%] shrink-0 flex-col overflow-hidden bg-[#071B22] px-8 py-5 text-white lg:flex xl:px-12 xl:py-6">
          {/* Ambient Glow */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="partner-glow absolute -left-40 top-32 h-[420px] w-[420px] rounded-full bg-teal-500/15 blur-[110px]" />
            <div className="partner-glow absolute -right-32 bottom-0 h-[450px] w-[450px] rounded-full bg-emerald-500/10 blur-[120px]" />

            <div
              className="absolute inset-0 opacity-[0.035]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)",
                backgroundSize: "46px 46px",
              }}
            />
          </div>

          
{/* Brand */}
<div className="relative z-10 flex shrink-0 items-center gap-3">
  <img
    src="/fleetrova-logo.png"
    alt="FLEETROVA"
    className="h-10 w-auto max-w-[180px] object-contain drop-shadow-[0_8px_20px_rgba(20,184,166,0.18)] transition-transform duration-300 hover:scale-[1.03]"
  />

  <div className="shrink-0 border-l border-white/20 pl-3">
    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-300">
      Partner Portal
    </p>
    <p className="mt-1 text-[11px] text-slate-400">
      Business Workspace
    </p>
  </div>
</div>

          {/* Main Content */}
          <div className="relative z-10 pt-5 pb-3">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/[0.08] px-3.5 py-2 text-[11px] font-semibold tracking-wide text-teal-300">
              <Sparkles size={13} />
              YOUR BUSINESS. ONE WORKSPACE.
            </div>

            <h1 className="max-w-[590px] text-[clamp(2rem,3vw,3.4rem)] font-bold leading-[1.12] tracking-[-0.045em]">
              Run your fleet.
              <span className="mt-1 block bg-gradient-to-r from-[#5EEAD4] via-[#2DD4BF] to-[#D6B77B] bg-clip-text text-transparent">
                Grow your business.
              </span>
            </h1>

            <p className="mt-3 max-w-[440px] text-sm leading-6 text-slate-400">
              Your command center for smarter operations.
              Manage services, teams, expenses and business
              insights in one seamless workspace.
            </p>

            {/* Dashboard Preview - Decorative */}
            <div className="partner-preview partner-float relative mt-4 max-w-[530px]">
              <div className="rounded-[20px] border border-white/[0.12] bg-white/[0.07] p-3 shadow-[0_30px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl xl:p-3">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-400/15 text-teal-300">
                      <BarChart3 size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Business overview
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Your workspace at a glance
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
                    <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Connected
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.06] p-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-400/15 text-teal-300">
                        <Truck size={16} />
                      </div>
                      <ArrowUpRight size={15} className="text-teal-400" />
                    </div>

                    <p className="mt-2 text-[11px] text-slate-400">
                      Service operations
                    </p>
                    <p className="mt-1 text-base font-bold text-white">
                      Simplified
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.06] p-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/15 text-[#D6B77B]">
                        <TrendingUp size={16} />
                      </div>
                      <ArrowUpRight size={15} className="text-[#D6B77B]" />
                    </div>

                    <p className="mt-2 text-[11px] text-slate-400">
                      Business insights
                    </p>
                    <p className="mt-1 text-base font-bold text-white">
                      In focus
                    </p>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between rounded-xl border border-teal-400/10 bg-teal-400/[0.06] px-3.5 py-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-teal-400" />
                    <span className="text-xs text-slate-300">
                      Everything in one place
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-teal-300">
                    FLEETROVA
                  </span>
                </div>
              </div>
            </div>

          </div>
        </aside>

        {/* RIGHT LOGIN PANEL */}
        <main className="relative flex min-h-[100dvh] w-full flex-col bg-[#F5F8F7] lg:h-[100dvh] lg:min-h-0 lg:w-[48%] lg:overflow-y-auto lg:overscroll-contain">
         
{/* Mobile Brand */}
<div className="flex items-center justify-between px-6 pt-4 lg:hidden">
  <div className="flex items-center gap-3">
    <img
      src="/fleetrova-icon.png"
      alt="FLEETROVA"
      className="h-11 w-11 rounded-xl object-contain shadow-[0_5px_18px_rgba(15,118,110,0.12)]"
    />

    <div>
      <h2 className="text-lg font-extrabold tracking-tight text-[#092B31]">
        FLEET<span className="text-teal-600">ROVA</span>
      </h2>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        Partner Portal
      </p>
    </div>
  </div>

  <ShieldCheck size={20} className="text-teal-700" />
</div>

          {/* Login Form Container */}
          <div className="partner-form-area flex shrink-0 grow items-start justify-center px-5 py-4 sm:px-8 lg:px-8 lg:pt-6 xl:px-12">
            <div className="partner-fade-up w-full max-w-[440px]">
              {/* Desktop Eyebrow */}
              <div className="partner-eyebrow mb-3 hidden items-center gap-2 lg:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-teal-700">
                  Partner access
                </span>
              </div>

              {/* Heading */}
              <div className="partner-heading mb-4">
                <div className="partner-heading-icon mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-teal-100 bg-white text-teal-700 shadow-[0_8px_25px_rgba(13,77,73,0.09)]">
                  <Fingerprint size={21} strokeWidth={1.7} />
                </div>

                <h1 className="text-[28px] font-bold tracking-[-0.04em] text-[#092B31] sm:text-[30px]">
                  Welcome back<span className="text-teal-600">.</span>
                </h1>

                <p className="mt-1.5 text-xs leading-5 text-slate-500">
                  Sign in to your partner workspace and pick up
                  right where you left off.
                </p>
              </div>

              {/* Form Card */}
              <div className="partner-form-card rounded-[20px] border border-white bg-white p-4 shadow-[0_16px_55px_rgba(13,55,55,0.09)] transition-shadow duration-300 hover:shadow-[0_22px_65px_rgba(13,55,55,0.13)] sm:p-5">
                <form onSubmit={formik.handleSubmit} noValidate>
                  {/* Email */}
                  <div className="mb-3">
                    <label
                      htmlFor="partner-email"
                      className="mb-1.5 block text-xs font-bold text-slate-700"
                    >
                      Email address
                    </label>

                    <div className="relative">
                      <Mail
                        size={18}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        id="partner-email"
                        type="email"
                        name="email"
                        autoComplete="username"
                        placeholder="you@company.com"
                        value={formik.values.email}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        disabled={loading}
                        aria-invalid={Boolean(emailError)}
                        aria-describedby={
                          emailError ? "partner-email-error" : undefined
                        }
                        className={`h-[44px] w-full rounded-xl border bg-[#F8FAFA] pl-11 pr-4 text-sm text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${
                          emailError
                            ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                            : "border-slate-200 hover:border-teal-200 focus:border-teal-500 focus:ring-teal-500/10"
                        }`}
                      />
                    </div>

                    {emailError && (
                      <p
                        id="partner-email-error"
                        className="mt-1.5 text-xs font-medium text-red-600"
                      >
                        {formik.errors.email}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="mb-3">
                    <label
                      htmlFor="partner-password"
                      className="mb-1.5 block text-xs font-bold text-slate-700"
                    >
                      Password
                    </label>

                    <div className="relative">
                      <LockKeyhole
                        size={18}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        id="partner-password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        value={formik.values.password}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        disabled={loading}
                        aria-invalid={Boolean(passwordError)}
                        aria-describedby={
                          passwordError
                            ? "partner-password-error"
                            : undefined
                        }
                        className={`h-[44px] w-full rounded-xl border bg-[#F8FAFA] pl-11 pr-12 text-sm text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${
                          passwordError
                            ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                            : "border-slate-200 hover:border-teal-200 focus:border-teal-500 focus:ring-teal-500/10"
                        }`}
                      />

                      <button
                        type="button"
                        disabled={loading}
                        onClick={() =>
                          setShowPassword((prev) => !prev)
                        }
                        aria-label={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition-colors hover:bg-teal-50 hover:text-teal-700 disabled:opacity-50"
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>

                    {passwordError && (
                      <p
                        id="partner-password-error"
                        className="mt-1.5 text-xs font-medium text-red-600"
                      >
                        {formik.errors.password}
                      </p>
                    )}
                  </div>

                  {/* Forgot Password */}
                  <div className="mb-3 flex justify-end">
                    <Link
                      to="/forgot-password"
                      className="text-xs font-bold text-teal-700 transition-colors hover:text-teal-900 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  {/* CAPTCHA VERIFICATION */}
<div className="mb-3 flex flex-col items-center gap-1.5">
  <TurnstileCaptcha
  ref={captchaRef}
    onVerify={setCaptchaToken}
  />
  <p className="text-center text-[10px] text-slate-400">
    Security verification helps protect your account.
  </p>
</div>
                  {/* Login Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="partner-login-button group relative flex h-[44px] w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#0E3940] to-[#0F766E] px-5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(15,118,110,0.24)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,118,110,0.34)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="partner-shine pointer-events-none absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/15 to-transparent" />

                    {loading ? (
                      <>
                        <Loader2
                          size={18}
                          className="animate-spin"
                        />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign in to workspace
                        <ArrowRight
                          size={17}
                          className="transition-transform duration-200 group-hover:translate-x-1"
                        />
                      </>
                    )}
                  </button>

                  {/* Divider */}
                  <div className="my-3 flex items-center gap-4">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Or continue with
                    </span>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>

                  {/* OTP Button */}
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      Toast.fire({
                        icon: "info",
                        title: "OTP Login",
                        text: "OTP login feature will be available soon.",
                      });
                    }}
                    className="group flex h-[42px] w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0E3940] transition-all duration-200 hover:border-teal-300 hover:bg-teal-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Fingerprint
                      size={19}
                      className="text-teal-600 transition-transform group-hover:scale-110"
                    />
                    Sign in with OTP
                  </button>
                </form>
              </div>

              {/* Sign Up */}
              <p className="mt-4 text-center text-xs text-slate-500">
                New to FLEETROVA?{" "}
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1 font-bold text-teal-700 transition-colors hover:text-teal-900"
                >
                  Create partner account
                  <ArrowUpRight size={14} />
                </Link>
              </p>

              {/* Trust Footer */}
              <div className="partner-trust mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-teal-600" />
                  Partner access
                </span>

                <span className="flex items-center gap-1.5">
                  <LockKeyhole size={13} className="text-teal-600" />
                  Account sign-in
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="px-6 pb-3 text-center text-[11px] text-slate-400 lg:px-10">
            © 2026 FLEETROVA. All rights reserved.
          </div>
        </main>
      </div>
    </div>
  );
};

export default Login;

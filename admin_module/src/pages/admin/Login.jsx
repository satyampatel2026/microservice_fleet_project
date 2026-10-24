import { useState,useRef } from "react";
import TurnstileCaptcha from "../../components/common/TurnstileCaptcha" ;
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  Eye,
  EyeOff,
  Mail,
  LockKeyhole,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  LoaderCircle,
} from "lucide-react";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
});

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
const captchaRef = useRef(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!email.trim() || !password) {
    Toast.fire({
      icon: "warning",
      title: "Email and password are required",
    });
    return;
  }

  if (!captchaToken) {
    Toast.fire({
      icon: "warning",
      title: "Please complete CAPTCHA verification",
    });
    return;
  }

  try {
    setLoading(true);

    const response = await fetch(
      "http://localhost:5000/api/admin/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim(),
          password,
          captchaToken,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      Toast.fire({
        icon: "error",
        title: data.message || "Invalid email or password",
      });
      return;
    }

    await Toast.fire({
      icon: "success",
      title: data.message || "Login successful",
      timer: 1200,
    });

    navigate("/admin/dashboard", { replace: true });
  } catch (error) {
    console.error("Login Error:", error);

    Toast.fire({
      icon: "error",
      title: "Unable to connect to server",
    });
  } finally {
    setLoading(false);
    setCaptchaToken("");
    captchaRef.current?.reset();
  }
};
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#090b12] px-4 py-10 text-white sm:px-6">
      {/* Background glow */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-[450px] w-[450px] rounded-full bg-violet-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[500px] w-[500px] rounded-full bg-indigo-600/15 blur-[130px]" />

      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/10 bg-[#111521] shadow-2xl shadow-black/40 lg:grid-cols-2">
        {/* Left branding panel */}
        <div className="relative hidden min-h-[590px] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#1b1640] via-[#15132c] to-[#0d1020] p-11 lg:flex">
          <div className="pointer-events-none absolute right-[-100px] top-[120px] h-80 w-80 rounded-full bg-violet-500/20 blur-[90px]" />

          <div className="relative z-10">
            <img
              src="/fleetrova-logo.png"
              alt="FLEETROVA"
              className="h-20 max-w-full object-contain object-left"
            />

            <div className="mt-20">
              <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-xs font-semibold text-violet-200">
                <ShieldCheck size={15} />
                ADMIN PORTAL
              </span>

              <h1 className="mt-7 text-4xl font-bold leading-tight tracking-tight">
                Welcome to your
                <span className="mt-2 block bg-gradient-to-r from-violet-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
                  command center.
                </span>
              </h1>

              <p className="mt-6 max-w-sm text-sm leading-8 text-slate-400">
                Manage your fleet operations, partners, services,
                and administrative workflows from one workspace.
              </p>
            </div>
          </div>

          <div className="relative z-10 space-y-5">
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <CheckCircle2 size={19} className="text-violet-300" />
              Centralized administration
            </div>

            <div className="flex items-center gap-3 text-sm text-slate-300">
              <CheckCircle2 size={19} className="text-violet-300" />
              Partner and service management
            </div>

            <div className="flex items-center gap-3 text-sm text-slate-300">
              <CheckCircle2 size={19} className="text-violet-300" />
              Streamlined operations
            </div>

            <div className="border-t border-white/10 pt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">
                MOVE · MAINTAIN · MANAGE
              </p>
            </div>
          </div>
        </div>

        {/* Right login form */}
        <div className="flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-14 lg:py-16">
          {/* Mobile logo */}
          <div className="mb-10 lg:hidden">
            <img
              src="/fleetrova-logo.png"
              alt="FLEETROVA"
              className="h-16 max-w-full object-contain object-left"
            />
          </div>

          <div className="mb-9">
            <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10">
              <img
                src="/fleetrova-icon.png"
                alt=""
                className="h-11 w-11 object-contain"
              />
            </div>

            <h2 className="text-3xl font-bold tracking-tight">
              Admin Sign In
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Welcome back! Enter your credentials to access
              your admin dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2.5 block text-sm font-medium text-slate-200"
              >
                Email Address
              </label>

              <div className="relative">
                <Mail
                  size={19}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  autoComplete="email"
                  disabled={loading}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3.5 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/15 disabled:opacity-60"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2.5 block text-sm font-medium text-slate-200"
              >
                Password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={19}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3.5 pl-12 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/15 disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-violet-300"
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>
            {/* CAPTCHA Verification */}
<div className="flex flex-col items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-3">
  <TurnstileCaptcha
    ref={captchaRef}
    onVerify={setCaptchaToken}
  />
  <p className="text-center text-xs text-slate-400">
    Complete security verification to sign in.
  </p>
</div>
            {/* Sign in */}
            <button
              type="submit"
              disabled={loading || !captchaToken}
              className="group flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/20 transition hover:from-violet-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In to Dashboard
                  <ArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </>
              )}
            </button>
          </form>

          <div className="mt-9 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck
                size={18}
                className="mt-0.5 shrink-0 text-violet-300"
              />
              <p className="text-xs leading-6 text-slate-400">
                Restricted access. This portal is intended for
                authorized FLEETROVA administrators only.
              </p>
            </div>
          </div>

          <p className="mt-10 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} FLEETROVA.
            All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}


import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { verifyAuth } from "../services/partnerService";
import { ShieldCheck, LockKeyhole } from "lucide-react";

const ProtectedRoute = () => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      // Route change par previous auth state display na ho
      setLoading(true);

      try {
        await verifyAuth();

        if (isMounted) {
          setAuthenticated(true);
        }
      } catch (error) {
        console.error("Auth failed:", error.message);

        if (isMounted) {
          setAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#071B22] px-4">
        <style>{`
          @keyframes authFadeIn {
            from {
              opacity: 0;
              transform: translateY(12px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes authGlow {
            0%, 100% {
              opacity: .25;
              transform: scale(1);
            }
            50% {
              opacity: .5;
              transform: scale(1.1);
            }
          }

          .auth-fade-in {
            animation: authFadeIn .45s ease-out both;
          }

          .auth-glow {
            animation: authGlow 5s ease-in-out infinite;
          }

          @media (prefers-reduced-motion: reduce) {
            .auth-fade-in,
            .auth-glow {
              animation: none !important;
            }
          }
        `}</style>

        {/* Background Effects */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="auth-glow absolute -left-28 top-1/4 h-72 w-72 rounded-full bg-teal-500/20 blur-[100px]" />

          <div className="auth-glow absolute -right-28 bottom-0 h-80 w-80 rounded-full bg-emerald-500/15 blur-[100px]" />
        </div>

        {/* Loading Card */}
        <div
          role="status"
          aria-live="polite"
          className="auth-fade-in relative z-10 w-full max-w-[310px] rounded-[22px] border border-white/[0.12] bg-white/[0.07] px-6 py-8 text-center shadow-[0_22px_65px_rgba(0,0,0,0.22)] backdrop-blur-xl"
        >
          {/* Brand Icon */}
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-400/20 bg-teal-400/10 text-teal-300">
            <LockKeyhole size={22} />
          </div>

          {/* Spinner */}
          <div className="relative mx-auto mb-5 flex h-11 w-11 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-[3px] border-teal-300/15 border-t-teal-400 motion-safe:animate-spin" />

            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-400/10">
              <ShieldCheck size={15} className="text-teal-300" />
            </div>
          </div>

          <h2 className="text-[15px] font-bold tracking-tight text-white">
            Verifying your session
          </h2>

          <p className="mt-2 text-xs leading-5 text-slate-400">
            Checking authentication securely...
          </p>

          <div className="mx-auto mt-5 h-1 w-24 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 motion-safe:animate-pulse" />
          </div>

          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-300/80">
            FLEETROVA PARTNER PORTAL
          </p>
        </div>
      </div>
    );
  }

  // Authentication failed
  if (!authenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  // Authentication successful
  return <Outlet />;
};

export default ProtectedRoute;

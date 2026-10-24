
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { logoutPartner } from "../services/partnerService";
import {
  Menu,
  Search,
  Bell,
  MessageSquare,
  ChevronDown,
  Plus,
  LogOut,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  BriefcaseBusiness,
  ArrowUpRight,
  Loader2,
} from "lucide-react";

const notifications = [
  {
    title: "New job assigned",
    detail: "Job #JOB-2042 • 2 min ago",
    color: "bg-teal-500",
  },
  {
    title: "Payment received",
    detail: "₹12,500 from Rahul S.",
    color: "bg-emerald-500",
  },
  {
    title: "Leave request",
    detail: "Amit Verma • 1 hr ago",
    color: "bg-amber-500",
  },
];

const Navbar = ({ onMenuClick }) => {
  const navigate = useNavigate();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [toast, setToast] = useState(null);

  const notificationRef = useRef(null);
  const profileRef = useRef(null);
  const logoutTimerRef = useRef(null);

  // Existing toast duration preserved
  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 2500);

    return () => clearTimeout(timer);
  }, [toast]);

  // Close dropdowns on outside click / Escape
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotifOpen(false);
      }

      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setNotifOpen(false);
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }
    };
  }, []);

  // LOGOUT FUNCTIONALITY - PRESERVED
  const handleLogout = async () => {
    if (loggingOut) return;

    try {
      setLoggingOut(true);

      await logoutPartner();

      setProfileOpen(false);

      setToast({
        type: "success",
        title: "Logged out successfully",
        message: "See you again at Fleetrova!",
      });

      logoutTimerRef.current = setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1300);
    } catch (error) {
      console.error("Logout failed:", error);

      setToast({
        type: "error",
        title: "Logout failed",
        message: error.message || "Please try again.",
      });

      setLoggingOut(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes partnerNavSlideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .partner-nav-enter {
          animation: partnerNavSlideIn .2s ease-out both;
        }

        @media (prefers-reduced-motion: reduce) {
          .partner-nav-enter {
            animation: none;
          }
        }
      `}</style>

      {/* LOGOUT TOAST */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="partner-nav-enter fixed right-4 top-5 z-[9999] flex w-[calc(100%-2rem)] max-w-sm items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_16px_45px_rgba(7,27,34,0.18)] sm:right-6"
        >
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              toast.type === "success"
                ? "bg-emerald-50 text-emerald-600"
                : "bg-red-50 text-red-600"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 size={19} />
            ) : (
              <AlertCircle size={19} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-[#092B31]">
              {toast.title}
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              {toast.message}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Close notification"
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* NAVBAR */}
      <header className="sticky top-0 z-30 h-14 border-b border-[#E4ECEA] bg-white/95 shadow-[0_2px_12px_rgba(7,27,34,0.035)] backdrop-blur-xl">
        <div className="flex h-full items-center justify-between gap-3 px-3 sm:px-4 lg:px-5">
          {/* LEFT */}
          <div className="flex min-w-0 items-center gap-3">
            {/* Mobile Sidebar Toggle */}
            <button
              type="button"
              onClick={onMenuClick}
              aria-label="Open menu"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all duration-200 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 lg:hidden"
            >
              <Menu size={19} />
            </button>

            {/* Workspace Indicator */}
            <div className="hidden items-center gap-2.5 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E9F7F4] text-teal-700">
                <BriefcaseBusiness size={16} />
              </div>

              <div className="min-w-0">
                <p className="text-[12px] font-bold leading-tight tracking-tight text-[#092B31]">
                  Partner Workspace
                </p>
                <p className="mt-0.5 text-[10px] leading-tight text-slate-400">
                  Fleetrova Management
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-100 bg-teal-50 px-2.5 py-1 text-[10px] font-semibold text-teal-700 sm:hidden">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
              Partner Portal
            </span>
          </div>

          {/* RIGHT */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            {/* SEARCH - visual input only */}
            <div className="mr-1 hidden h-9 w-44 items-center gap-2 rounded-xl border border-[#E4ECEA] bg-[#F7FAF9] px-3 transition-all focus-within:border-teal-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-teal-500/10 md:flex xl:w-56">
              <Search size={15} className="shrink-0 text-slate-400" />

              <input
                type="search"
                placeholder="Search workspace..."
                aria-label="Search workspace"
                className="min-w-0 w-full bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>

            {/* MESSAGES */}
            <button
              type="button"
              aria-label="Messages"
              title="Messages"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-all duration-200 hover:bg-teal-50 hover:text-teal-700"
            >
              <MessageSquare size={18} strokeWidth={1.8} />
            </button>

            {/* NOTIFICATIONS */}
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((prev) => !prev);
                  setProfileOpen(false);
                }}
                aria-label="Notifications"
                aria-expanded={notifOpen}
                className={`relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 ${
                  notifOpen
                    ? "bg-teal-50 text-teal-700"
                    : "text-slate-500 hover:bg-teal-50 hover:text-teal-700"
                }`}
              >
                <Bell size={18} strokeWidth={1.8} />

                <span className="absolute right-[8px] top-[7px] h-[7px] w-[7px] rounded-full border-[1.5px] border-white bg-[#D6B77B]" />
              </button>

              {notifOpen && (
                <div className="partner-nav-enter absolute right-[-48px] top-11 z-50 w-[min(320px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-[#E4ECEA] bg-white shadow-[0_18px_55px_rgba(7,27,34,0.16)] sm:right-0">
                  <div className="flex items-center justify-between border-b border-slate-100 bg-[#F9FBFA] px-4 py-3">
                    <div>
                      <h3 className="text-[13px] font-bold text-[#092B31]">
                        Notifications
                      </h3>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        Your recent activity
                      </p>
                    </div>

                    <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-bold text-teal-700">
                      3 new
                    </span>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.map((notification, index) => (
                      <div
                        key={index}
                        className="flex gap-3 border-b border-slate-100 px-4 py-3 transition-colors last:border-0 hover:bg-[#F8FBFA]"
                      >
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.color}`}
                        />

                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-[#18383C]">
                            {notification.title}
                          </p>

                          <p className="mt-1 truncate text-[11px] text-slate-400">
                            {notification.detail}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 bg-[#F9FBFA] px-4 py-3 text-center">
                    <span className="text-[11px] font-semibold text-teal-700">
                      Recent notifications
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* NEW JOB - visual only, route not supplied */}
            <button
              type="button"
              className="ml-1 hidden h-9 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0E3940] to-[#0F766E] px-3.5 text-[11px] font-bold text-white shadow-[0_5px_15px_rgba(15,118,110,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(15,118,110,0.24)] sm:flex"
            >
              <Plus size={15} />
              New Job
            </button>

            <div className="mx-1.5 hidden h-6 w-px bg-[#E4ECEA] md:block" />

            {/* PROFILE */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen((prev) => !prev);
                  setNotifOpen(false);
                }}
                aria-label="Open partner profile menu"
                aria-expanded={profileOpen}
                className={`flex h-10 items-center gap-2 rounded-xl px-1.5 transition-all duration-200 hover:bg-[#F1F8F6] ${
                  profileOpen ? "bg-[#F1F8F6]" : ""
                }`}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-teal-500/20 bg-gradient-to-br from-[#0E3940] to-[#0F766E] text-[10px] font-extrabold text-white shadow-[0_3px_9px_rgba(15,118,110,0.15)]">
                  SM
                </div>

                <div className="hidden max-w-[130px] text-left lg:block">
                  <p className="truncate text-[11px] font-bold leading-tight text-[#092B31]">
                    Sharma Motors
                  </p>

                  <p className="mt-0.5 text-[10px] leading-tight text-slate-400">
                    Fleet Partner
                  </p>
                </div>

                <ChevronDown
                  size={14}
                  className={`hidden text-slate-400 transition-transform duration-200 md:block ${
                    profileOpen ? "rotate-180 text-teal-700" : ""
                  }`}
                />
              </button>

              {profileOpen && (
                <div className="partner-nav-enter absolute right-0 top-12 z-50 w-60 overflow-hidden rounded-2xl border border-[#E4ECEA] bg-white shadow-[0_18px_55px_rgba(7,27,34,0.16)]">
                  {/* Profile Header */}
                  <div className="border-b border-slate-100 bg-[#F9FBFA] p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0E3940] to-[#0F766E] text-xs font-extrabold text-white">
                        SM
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-bold text-[#092B31]">
                          Sharma Motors
                        </p>

                        <p className="mt-0.5 text-[11px] text-slate-500">
                          Fleet Partner
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-teal-50 px-2.5 py-2 text-[10px] font-medium text-teal-800">
                      <ShieldCheck size={13} />
                      Partner workspace
                    </div>
                  </div>

                  {/* Logout */}
                  <div className="p-2">
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loggingOut ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <LogOut size={16} />
                      )}

                      <span className="flex-1">
                        {loggingOut ? "Logging out..." : "Logout"}
                      </span>

                      {!loggingOut && <ArrowUpRight size={14} />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar;

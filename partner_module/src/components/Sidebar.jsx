
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Wrench,
  Users,
  ClipboardList,
  UserRound,
  Package,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  X,
  ShieldCheck,
  Sparkles,
  Loader2,
} from "lucide-react";

import { logoutPartner } from "../services/partnerService";

const menuItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    enabled: true,
  },
  {
    label: "My Services",
    icon: Wrench,
    href: "/partner/services",
    enabled: true,
  },
  {
    label: "Employees",
    icon: Users,
    href: "/partner/employees",
    enabled: true,
  },
  {
    label: "Job Cards",
    icon: ClipboardList,
    href: "/partner/jobs",
    enabled: false,
  },
  {
    label: "Customers",
    icon: UserRound,
    href: "/partner/customers",
    enabled: false,
  },
  {
    label: "Inventory",
    icon: Package,
    href: "/partner/inventory",
    enabled: false,
  },
  {
    label: "Payments",
    icon: Wallet,
    href: "/partner/payments",
    enabled: false,
  },
  {
    label: "Profile",
    icon: BarChart3,
    href: "/partner/kyc",
    enabled: true,
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/partner/settings",
    enabled: false,
  },
];

const Sidebar = ({ open, onClose, activePath = "/" }) => {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;

    try {
      setLoggingOut(true);

      await logoutPartner();

      onClose?.();

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1000);
    } catch (error) {
      console.error("Logout error:", error);

      // Original behavior: redirect even if logout API fails.
      onClose?.();

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1000);
    }
  };

  const handleMenuClick = (event, item) => {
    if (!item.enabled) {
      event.preventDefault();

      alert(
        `"${item.label}" page is under development and will be available soon!`
      );

      return;
    }

    onClose?.();
  };

  return (
    <>
      {/* MOBILE OVERLAY */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-[#071B22]/65 backdrop-blur-[3px] transition-all duration-300 lg:hidden ${
          open
            ? "visible opacity-100"
            : "invisible pointer-events-none opacity-0"
        }`}
      />

      {/* SIDEBAR */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[272px] shrink-0 flex-col overflow-hidden border-r border-white/[0.07] bg-[#071B22] text-slate-300 shadow-[12px_0_35px_rgba(7,27,34,0.12)] transition-transform duration-300 ease-out lg:sticky lg:z-0 lg:translate-x-0 lg:shadow-none ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Decorative background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-36 top-24 h-72 w-72 rounded-full bg-teal-500/[0.07] blur-[90px]" />
          <div className="absolute -right-40 bottom-16 h-72 w-72 rounded-full bg-emerald-500/[0.06] blur-[90px]" />
        </div>
        
{/* BRAND LOGO */}
<div className="relative z-10 flex h-[68px] shrink-0 items-center justify-between border-b border-white/[0.08] px-5">
  <Link
    to="/dashboard"
    onClick={() => onClose?.()}
    className="flex min-w-0 flex-1 items-center"
  >
    <img
      src="/fleetrova-logo.png"
      alt="FLEETROVA"
      className="block h-11 w-auto max-w-[190px] object-contain object-left transition-transform duration-300 hover:scale-[1.03]"
    />
  </Link>

  <button
    type="button"
    onClick={onClose}
    aria-label="Close sidebar"
    className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
  >
    <X size={18} />
  </button>
</div>

        {/* NAVIGATION */}
        <nav
          aria-label="Partner navigation"
          className="relative z-10 flex-1 space-y-1 overflow-y-auto px-3 py-4 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar]:w-1"
        >
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.17em] text-slate-500">
            Main Menu
          </p>

          {menuItems.map((item) => {
            const { label, icon: Icon, href, enabled } = item;
            const active = activePath === href;

            return (
              <Link
                key={label}
                to={enabled ? href : "#"}
                onClick={(event) => handleMenuClick(event, item)}
                aria-current={active ? "page" : undefined}
                aria-disabled={!enabled}
                className={`group relative flex min-h-[42px] items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] font-medium transition-all duration-200 ${
                  active
                    ? "bg-gradient-to-r from-[#0F766E] to-[#0E5957] font-semibold text-white shadow-[0_5px_16px_rgba(15,118,110,0.22)]"
                    : enabled
                      ? "text-slate-400 hover:translate-x-0.5 hover:bg-white/[0.07] hover:text-white"
                      : "cursor-not-allowed text-slate-600"
                }`}
              >
                {active && (
                  <span className="absolute -left-3 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-teal-300" />
                )}

                <Icon
                  size={17}
                  strokeWidth={1.9}
                  className={`shrink-0 transition-transform duration-200 ${
                    active
                      ? "text-teal-50"
                      : enabled
                        ? "text-slate-500 group-hover:scale-110 group-hover:text-teal-300"
                        : "text-slate-600"
                  }`}
                />

                <span className="min-w-0 flex-1 truncate">
                  {label}
                </span>

                {!enabled && (
                  <span className="rounded-md border border-white/[0.07] bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">
                    Soon
                  </span>
                )}

                {active && (
                  <ChevronRight
                    size={15}
                    className="shrink-0 text-teal-100"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* BOTTOM ACCOUNT */}
        <div className="relative z-10 shrink-0 border-t border-white/[0.08] bg-[#081F27]/90 p-3">
          <div className="mb-2 flex items-center gap-3 rounded-xl px-2 py-2">
            <div className="relative shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0E5957] to-[#0F766E] text-[11px] font-bold text-white">
                SM
              </div>

              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#081F27] bg-emerald-400" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-bold text-white">
                Sharma Motors
              </p>

              <p className="mt-0.5 truncate text-[10px] text-slate-500">
                Partner Account
              </p>
            </div>

            <ShieldCheck
              size={16}
              className="shrink-0 text-teal-400"
            />
          </div>

          {/* LOGOUT BUTTON */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="group flex h-10 w-full items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-[12px] font-semibold text-slate-300 transition-all duration-200 hover:border-red-400/20 hover:bg-red-400/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loggingOut ? (
              <Loader2
                size={16}
                className="shrink-0 animate-spin"
              />
            ) : (
              <LogOut
                size={16}
                className="shrink-0 transition-transform group-hover:translate-x-0.5"
              />
            )}

            <span className="flex-1 text-left">
              {loggingOut ? "Logging out..." : "Logout"}
            </span>

            {!loggingOut && (
              <ChevronRight
                size={15}
                className="text-slate-500 group-hover:text-red-300"
              />
            )}
          </button>

          <p className="mt-3 text-center text-[9px] font-medium tracking-wide text-slate-600">
            © {new Date().getFullYear()} FLEETROVA
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

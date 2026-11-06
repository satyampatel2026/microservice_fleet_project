import { useEffect, useState } from "react";
import BrandLogo from "../BrandLogo";
import { Link, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  MapPinned,
  Truck,
  Wrench,
  CalendarDays,
  UserRound,
  Settings,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  X,
  Globe2,
} from "lucide-react";

const workspaceLinks = [
  {
    label: "Overview",
    path: "/client/dashboard",
    icon: LayoutDashboard,
  },
  { label: "Vehicle Tracking", path: "/client/tracking", icon: MapPinned },
  { label: "My Vehicles", path: "/client/vehicles", icon: Truck },
  {label: "My Drivers", path: "/client/drivers", icon:UserRound},
  {
    label: "Explore Services",
    path: "/client/services",
    icon: Wrench,
  },
  {
    label: "My Bookings",
    path: "/client/bookings",
    icon: CalendarDays,
  },
];

const accountLinks = [
  {
    label: "My Profile",
    path: "/client/profile",
    icon: UserRound,
  },
  {
    label: "Settings",
    path: "/client/settings",
    icon: Settings,
  },
];

export default function ClientSidebar({
  client,
  mobileOpen,
  setMobileOpen,
  collapsed,
  setCollapsed,
}) {
  const closeMobile = () => setMobileOpen(false);

  const renderLink = ({ label, path, icon: Icon }) => (
    <NavLink
      key={path}
      to={path}
      onClick={closeMobile}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200 ${
          isActive
            ? "bg-violet-500/15 text-violet-200"
            : "text-gray-400 hover:bg-white/[0.06] hover:text-white"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-violet-400" />
          )}

          <Icon
            size={20}
            strokeWidth={1.8}
            className={`shrink-0 ${
              isActive
                ? "text-violet-300"
                : "text-gray-500 group-hover:text-gray-200"
            }`}
          />

         {(!collapsed || mobileOpen) && (
            <>
              <span className="flex-1 whitespace-nowrap">{label}</span>
              {isActive && (
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
              )}
            </>
          )}
        </>
      )}
    </NavLink>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-[100dvh] max-h-[100dvh] w-64 flex-col overflow-hidden border-r border-white/[0.08] bg-[#10131e] transition-all duration-300 ${
          collapsed ? "lg:w-[84px]" : "lg:w-64"
        } ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
       
{/* FLEETROVA Branding */}
<div className="flex h-20 shrink-0 items-center justify-between border-b border-white/[0.08] px-3">
  <div className="min-w-0 flex-1 overflow-hidden">
    {/* Expanded Sidebar */}
   {(!collapsed || mobileOpen) && (
      <div className="flex items-center">
        <BrandLogo
          to="/client/dashboard"
          size="md"
          className="max-w-full"
        />
      </div>
    )}

    {/* Collapsed Sidebar */}
    {collapsed && !mobileOpen && (
      <Link
        to="/client/dashboard"
        onClick={closeMobile}
        title="FLEETROVA Dashboard"
        aria-label="FLEETROVA Dashboard"
        className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-violet-500/10"
      >
        <img
          src="/fleetrova-icon.png"
          alt=""
          className="h-11 w-11 object-contain object-left"
        />
      </Link>
    )}
  </div>

  <button
    type="button"
    onClick={closeMobile}
    aria-label="Close navigation"
    className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white lg:hidden"
  >
    <X size={20} />
  </button>
</div>

        {/* Navigation */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-7">
          <div>
            {(!collapsed || mobileOpen) && (
              <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-600">
                Workspace
              </p>
            )}

            <nav className="space-y-1.5" aria-label="Workspace navigation">
              {workspaceLinks.map(renderLink)}
            </nav>
          </div>

          <div className="my-7 border-t border-white/[0.07]" />

          <div>
            {(!collapsed || mobileOpen) && (
              <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-600">
                Account
              </p>
            )}

            <nav className="space-y-1.5" aria-label="Account navigation">
              {accountLinks.map(renderLink)}
            </nav>
          </div>
        </div>

        {/* Bottom */}
        <div className="shrink-0 space-y-3 border-t border-white/[0.08] p-3">

          {/* Collapse button */}
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] py-2.5 text-xs font-medium text-gray-500 transition hover:bg-white/[0.05] hover:text-white lg:flex"
          >
            {collapsed ? (
              <ChevronRight size={17} />
            ) : (
              <>
                <ChevronLeft size={17} />
                Collapse Sidebar
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

function ClientAvatar({ client }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [client?.photo_url]);
  const initials = (client?.name || "Client").trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  return <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-violet-600 text-xs font-semibold text-white">{client?.photo_url && !failed ? <img src={client.photo_url} onError={() => setFailed(true)} alt="" className="h-full w-full object-cover" /> : initials}</span>;
}

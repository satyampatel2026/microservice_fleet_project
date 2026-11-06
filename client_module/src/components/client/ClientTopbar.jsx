
import { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Menu,
  Search,
  ChevronDown,
  ChevronRight,
  UserRound,
  Settings,
  LogOut,
  X,
} from "lucide-react";

import { logoutClient } from "../../services/clientService";

const pageTitles = {
  dashboard: "Overview",
  services: "Explore Services",
  bookings: "My Bookings",
  profile: "My Profile",
  settings: "Settings",
};

export default function ClientTopbar({ setMobileOpen, client }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const logoutLock = useRef(false);

  const handleLogout = async () => {
    if (logoutLock.current) return;
    logoutLock.current = true;
    setLoggingOut(true);
    setLogoutError("");

    try {
      // Backend client_token cookie clear karega.
      await logoutClient();
      setProfileOpen(false);
      navigate("/", { replace: true });
    } catch (error) {
      setLogoutError(error.message);
    } finally {
      logoutLock.current = false;
      setLoggingOut(false);
    }
  };
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const pageKey = location.pathname.split("/")[2] || "dashboard";
  const pageTitle = pageTitles[pageKey] || "Dashboard";

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0d1019]/95 backdrop-blur-xl">
      <div className="flex h-20 items-center justify-between gap-4 px-5 sm:px-8">
        {/* Left */}
        <div className="flex min-w-0 items-center gap-4">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open sidebar"
            className="rounded-xl border border-white/10 p-2.5 text-gray-300 transition hover:bg-white/5 lg:hidden"
          >
            <Menu size={20} />
          </button>

          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Workspace</span>
              <ChevronRight size={13} />
              <span className="text-violet-300">{pageTitle}</span>
            </div>

            <h1 className="mt-1 truncate text-xl font-semibold tracking-tight text-white">
              {pageTitle}
            </h1>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Search - visual demo */}
          <div className="hidden items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-gray-500 xl:flex">
            <Search size={17} />
            <span>Search workspace...</span>
            <span className="ml-7 rounded-md border border-white/10 px-1.5 py-0.5 text-[10px]">
              Soon
            </span>
          </div>

          <button
            type="button"
            onClick={() => setSearchOpen((value) => !value)}
            aria-label="Toggle search information"
            aria-expanded={searchOpen}
            className="rounded-xl p-2.5 text-gray-400 transition hover:bg-white/5 hover:text-white xl:hidden"
          >
            {searchOpen ? <X size={20} /> : <Search size={20} />}
          </button>

          <button
            type="button"
            disabled
            title="Notifications coming soon"
            aria-label="Notifications coming soon"
            className="cursor-not-allowed rounded-xl p-2.5 text-gray-500"
          >
            <Bell size={20} />
          </button>

          <div className="h-8 w-px bg-white/10" />

          {/* Profile dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((value) => !value)}
              aria-expanded={profileOpen}
              aria-label="Open profile menu"
              className="flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-white/5"
            >
              <ClientAvatar client={client} />

              <span className="hidden text-left md:block">
                <span className="block text-sm font-semibold text-white">
                  {client?.name || "Client"}
                </span>
                <span className="block text-xs text-gray-500">
                  My Account
                </span>
              </span>

              <ChevronDown
                size={16}
                className="hidden text-gray-500 md:block"
              />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-14 z-50 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#171b29] p-2 shadow-2xl shadow-black/40">
                <div className="border-b border-white/10 px-3 py-3">
                  <p className="text-sm font-semibold text-white">
                    {client?.name || "Client Account"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Client workspace
                  </p>
                </div>

                <Link
                  to="/client/profile"
                  onClick={() => setProfileOpen(false)}
                  className="mt-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-gray-300 transition hover:bg-white/5 hover:text-white"
                >
                  <UserRound size={17} />
                  My Profile
                </Link>

                <Link
                  to="/client/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-gray-300 transition hover:bg-white/5 hover:text-white"
                >
                  <Settings size={17} />
                  Settings
                </Link>

                <Link
                  to="/"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-gray-300 transition hover:bg-white/5 hover:text-white"
                >
                  <LogOut size={17} />
                  Back to Website
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="mt-1 flex w-full items-center gap-3 rounded-xl border-t border-white/10 px-3 py-3 text-left text-sm text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <LogOut size={17} />
                  {loggingOut ? "Logging out..." : "Logout"}
                </button>
                {logoutError && (
                  <p role="alert" className="px-3 py-2 text-xs text-red-300">
                    {logoutError}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-white/10 px-5 py-3 text-sm text-gray-400 xl:hidden">
          Workspace search will be available in a future update.
        </div>
      )}
    </header>
  );
}

function ClientAvatar({ client }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [client?.photo_url]);
  const initials = (client?.name || "Client").trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  return <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-violet-600 text-xs font-semibold text-white">{client?.photo_url && !failed ? <img src={client.photo_url} onError={() => setFailed(true)} alt="" className="h-full w-full object-cover" /> : initials}</span>;
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBell,
  FiCalendar,
  FiChevronDown,
  FiLogOut,
  FiMenu,
  FiSearch,
  FiSettings,
  FiUser,
} from "react-icons/fi";

export default function Navbar({ onMenuClick }) {
  const [profileOpen, setProfileOpen] = useState(false);

  const currentDate = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());

   const navigate = useNavigate();
const handleLogout = async () => {
  try {
    const response = await fetch(
      "http://localhost:5000/api/admin/logout",
      {
        method: "POST",
        credentials: "include",
      }
    );

    const data = await response.json();

    if (response.ok && data.success) {
      setProfileOpen(false);
      navigate("/admin/adminlogin", { replace: true });
    } else {
      alert(data.message || "Logout failed");
    }
  } catch (error) {
    console.error("Logout Error:", error);
    alert("Logout failed");
  }
};
  return (
    <header className="sticky top-0 z-40 h-16 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
      <div className="flex h-full items-center justify-between gap-4 px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Open sidebar"
          >
            <FiMenu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <h6 className="truncate text-base font-bold text-slate-900 dark:text-white sm:text-lg">
              Admin Dashboard
            </h6>

            <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
              Fleet Management System
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="hidden max-w-md flex-1 md:block">
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              placeholder="Search users, vehicles, drivers..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-500 dark:focus:bg-slate-900 dark:focus:ring-indigo-900/40"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Date */}
          <div className="hidden items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300 xl:flex">
            <FiCalendar className="h-4 w-4 text-indigo-500" />
            {currentDate}
          </div>

          {/* Mobile Search */}
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
            aria-label="Search"
          >
            <FiSearch className="h-5 w-5" />
          </button>

          {/* Notification */}
          <button
            type="button"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Notifications"
          >
            <FiBell className="h-5 w-5" />

            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
          </button>

          {/* Profile */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((value) => !value)}
              className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white shadow-md shadow-indigo-200 dark:shadow-none">
                A
              </div>

              <div className="hidden text-left lg:block">
                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                  Admin
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Super Admin
                </p>
              </div>

              <FiChevronDown
                className={`hidden h-4 w-4 text-slate-500 transition-transform lg:block ${
                  profileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">
                    Administrator
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    admin@example.com
                  </p>
                </div>

                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <FiUser className="h-4 w-4" />
                  My Profile
                </button>

                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <FiSettings className="h-4 w-4" />
                  Settings
                </button>

                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                <button onClick={handleLogout}
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <FiLogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
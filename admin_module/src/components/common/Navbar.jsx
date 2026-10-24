
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
  FiMoon,
  FiSun,
} from "react-icons/fi";
import Swal from "sweetalert2";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
});

export default function Navbar({
  onMenuClick,
  dark,
  onToggleTheme,
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  const currentDate = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to logout?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Logout",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#7c3aed",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(
        "http://localhost:5000/api/admin/logout",
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        Toast.fire({
          icon: "error",
          title: data.message || "Logout failed",
        });
        return;
      }

      setProfileOpen(false);

      await Toast.fire({
        icon: "success",
        title: data.message || "Logged out successfully",
        timer: 1200,
      });

      navigate("/admin/adminlogin", { replace: true });
    } catch (error) {
      console.error("Logout Error:", error);

      Toast.fire({
        icon: "error",
        title: "Unable to logout. Please try again.",
      });
    }
  };

  const iconButton =
    "relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-all duration-200 hover:bg-violet-50 hover:text-violet-600 dark:text-slate-400 dark:hover:bg-white/[0.07] dark:hover:text-violet-300";

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#10131e]/95">
      <div className="flex h-full items-center justify-between gap-4 px-4 md:px-6">

        {/* Left */}
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open sidebar"
            className={`${iconButton} lg:hidden`}
          >
            <FiMenu size={19} />
          </button>

          <span className="hidden text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-200 sm:block">
            Admin Panel
          </span>
        </div>

        {/* Search */}
        <div className="hidden w-full max-w-sm md:block">
          <div className="relative">
            <FiSearch
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              placeholder="Search..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/80 pl-9 pr-3 text-xs text-slate-700 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-violet-500"
            />
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1 sm:gap-2">

          {/* Date */}
          <div className="mr-2 hidden items-center gap-2 text-xs text-slate-500 dark:text-slate-400 xl:flex">
            <FiCalendar size={15} />
            {currentDate}
          </div>

          {/* Mobile search */}
          <button
            type="button"
            aria-label="Search"
            className={`${iconButton} md:hidden`}
          >
            <FiSearch size={18} />
          </button>

          {/* Theme toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            className={iconButton}
          >
            {dark ? (
              <FiSun size={18} />
            ) : (
              <FiMoon size={18} />
            )}
          </button>

          {/* Notifications */}
          <button
            type="button"
            aria-label="Notifications"
            className={iconButton}
          >
            <FiBell size={18} />
            <span className="absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full bg-violet-500 ring-2 ring-white dark:ring-[#10131e]" />
          </button>

          <div className="mx-1 hidden h-6 w-px bg-slate-200 dark:bg-white/10 sm:block" />

          {/* Admin Profile */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              aria-expanded={profileOpen}
              aria-label="Admin profile"
              className="flex items-center gap-2 rounded-lg p-1 transition hover:bg-slate-100 dark:hover:bg-white/[0.06]"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white">
                A
              </div>

              <div className="hidden text-left lg:block">
                <p className="text-xs font-semibold leading-4 text-slate-800 dark:text-slate-100">
                  Admin
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Super Admin
                </p>
              </div>

              <FiChevronDown
                size={14}
                className={`hidden text-slate-400 transition-transform lg:block ${
                  profileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full z-50 mt-3 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-2 shadow-xl shadow-black/10 dark:border-white/10 dark:bg-[#171b2a] dark:shadow-black/30">
                <div className="border-b border-slate-100 px-4 py-3 dark:border-white/10">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">
                    Administrator
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    admin@example.com
                  </p>
                </div>

                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-600 transition hover:bg-violet-50 hover:text-violet-600 dark:text-slate-300 dark:hover:bg-white/[0.05] dark:hover:text-violet-300"
                >
                  <FiUser size={16} />
                  My Profile
                </button>

                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-600 transition hover:bg-violet-50 hover:text-violet-600 dark:text-slate-300 dark:hover:bg-white/[0.05] dark:hover:text-violet-300"
                >
                  <FiSettings size={16} />
                  Settings
                </button>

                <div className="my-1 border-t border-slate-100 dark:border-white/10" />

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  <FiLogOut size={16} />
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

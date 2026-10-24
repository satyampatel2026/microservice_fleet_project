
import { Link, NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  UsersRound,
  Layers3,
  ShieldCheck,
  Handshake,
  FolderKanban,
  ChevronRight,
  ChevronDown,
  X,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

const navItems = [
  {
    to: "/admin/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    to: "/admin/adminuser",
    label: "User Management",
    icon: UsersRound,
  },
  {
    to: "/admin/department",
    label: "Department",
    icon: Layers3,
  },
  {
    to: "/admin/roles",
    label: "Roles",
    icon: ShieldCheck,
  },
  {
    label: "Service Management",
    icon: FolderKanban,
    children: [
      {
        to: "/admin/categories",
        label: "Categories",
      },
      {
        to: "/admin/services",
        label: "Services",
      },
    ],
  },
  {
    to: "/admin/partnerspage",
    label: "Partners Management",
    icon: Handshake,
  },
  {
    to: "/admin/kycpage",
    label: "Partners KYC",
    icon: ShieldCheck,
  },
];

export default function AdminSidebar({ open, onClose }) {
  const [openMenus, setOpenMenus] = useState({});

  return (
    <>
      {/* Desktop sidebar */}
      <div className="fixed inset-y-0 left-0 z-30 hidden lg:block">
        <SidebarContent
          openMenus={openMenus}
          setOpenMenus={setOpenMenus}
          onClose={onClose}
        />
      </div>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm lg:hidden"
            />

            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              className="fixed inset-y-0 left-0 z-[70] w-72 lg:hidden"
            >
              <SidebarContent
                openMenus={openMenus}
                setOpenMenus={setOpenMenus}
                onClose={onClose}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function SidebarContent({ openMenus, setOpenMenus, onClose }) {
  const location = useLocation();

  const isServicesActive = navItems
    .find((item) => item.label === "Service Management")
    ?.children?.some((child) => location.pathname === child.to);

  const servicesOpen =
    openMenus["Service Management"] ?? isServicesActive;

  const toggleMenu = (label) => {
    setOpenMenus((prev) => ({
      ...prev,
      [label]: !(prev[label] ?? isServicesActive),
    }));
  };

  return (
    <aside className="flex h-full w-72 flex-col border-r border-white/[0.08] bg-[#10131e] text-white shadow-2xl shadow-black/20">
      {/* Brand header */}
      <div className="flex h-24 shrink-0 items-center justify-between gap-2 border-b border-white/[0.08] px-5">
        <Link
          to="/admin/dashboard"
          onClick={onClose}
          aria-label="FLEETROVA Admin Dashboard"
          className="flex min-w-0 flex-1 flex-col items-start justify-center"
        >
          <img
            src="/fleetrova-logo.png"
            alt="FLEETROVA"
            className="h-14 max-w-full object-contain object-left"
          />

          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-300/70">
            Enterprise Admin
          </span>
        </Link>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close sidebar"
          className="rounded-lg p-2 text-gray-400 transition hover:bg-white/10 hover:text-white lg:hidden"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-7">
        <p className="mb-4 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
          Workspace
        </p>

        <nav className="space-y-1.5" aria-label="Admin navigation">
          {navItems.map((item) => {
            const Icon = item.icon;

            if (item.children) {
              const isOpen =
                item.label === "Service Management"
                  ? servicesOpen
                  : openMenus[item.label];

              const childActive = item.children.some(
                (child) => location.pathname === child.to
              );

              return (
                <div key={item.label}>
                  <button
                    type="button"
                    onClick={() => toggleMenu(item.label)}
                    aria-expanded={Boolean(isOpen)}
                    className={`group flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200 ${
                      childActive
                        ? "bg-violet-500/15 text-violet-200"
                        : "text-gray-400 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <Icon
                        size={20}
                        strokeWidth={1.8}
                        className="shrink-0"
                      />
                      <span className="truncate">{item.label}</span>
                    </span>

                    {isOpen ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-6 mt-2 space-y-1 border-l border-white/10 pl-4">
                          {item.children.map((child) => (
                            <NavLink
                              key={child.to}
                              to={child.to}
                              onClick={onClose}
                              className={({ isActive }) =>
                                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                                  isActive
                                    ? "bg-violet-500/15 font-medium text-violet-200"
                                    : "text-gray-500 hover:bg-white/[0.05] hover:text-white"
                                }`
                              }
                            >
                              {({ isActive }) => (
                                <>
                                  <span
                                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                      isActive
                                        ? "bg-violet-400"
                                        : "bg-gray-600"
                                    }`}
                                  />
                                  {child.label}
                                </>
                              )}
                            </NavLink>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
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

                    <span className="min-w-0 flex-1 truncate">
                      {item.label}
                    </span>

                    {isActive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

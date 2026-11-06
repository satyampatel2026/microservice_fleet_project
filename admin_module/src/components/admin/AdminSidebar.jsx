import { Link, NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, UsersRound, Layers3, ShieldCheck, Handshake, FolderKanban, ChevronRight, ChevronDown, X, MapPin } from "lucide-react";
const navItems = [{
  to: "/admin/dashboard",
  label: "Dashboard",
  icon: LayoutDashboard
}, {
  to: "/admin/department",
  label: "Department",
  icon: Layers3
}, {
  to: "/admin/roles",
  label: "Roles",
  icon: ShieldCheck
}, {
  to: "/admin/adminuser",
  label: "User Management",
  icon: UsersRound
}, {
  label: "Service Management",
  icon: FolderKanban,
  children: [{
    to: "/admin/categories",
    label: "Categories"
  }, {
    to: "/admin/services",
    label: "Services"
  }]
}, {
  to: "/admin/partnerspage",
  label: "Partners Management",
  icon: Handshake
}, {
  to: "/admin/clients",
  label: "Clients Management",
  icon: UsersRound
},{
  to: "/admin/tracking",
  label: "Vehicle Tracking",
  icon: MapPin,
},];
export default function AdminSidebar({
  open,
  onClose
}) {
  const [openMenus, setOpenMenus] = useState({});
  return <>
     {/* Desktop sidebar */}
<div className="fixed inset-y-0 left-0 z-30 hidden h-dvh w-72 lg:block">
  <SidebarContent openMenus={openMenus} setOpenMenus={setOpenMenus} onClose={onClose} />
</div>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {open && <>
            <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} exit={{
          opacity: 0
        }} onClick={onClose} className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm lg:hidden" />

            <motion.div initial={{
          x: "-100%"
        }} animate={{
          x: 0
        }} exit={{
          x: "-100%"
        }} transition={{
          type: "spring",
          stiffness: 300,
          damping: 30
        }} className="fixed inset-y-0 left-0 z-[70] w-72 lg:hidden">
              <SidebarContent openMenus={openMenus} setOpenMenus={setOpenMenus} onClose={onClose} />
            </motion.div>
          </>}
      </AnimatePresence>
    </>;
}
function SidebarContent({
  openMenus,
  setOpenMenus,
  onClose
}) {
  const location = useLocation();
  const isServicesActive = navItems.find(item => item.label === "Service Management")?.children?.some(child => location.pathname === child.to);
  const servicesOpen = openMenus["Service Management"] ?? isServicesActive;
  const toggleMenu = label => {
    setOpenMenus(prev => ({
      ...prev,
      [label]: !(prev[label] ?? isServicesActive)
    }));
  };
  return <aside className="theme-sidebar flex h-full w-72 flex-col overflow-hidden border-r shadow-sm">
      {/* Brand header */}
      <div className="flex h-24 shrink-0 items-center justify-between gap-2 border-b border-white/[0.08] px-5">
        <Link to="/admin/dashboard" onClick={onClose} aria-label="FLEETROVA Admin Dashboard" className="flex min-w-0 flex-1 flex-col items-start justify-center">
          <img src="/fleetrova-logo.png" alt="FLEETROVA" className="h-14 max-w-full object-contain object-left" />
        </Link>

        <button type="button" onClick={onClose} aria-label="Close sidebar" className="rounded-lg p-2 text-gray-400 transition hover:bg-white/10 hover:text-white lg:hidden">
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-7">
        <p className="mb-4 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
          Workspace
        </p>

        <nav className="space-y-1.5" aria-label="Admin navigation">
          {navItems.map(item => {
          const Icon = item.icon;
          if (item.children) {
            const isOpen = item.label === "Service Management" ? servicesOpen : openMenus[item.label];
            const childActive = item.children.some(child => location.pathname === child.to);
            return <div key={item.label}>
                  <button type="button" onClick={() => toggleMenu(item.label)} aria-expanded={Boolean(isOpen)} className={`group flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200 ${childActive ? "theme-nav-active" : "theme-nav-link"}`}>
                    <span className="flex min-w-0 items-center gap-3">
                      <Icon size={20} strokeWidth={1.8} className="shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </span>

                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && <motion.div initial={{
                  height: 0,
                  opacity: 0
                }} animate={{
                  height: "auto",
                  opacity: 1
                }} exit={{
                  height: 0,
                  opacity: 0
                }} transition={{
                  duration: 0.2
                }} className="overflow-hidden">
                        <div className="ml-6 mt-2 space-y-1 border-l border-white/10 pl-4">
                          {item.children.map(child => <NavLink key={child.to} to={child.to} onClick={onClose} className={({
                      isActive
                    }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${isActive ? "theme-nav-active font-medium" : "theme-nav-link"}`}>
                              {({
                        isActive
                      }) => <>
                                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${isActive ? "theme-nav-dot" : "bg-gray-600"}`} />
                                  {child.label}
                                </>}
                            </NavLink>)}
                        </div>
                      </motion.div>}
                  </AnimatePresence>
                </div>;
          }
          return <NavLink key={item.to} to={item.to} onClick={onClose} className={({
            isActive
          }) => `group relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200 ${isActive ? "theme-nav-active" : "theme-nav-link"}`}>
                {({
              isActive
            }) => <>
                    {isActive && <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full theme-nav-dot" />}

                    <Icon size={20} strokeWidth={1.8} className={`shrink-0 ${isActive ? "text-white" : ""}`} />

                    <span className="min-w-0 flex-1 truncate">
                      {item.label}
                    </span>

                    {isActive && <span className="h-1.5 w-1.5 rounded-full theme-nav-dot" />}
                  </>}
              </NavLink>;
        })}
        </nav>
      </div>
    </aside>;
}

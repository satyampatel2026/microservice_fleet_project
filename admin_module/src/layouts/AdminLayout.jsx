
import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import AdminSidebar from "../components/admin/AdminSidebar";
import Navbar from "../components/common/Navbar";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("theme") === "dark"; } catch { return false; }
  });

  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try { localStorage.setItem("theme", dark ? "dark" : "light"); } catch { /* Mode current page par phir bhi kaam karega. */ }
  }, [dark]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="admin-theme theme-workspace relative h-dvh overflow-hidden transition-colors duration-300">
      {/* Sidebar */}
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main workspace */}
      <div className="relative flex h-full min-h-0 flex-col overflow-hidden lg:pl-72">
        {/* Top navigation */}
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          dark={dark}
          onToggleTheme={() => setDark((value) => !value)}
        />

        {/* Page content */}
        <main className="relative min-h-0 w-full flex-1 overflow-y-auto overscroll-contain px-4 pb-8 pt-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1600px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{
                  duration: 0.2,
                  ease: "easeOut",
                }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}


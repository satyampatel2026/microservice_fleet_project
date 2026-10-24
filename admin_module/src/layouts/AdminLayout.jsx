
import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import AdminSidebar from "../components/admin/AdminSidebar";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [dark, setDark] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen bg-[#f5f7fb] text-slate-900 transition-colors duration-300 dark:bg-[#090b12] dark:text-slate-100">
      {/* Subtle background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-40 top-10 h-[450px] w-[450px] rounded-full bg-violet-500/[0.035] blur-[120px] dark:bg-violet-600/[0.07]" />
        <div className="absolute -left-40 bottom-0 h-[400px] w-[400px] rounded-full bg-indigo-500/[0.025] blur-[120px] dark:bg-indigo-600/[0.05]" />
      </div>

      {/* Sidebar */}
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main workspace */}
      <div className="relative flex min-h-screen flex-col lg:pl-72">
        {/* Top navigation */}
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          dark={dark}
          onToggleTheme={() => setDark((value) => !value)}
        />

        {/* Page content */}
        <main className="relative w-full flex-1 px-4 pb-8 pt-6 sm:px-6 lg:px-8 lg:py-8">
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

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}

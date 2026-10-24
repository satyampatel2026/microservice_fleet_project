
import { useState } from "react";
import { Outlet } from "react-router-dom";

import ClientSidebar from "./ClientSidebar";
import ClientTopbar from "./ClientTopbar";
import ClientFooter from "./ClientFooter";

export default function ClientLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#090b12] text-white">
      <ClientSidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <div
        className={`flex min-h-screen flex-col transition-all duration-300 ${
          collapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        <ClientTopbar setMobileOpen={setMobileOpen} />

        <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:px-8">
          <Outlet />
        </main>

        <ClientFooter />
      </div>
    </div>
  );
}

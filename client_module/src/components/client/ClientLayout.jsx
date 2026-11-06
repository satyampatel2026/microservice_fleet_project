
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import ClientSidebar from "./ClientSidebar";
import ClientTopbar from "./ClientTopbar";

import { getClientProfile } from "../../services/clientService";

export default function ClientLayout() {
  const [client, setClient] = useState(null);
  useEffect(() => {
    let cancelled = false;
    let changed = false;
    getClientProfile().then((result) => { if (!cancelled && !changed) setClient(result.data); })
      .catch((error) => console.error("Client profile:", error.message));
    const update = (event) => { changed = true; setClient(event.detail); };
    window.addEventListener("client-profile-updated", update);
    
    return () => { cancelled = true; window.removeEventListener("client-profile-updated", update); };
  }, []);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#090b12] text-white lg:h-[100dvh] lg:min-h-0 lg:overflow-hidden">
      <ClientSidebar
        client={client}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <div
        className={`flex min-h-screen min-w-0 flex-col transition-all duration-300 lg:h-[100dvh] lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain ${
          collapsed ? "lg:ml-[84px]" : "lg:ml-64"
        }`}
      >
        <ClientTopbar client={client} setMobileOpen={setMobileOpen} />

        <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-4 sm:px-8">
          <Outlet />
        </main>

      </div>
    </div>
  );
}

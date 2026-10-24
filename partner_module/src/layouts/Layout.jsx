
import { useState } from "react";
import Sidebar from "../components/sidebar";
import Navbar from "../components/navbar";
import Footer from "../components/footer";

const Layout = ({ children, activePath }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F5F8F7]">
      {/* SIDEBAR */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activePath={activePath}
      />

      {/* MAIN AREA */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* NAVBAR */}
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* PAGE CONTENT */}
        <main className="relative flex-1 px-3 py-4 sm:px-4 md:px-5 md:py-5 lg:px-6">
          {children}
        </main>

        {/* FOOTER */}
        <Footer />
      </div>
    </div>
  );
};

export default Layout;

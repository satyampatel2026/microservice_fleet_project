import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import Services from "./components/Services";
import HowItWorks from "./components/HowItWorks";
import CTA from "./components/CTA";
import Footer from "./components/Footer";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ClientLayout from "./components/client/ClientLayout";
import ClientDashboard from "./pages/client/ClientDashboard";
import About from "./components/About";
import Contact from "./components/Contact";
import ClientProtectedRoute from "./components/client/ClientProtectedRoute";
import PrivacyPolicy from "./components/client/PrivacyPolicy";
import Login from "./pages/Login";
import ClientProfile from "./pages/client/ClientProfile";
import MobileTracking from "./pages/MobileTracking";
import ClientVehicles from "./pages/client/ClientVehicles";
import ClientDrivers from "./pages/client/ClientDrivers";
import VehicleTracking from "./pages/client/VehicleTracking";
import ClientTrips from "./pages/client/ClientTrips";

function Home() {
  return (
    <div className="min-h-screen bg-[#090b12]">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Services />
        <HowItWorks />
        <About />
         <Contact />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/track/:sessionId" element={<MobileTracking />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route element={<ClientProtectedRoute />}>
  <Route path="/client" element={<ClientLayout />}>
    <Route path="dashboard" element={<ClientDashboard />} />
      <Route path="profile" element={<ClientProfile />} />
      <Route path="vehicles" element={<ClientVehicles />} />
      <Route path="tracking" element={<VehicleTracking />} />
      <Route path="drivers" element={<ClientDrivers/>}/>
      <Route path="trips"  element={<ClientTrips/>}/>
  </Route>
</Route>

      </Routes>
    </BrowserRouter>
  );
}
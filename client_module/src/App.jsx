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

import Login from "./pages/Login";

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
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/client" element={<ClientLayout />}>
  <Route path="dashboard" element={<ClientDashboard />} />
</Route>
      </Routes>
    </BrowserRouter>
  );
}
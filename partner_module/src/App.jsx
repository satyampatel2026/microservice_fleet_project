import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import ForgotPassword from "./pages/ForgotPassword";
import PartnerKyc from "./pages/PartnerKyc";
import MyServices from "./pages/MyServices";
import Employees from "./pages/Employees";

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected Routes (Inke andar jo bhi pages honge, sab par ProtectedRoute chalega) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/partner/kyc" element={<PartnerKyc />} /> {/* KYC ko bhi yahan shift kar diya */}
        <Route path="/partner/services" element={<MyServices />} />
        <Route path="/partner/employees" element={<Employees />} />
      </Route>

      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
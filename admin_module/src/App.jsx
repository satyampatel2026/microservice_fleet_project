import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUser from "./pages/admin/AdminUser";
import Department from "./pages/admin/Department";
import Roles from "./pages/admin/Roles";
import PartnersPage from "./pages/partners/PartnersPage";
import Login from "./pages/admin/Login";
import Categories from "./pages/admin/Categories";
import Services from "./pages/admin/Services";
import ClientsPage from "./pages/clients/ClientsPage";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminTracking from "./pages/clients/AdminTracking";

function App() {
  return <Routes>
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin/adminlogin" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="adminuser" element={<AdminUser />} />
          <Route path="department" element={<Department />} />
          <Route path="roles" element={<Roles />} />
          <Route path="partnerspage" element={<PartnersPage />} />
          <Route path="categories" element={<Categories />} />
          <Route path="services" element={<Services />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="tracking" element={<AdminTracking/>}/>
          <Route path="verification" element={<Navigate to="/admin/clients" replace />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/admin/adminlogin" replace />} />
    </Routes>;
}
export default App;

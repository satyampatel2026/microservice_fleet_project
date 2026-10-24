import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUser from "./pages/admin/AdminUser";
import Department from "./pages/admin/Department";
import Roles from "./pages/admin/Roles";
import PartnersPage from "./pages/partners/PartnersPage";
import KycPage from "./pages/partners/KycPage";
import Login from "./pages/admin/Login";
import Categories from "./pages/admin/Categories";
import Services from "./pages/admin/Services";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
       <Route path="/admin/adminlogin" element={<Login />} />
      
      <Route element={<ProtectedRoute />}>
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="adminuser" element={<AdminUser />} />
        <Route path="department" element={<Department />} />
        <Route path="roles" element={<Roles />} />
        <Route path="partnerspage" element={<PartnersPage/>}/>
        <Route path="Kycpage" element={<KycPage/>}/>
        <Route path="categories" element={<Categories />} />
        <Route path="services" element={<Services />} />
      </Route>
      </Route>
      <Route path="*" element={<Navigate to="/admin/adminlogin" replace />}/>
    </Routes>
  );
}

export default App;
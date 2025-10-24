import { Routes, Route } from 'react-router-dom';
import { AdminLayout } from '@/layouts/AdminLayout';
import DashboardHome from './DashboardHome';

const AdminDashboard = () => {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<DashboardHome />} />
      </Route>
    </Routes>
  );
};

export default AdminDashboard;

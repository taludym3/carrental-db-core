import { Routes, Route } from 'react-router-dom';
import { AdminLayout } from '@/layouts/AdminLayout';
import DashboardHome from './DashboardHome';
import UsersList from './users/UsersList';
import UsersAdd from './users/UsersAdd';
import UserDetails from './users/UserDetails';
import UserEdit from './users/UserEdit';

const AdminDashboard = () => {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="users" element={<UsersList />} />
        <Route path="users/add" element={<UsersAdd />} />
        <Route path="users/:id" element={<UserDetails />} />
        <Route path="users/:id/edit" element={<UserEdit />} />
      </Route>
    </Routes>
  );
};

export default AdminDashboard;

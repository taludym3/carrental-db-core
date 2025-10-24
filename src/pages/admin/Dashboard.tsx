import { Routes, Route } from 'react-router-dom';
import { AdminLayout } from '@/layouts/AdminLayout';
import DashboardHome from './DashboardHome';
import UsersList from './users/UsersList';
import UsersAdd from './users/UsersAdd';
import UserDetails from './users/UserDetails';
import UserEdit from './users/UserEdit';
import BrandsList from './brands/BrandsList';
import BrandsAdd from './brands/BrandsAdd';
import BrandDetails from './brands/BrandDetails';
import BrandEdit from './brands/BrandEdit';
import ModelsList from './models/ModelsList';
import ModelsAdd from './models/ModelsAdd';
import ModelDetails from './models/ModelDetails';
import ModelEdit from './models/ModelEdit';

const AdminDashboard = () => {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="users" element={<UsersList />} />
        <Route path="users/add" element={<UsersAdd />} />
        <Route path="users/:id" element={<UserDetails />} />
        <Route path="users/:id/edit" element={<UserEdit />} />
        <Route path="brands" element={<BrandsList />} />
        <Route path="brands/add" element={<BrandsAdd />} />
        <Route path="brands/:id" element={<BrandDetails />} />
        <Route path="brands/:id/edit" element={<BrandEdit />} />
        <Route path="models" element={<ModelsList />} />
        <Route path="models/add" element={<ModelsAdd />} />
        <Route path="models/:id" element={<ModelDetails />} />
        <Route path="models/:id/edit" element={<ModelEdit />} />
      </Route>
    </Routes>
  );
};

export default AdminDashboard;

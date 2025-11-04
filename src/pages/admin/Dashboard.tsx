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
import ColorsList from './colors/ColorsList';
import ColorsAdd from './colors/ColorsAdd';
import ColorDetails from './colors/ColorDetails';
import ColorEdit from './colors/ColorEdit';
import CarsList from './cars/CarsList';
import CarsAdd from './cars/CarsAdd';
import CarDetails from './cars/CarDetails';
import CarEdit from './cars/CarEdit';
import FeaturesList from './features/FeaturesList';
import FeaturesAdd from './features/FeaturesAdd';
import FeatureDetails from './features/FeatureDetails';
import FeatureEdit from './features/FeatureEdit';
import BookingsList from './bookings/BookingsList';
import BookingDetails from './bookings/BookingDetails';
import DocumentsList from './documents/DocumentsList';
import DocumentDetails from './documents/DocumentDetails';
import AnnouncementsList from './announcements/AnnouncementsList';
import AnnouncementsAdd from './announcements/AnnouncementsAdd';
import AnnouncementDetails from './announcements/AnnouncementDetails';
import AnnouncementEdit from './announcements/AnnouncementEdit';
import BranchesList from './branches/BranchesList';
import BranchesAdd from './branches/BranchesAdd';
import BranchDetails from './branches/BranchDetails';
import BranchEdit from './branches/BranchEdit';

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
        <Route path="colors" element={<ColorsList />} />
        <Route path="colors/add" element={<ColorsAdd />} />
        <Route path="colors/:id" element={<ColorDetails />} />
        <Route path="colors/:id/edit" element={<ColorEdit />} />
        <Route path="features" element={<FeaturesList />} />
        <Route path="features/add" element={<FeaturesAdd />} />
        <Route path="features/:id" element={<FeatureDetails />} />
        <Route path="features/:id/edit" element={<FeatureEdit />} />
        <Route path="cars" element={<CarsList />} />
        <Route path="cars/add" element={<CarsAdd />} />
        <Route path="cars/:id" element={<CarDetails />} />
        <Route path="cars/:id/edit" element={<CarEdit />} />
          <Route path="bookings" element={<BookingsList />} />
          <Route path="bookings/:id" element={<BookingDetails />} />
          
          <Route path="documents" element={<DocumentsList />} />
          <Route path="documents/:id" element={<DocumentDetails />} />
          
          <Route path="announcements" element={<AnnouncementsList />} />
          <Route path="announcements/add" element={<AnnouncementsAdd />} />
          <Route path="announcements/:id" element={<AnnouncementDetails />} />
          <Route path="announcements/:id/edit" element={<AnnouncementEdit />} />
          
          <Route path="branches" element={<BranchesList />} />
          <Route path="branches/add" element={<BranchesAdd />} />
          <Route path="branches/:id" element={<BranchDetails />} />
          <Route path="branches/:id/edit" element={<BranchEdit />} />
      </Route>
    </Routes>
  );
};

export default AdminDashboard;

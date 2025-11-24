import { Routes, Route } from 'react-router-dom';
import { BranchLayout } from '@/layouts/BranchLayout';
import BranchDashboardHome from './branch/BranchDashboardHome';
import BranchCarsList from './branch/cars/BranchCarsList';
import BranchCarDetails from './branch/cars/BranchCarDetails';
import BranchCarsAdd from './branch/cars/BranchCarsAdd';
import BranchCarEdit from './branch/cars/BranchCarEdit';
import BranchBookingsList from './branch/bookings/BranchBookingsList';
import BranchBookingDetails from './branch/bookings/BranchBookingDetails';
import BranchDocumentsList from './branch/documents/BranchDocumentsList';
import BranchDocumentDetails from './branch/documents/BranchDocumentDetails';
import BranchNotificationsList from './branch/notifications/BranchNotificationsList';

const BranchDashboard = () => {
  return (
    <Routes>
      <Route element={<BranchLayout />}>
        <Route index element={<BranchDashboardHome />} />
        <Route path="cars" element={<BranchCarsList />} />
        <Route path="cars/add" element={<BranchCarsAdd />} />
        <Route path="cars/:id" element={<BranchCarDetails />} />
        <Route path="cars/:id/edit" element={<BranchCarEdit />} />
        <Route path="bookings" element={<BranchBookingsList />} />
        <Route path="bookings/:id" element={<BranchBookingDetails />} />
        <Route path="documents" element={<BranchDocumentsList />} />
        <Route path="documents/:id" element={<BranchDocumentDetails />} />
        <Route path="notifications" element={<BranchNotificationsList />} />
      </Route>
    </Routes>
  );
};

export default BranchDashboard;

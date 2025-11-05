import { Routes, Route } from 'react-router-dom';
import { BranchLayout } from '@/layouts/BranchLayout';
import BranchDashboardHome from './branch/BranchDashboardHome';
import BranchCarsList from './branch/cars/BranchCarsList';
import BranchBookingsList from './branch/bookings/BranchBookingsList';
import BranchDocumentsList from './branch/documents/BranchDocumentsList';
import BranchNotificationsList from './branch/notifications/BranchNotificationsList';

const BranchDashboard = () => {
  return (
    <Routes>
      <Route element={<BranchLayout />}>
        <Route index element={<BranchDashboardHome />} />
        <Route path="cars" element={<BranchCarsList />} />
        <Route path="bookings" element={<BranchBookingsList />} />
        <Route path="documents" element={<BranchDocumentsList />} />
        <Route path="notifications" element={<BranchNotificationsList />} />
      </Route>
    </Routes>
  );
};

export default BranchDashboard;

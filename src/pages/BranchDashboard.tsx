import { Routes, Route } from 'react-router-dom';
import { BranchLayout } from '@/layouts/BranchLayout';
import BranchDashboardHome from './branch/BranchDashboardHome';
import BranchCarsList from './branch/cars/BranchCarsList';
import BranchCarDetails from './branch/cars/BranchCarDetails';
import BranchCarsAdd from './branch/cars/BranchCarsAdd';
import BranchCarEdit from './branch/cars/BranchCarEdit';
import BranchBookingsList from './branch/bookings/BranchBookingsList';
import BranchBookingDetails from './branch/bookings/BranchBookingDetails';
import BranchStaffList from './branch/staff/BranchStaffList';
import BranchNotificationsList from './branch/notifications/BranchNotificationsList';
import BranchReportsDashboard from './branch/reports/BranchReportsDashboard';
import BranchSettings from './branch/settings/BranchSettings';
import Profile from './Profile';

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
        <Route path="staff" element={<BranchStaffList />} />
        <Route path="notifications" element={<BranchNotificationsList />} />
        <Route path="reports" element={<BranchReportsDashboard />} />
        <Route path="settings" element={<BranchSettings />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
};

export default BranchDashboard;

import { Outlet } from 'react-router-dom';
import { BranchSidebar } from '@/components/branch/BranchSidebar';
import { BranchHeader } from '@/components/branch/BranchHeader';

export const BranchLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <BranchHeader onMenuClick={() => {}} />
      <div className="flex">
        <BranchSidebar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

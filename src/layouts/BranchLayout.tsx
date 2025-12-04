import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { BranchSidebar } from '@/components/branch/BranchSidebar';
import { BranchHeader } from '@/components/branch/BranchHeader';

export const BranchLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <BranchHeader onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex">
        <BranchSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 p-6 lg:pr-64">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

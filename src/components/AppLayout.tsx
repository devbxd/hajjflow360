import React from 'react';
import Sidebar from './Sidebar';
import { Toaster } from 'sonner';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 xl:px-10 py-6">
          {children}
        </div>
      </main>
      <Toaster position="bottom-right" richColors />
    </div>
  );
}
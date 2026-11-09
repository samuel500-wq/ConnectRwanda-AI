'use client';
import { usePathname } from 'next/navigation';

export function ClientWrapper({ 
  children, 
  header, 
  footer 
}: { 
  children: React.ReactNode, 
  header: React.ReactNode, 
  footer: React.ReactNode 
}) {
  const pathname = usePathname();
  
  // Check if the current route is part of the admin dashboard
  const isAdmin = pathname?.startsWith('/admin');

  return (
    <>
      {header}
      
      {/* This is the exact main wrapper you originally had */}
      <main className="flex-1 flex flex-col relative w-full">
        {children}
      </main>
      
      {/* This only renders the footer if we are NOT on an admin page */}
      {!isAdmin && footer}
    </>
  );
}
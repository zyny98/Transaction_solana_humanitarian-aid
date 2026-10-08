/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppStoreProvider } from './lib/store/app-store';
import { AppLayout, UserRole } from './app/AppLayout';
import { LandingPage } from './landing/LandingPage';
import DonorPage from './app/donor/page';
import FoundationPage from './app/foundation/page';
import VendorPage from './app/vendor/page';
import AdminPage from './app/admin/page';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname || '/';
    }
    return '/';
  });

  const [activeRole, setActiveRole] = useState<UserRole>('donor');

  // Sync route on mount and browser popstate
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname || '/';
      setCurrentPath(path);

      if (path.includes('/foundation')) {
        setActiveRole('foundation');
      } else if (path.includes('/vendor')) {
        setActiveRole('vendor');
      } else if (path.includes('/admin')) {
        setActiveRole('admin');
      } else if (path.includes('/donor') || path.startsWith('/app')) {
        setActiveRole('donor');
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigateTo = (path: string, role?: UserRole) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
    if (role) {
      setActiveRole(role);
    }
  };

  const handleRoleChange = (role: UserRole) => {
    setActiveRole(role);
    navigateTo(`/app/${role}`);
  };

  const handleLaunchApp = (role: UserRole = 'donor') => {
    setActiveRole(role);
    navigateTo(`/app/${role}`);
  };

  const handleNavigateHome = () => {
    navigateTo('/');
  };

  // Determine whether to show landing or /app
  const isAppRoute = currentPath.startsWith('/app');

  return (
    <AppStoreProvider>
      {!isAppRoute ? (
        <LandingPage onLaunchApp={handleLaunchApp} />
      ) : (
        <AppLayout
          currentRole={activeRole}
          onRoleChange={handleRoleChange}
          onNavigateHome={handleNavigateHome}
        >
          {activeRole === 'donor' && <DonorPage />}
          {activeRole === 'foundation' && <FoundationPage />}
          {activeRole === 'vendor' && <VendorPage />}
          {activeRole === 'admin' && <AdminPage />}
        </AppLayout>
      )}
    </AppStoreProvider>
  );
}

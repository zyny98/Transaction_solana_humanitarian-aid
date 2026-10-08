import React from 'react';
import { AppLayout, UserRole } from './AppLayout';

export default function Layout({
  children,
  currentRole = 'donor',
  onRoleChange = () => {},
  onNavigateHome = () => {},
}: {
  children: React.ReactNode;
  currentRole?: UserRole;
  onRoleChange?: (role: UserRole) => void;
  onNavigateHome?: () => void;
}) {
  return (
    <AppLayout
      currentRole={currentRole}
      onRoleChange={onRoleChange}
      onNavigateHome={onNavigateHome}
    >
      {children}
    </AppLayout>
  );
}

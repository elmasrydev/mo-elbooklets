import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import { useParentDashboard } from '../hooks/useParentDashboard';

/**
 * Single source of truth for the parent bottom-tab experience.
 *
 * `useParentDashboard` fetches the linked children + incoming link requests and
 * owns the add-child / respond / cancel mutations. Wrapping it in a provider lets
 * the Dashboard tab, the Requests tab and the shared add-child modal all read the
 * same data and fire the same handlers without re-fetching once per screen.
 */
type ParentDashboardContextValue = ReturnType<typeof useParentDashboard> & {
  isAddModalVisible: boolean;
  openAddModal: () => void;
  closeAddModal: () => void;
};

const ParentDashboardContext = createContext<ParentDashboardContextValue | null>(null);

export const ParentDashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const dashboard = useParentDashboard();
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  const value = useMemo<ParentDashboardContextValue>(
    () => ({
      ...dashboard,
      isAddModalVisible,
      openAddModal: () => setIsAddModalVisible(true),
      closeAddModal: () => setIsAddModalVisible(false),
    }),
    [dashboard, isAddModalVisible],
  );

  return (
    <ParentDashboardContext.Provider value={value}>{children}</ParentDashboardContext.Provider>
  );
};

export const useParentDashboardContext = (): ParentDashboardContextValue => {
  const ctx = useContext(ParentDashboardContext);
  if (!ctx) {
    throw new Error('useParentDashboardContext must be used within a ParentDashboardProvider');
  }
  return ctx;
};

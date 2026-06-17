import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

import { API_BASE_URL } from '../config';

// Create the context
const GlobalRefreshContext = createContext();

// Custom hook to use the global refresh context
export const useGlobalRefresh = () => {
  const context = useContext(GlobalRefreshContext);
  if (!context) {
    throw new Error('useGlobalRefresh must be used within a GlobalRefreshProvider');
  }
  return context;
};

// Provider component that wraps the app
export const GlobalRefreshProvider = ({ children }) => {
  const [branches, setBranches] = useState([]);

  // State to track refresh triggers for different data types
  const [refreshTriggers, setRefreshTriggers] = useState({
    staff: 0,
    customers: 0,
    booking: 0,
    dashboard: 0,
    stock: 0,
    attendance: 0,
    branches: 0,
  });

  // Fetch branches data
  const fetchBranches = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}branches/`);
      const data = await response.json();
      if (data.success) {
        setBranches(data.branches);
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchBranches();
  }, [fetchBranches, refreshTriggers.branches]);

  // Function to trigger a refresh for a specific data type
  const triggerRefresh = useCallback((dataType) => {
    setRefreshTriggers(prev => ({
      ...prev,
      [dataType]: prev[dataType] + 1
    }));
  }, []);

  // Function to trigger refresh for all data types
  const triggerAllRefresh = useCallback(() => {
    setRefreshTriggers(prev => {
      const newTriggers = {};
      Object.keys(prev).forEach(key => {
        newTriggers[key] = prev[key] + 1;
      });
      return newTriggers;
    });
  }, []);

  // Listen for storage events (for cross-tab sync)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key && e.key.startsWith('refresh_')) {
        const dataType = e.key.replace('refresh_', '');
        if (refreshTriggers[dataType] !== undefined) {
          triggerRefresh(dataType);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [triggerRefresh]);

  const value = {
    refreshTriggers,
    triggerRefresh,
    triggerAllRefresh,
    branches,
    fetchBranches
  };

  return (
    <GlobalRefreshContext.Provider value={value}>
      {children}
    </GlobalRefreshContext.Provider>
  );
};

export default GlobalRefreshContext;

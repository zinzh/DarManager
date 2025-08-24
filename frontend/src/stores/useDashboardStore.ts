/**
 * Dashboard store using Zustand.
 * Manages dashboard statistics and data.
 */

import { create } from 'zustand';
import { DashboardStats } from '@/types';
import { apiClient } from '@/lib/api/client';

interface DashboardState {
  stats: DashboardStats | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchDashboardStats: () => Promise<void>;
  clearError: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  isLoading: false,
  error: null,

  fetchDashboardStats: async () => {
    set({ isLoading: true, error: null });
    
    const response = await apiClient.get<DashboardStats>('/api/dashboard');
    
    if (response.error) {
      set({ error: response.error.message, isLoading: false });
    } else {
      set({ stats: response.data || null, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
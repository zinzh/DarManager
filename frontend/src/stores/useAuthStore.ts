/**
 * Authentication store using Zustand.
 * Manages user authentication state and operations.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, LoginCredentials, AuthTokens } from '@/types';
import { apiClient } from '@/lib/api-client';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiClient.login(credentials.email, credentials.password);
          
          if (response.error) {
            set({ error: response.error.message, isLoading: false });
            return false;
          }

          if (response.data) {
            // Store tokens
            localStorage.setItem('access_token', response.data.access_token);
            localStorage.setItem('refresh_token', response.data.refresh_token);
            
            // Fetch user data
            await get().fetchCurrentUser();
            return true;
          }
          
          return false;
        } catch (error) {
          set({ 
            error: 'Failed to login. Please try again.', 
            isLoading: false 
          });
          return false;
        }
      },

      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ 
          user: null, 
          isAuthenticated: false, 
          error: null 
        });
      },

      fetchCurrentUser: async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
          set({ isAuthenticated: false, isLoading: false });
          return;
        }

        set({ isLoading: true });
        
        try {
          const response = await apiClient.getCurrentUser<User>();
          
          if (response.data) {
            set({ 
              user: response.data, 
              isAuthenticated: true, 
              isLoading: false 
            });
          } else {
            set({ 
              isAuthenticated: false, 
              isLoading: false 
            });
          }
        } catch (error) {
          set({ 
            isAuthenticated: false, 
            isLoading: false 
          });
        }
      },

      clearError: () => set({ error: null }),
      
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user 
      }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
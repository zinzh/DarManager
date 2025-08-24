/**
 * Property management store using Zustand.
 * Manages property state and CRUD operations.
 */

import { create } from 'zustand';
import { Property, PropertyCreate } from '@/types';
import { apiClient } from '@/lib/api/client';

interface PropertyState {
  properties: Property[];
  selectedProperty: Property | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProperties: () => Promise<void>;
  fetchProperty: (id: string) => Promise<void>;
  createProperty: (data: PropertyCreate) => Promise<boolean>;
  updateProperty: (id: string, data: PropertyCreate) => Promise<boolean>;
  deleteProperty: (id: string) => Promise<boolean>;
  setSelectedProperty: (property: Property | null) => void;
  clearError: () => void;
}

export const usePropertyStore = create<PropertyState>((set, get) => ({
  properties: [],
  selectedProperty: null,
  isLoading: false,
  error: null,

  fetchProperties: async () => {
    set({ isLoading: true, error: null });
    
    const response = await apiClient.get<Property[]>('/api/properties');
    
    if (response.error) {
      set({ error: response.error.message, isLoading: false });
    } else {
      set({ properties: response.data || [], isLoading: false });
    }
  },

  fetchProperty: async (id: string) => {
    set({ isLoading: true, error: null });
    
    const response = await apiClient.get<Property>(`/api/properties/${id}`);
    
    if (response.error) {
      set({ error: response.error.message, isLoading: false });
    } else {
      set({ selectedProperty: response.data || null, isLoading: false });
    }
  },

  createProperty: async (data: PropertyCreate) => {
    set({ isLoading: true, error: null });
    
    const response = await apiClient.post<Property>('/api/properties', data);
    
    if (response.error) {
      set({ error: response.error.message, isLoading: false });
      return false;
    }

    if (response.data) {
      const properties = [...get().properties, response.data];
      set({ properties, isLoading: false });
      return true;
    }
    
    return false;
  },

  updateProperty: async (id: string, data: PropertyCreate) => {
    set({ isLoading: true, error: null });
    
    const response = await apiClient.put<Property>(`/api/properties/${id}`, data);
    
    if (response.error) {
      set({ error: response.error.message, isLoading: false });
      return false;
    }

    if (response.data) {
      const properties = get().properties.map(p => 
        p.id === id ? response.data! : p
      );
      set({ properties, selectedProperty: response.data, isLoading: false });
      return true;
    }
    
    return false;
  },

  deleteProperty: async (id: string) => {
    set({ isLoading: true, error: null });
    
    const response = await apiClient.delete(`/api/properties/${id}`);
    
    if (response.error) {
      set({ error: response.error.message, isLoading: false });
      return false;
    }

    const properties = get().properties.filter(p => p.id !== id);
    set({ properties, isLoading: false });
    return true;
  },

  setSelectedProperty: (property) => set({ selectedProperty: property }),
  
  clearError: () => set({ error: null }),
}));
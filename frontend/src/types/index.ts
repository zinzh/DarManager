/**
 * TypeScript type definitions for the entire application.
 * Centralized type management for better maintainability.
 */

// User and Authentication Types
export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: 'super_admin' | 'admin' | 'manager' | 'staff';
  tenant_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// Tenant Types
export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  domain?: string;
  contact_email: string;
  contact_phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Property Types
export interface Property {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  wifi_password?: string;
  price_per_night: number;
  max_guests: number;
  created_at: string;
  updated_at: string;
}

export interface PropertyCreate {
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  wifi_password?: string;
  price_per_night: number;
  max_guests: number;
}

// Room Types
export interface Room {
  id: string;
  property_id: string;
  name: string;
  description?: string;
  capacity: number;
  price_per_night: number;
  status: RoomStatus;
  keybox_code?: string;
  created_at: string;
  updated_at: string;
}

export type RoomStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'out_of_order';

// Guest Types
export interface Guest {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  nationality?: string;
  id_type?: string;
  id_number?: string;
  address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface GuestCreate {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  nationality?: string;
  id_type?: string;
  id_number?: string;
  address?: string;
  notes?: string;
}

// Booking Types
export interface Booking {
  id: string;
  property_id: string;
  guest_id: string;
  check_in_date: string;
  check_out_date: string;
  num_guests: number;
  total_amount: number;
  status: BookingStatus;
  booking_source?: string;
  special_requests?: string;
  created_at: string;
  updated_at: string;
  property?: Property;
  guest?: Guest;
}

export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';

export interface BookingCreate {
  property_id: string;
  guest_id: string;
  check_in_date: string;
  check_out_date: string;
  num_guests: number;
  total_amount: number;
  status: BookingStatus;
  booking_source?: string;
  special_requests?: string;
}

// Dashboard Types
export interface DashboardStats {
  total_properties: number;
  total_rooms: number;
  total_guests: number;
  active_bookings: number;
  monthly_revenue: number;
  occupancy_rate: number;
  recent_bookings: Booking[];
}

// Revenue and Report Types
export interface GuestRevenue {
  guest_id: string;
  guest_name: string;
  total_spent: number;
  bookings_count: number;
}

export interface PropertyRevenue {
  property_id: string;
  property_name: string;
  total_revenue: number;
  bookings_count: number;
}

export interface FinancialReport {
  start_date: string;
  end_date: string;
  total_revenue: number;
  properties: PropertyRevenue[];
  payment_methods_breakdown: Record<string, number>;
  booking_sources_breakdown: Record<string, number>;
  daily_revenue: Array<{
    date: string;
    revenue: number;
  }>;
}

// Form Types
export interface FormError {
  field: string;
  message: string;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
    status: number;
    details?: any;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Status Types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}
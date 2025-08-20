'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  HomeIcon, 
  CalendarIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  PlusIcon,
  ArrowRightOnRectangleIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

interface DashboardStats {
  total_properties: number;
  total_rooms: number;
  active_bookings: number;
  monthly_revenue: number;
  occupancy_rate: number;
  recent_bookings: any[];
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    total_properties: 0,
    total_rooms: 0,
    active_bookings: 0,
    monthly_revenue: 0,
    occupancy_rate: 0,
    recent_bookings: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch user info
        const userResponse = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (userResponse.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          router.push('/login');
          return;
        }

        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);
        }

        // Fetch dashboard stats
        const statsResponse = await fetch('/api/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }

      } catch (error) {
        console.error('Dashboard error:', error);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <HomeIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <div className="text-lg text-gray-600">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button onClick={() => router.push('/login')} className="btn-primary">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 sm:py-6">
            <div className="flex items-center">
              <HomeIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600 mr-2 sm:mr-3" />
              <div>
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900">DarManager</h1>
                {user && (
                  <p className="text-sm text-gray-600">
                    Welcome back, {user.first_name} {user.last_name}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span>Authenticated</span>
              </div>
              <button 
                onClick={handleLogout}
                className="btn-secondary text-sm sm:text-base"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HomeIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Properties</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total_properties}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BuildingOfficeIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Rooms</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total_rooms}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Bookings</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.active_bookings}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">${stats.monthly_revenue}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div 
            onClick={() => {
              console.log('Navigating to properties...');
              router.push('/dashboard/properties');
            }}
            className="card p-6 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Manage Properties</h3>
                <p className="text-sm text-gray-500">Add, edit, and manage your guesthouses</p>
              </div>
              <PlusIcon className="h-8 w-8 text-primary-600" />
            </div>
          </div>

          <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Room Management</h3>
                <p className="text-sm text-gray-500">Configure rooms and pricing</p>
              </div>
              <Cog6ToothIcon className="h-8 w-8 text-primary-600" />
            </div>
          </div>

          <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">New Booking</h3>
                <p className="text-sm text-gray-500">Create a new reservation</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-primary-600" />
            </div>
          </div>
        </div>

        {/* Occupancy Rate */}
        <div className="card p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Occupancy Rate</h3>
          <div className="flex items-center">
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(stats.occupancy_rate, 100)}%` }}
                ></div>
              </div>
            </div>
            <span className="ml-4 text-sm font-medium text-gray-900">
              {stats.occupancy_rate.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Development Status */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Authentication System</span>
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Database Connection</span>
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Property Management</span>
              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">In Development</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Booking System</span>
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">Planned</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

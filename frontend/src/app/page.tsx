'use client';

import { useState, useEffect } from 'react';
import { 
  HomeIcon, 
  CalendarIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

interface DashboardStats {
  total_properties: number;
  active_bookings: number;
  monthly_revenue: number;
}

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats>({
    total_properties: 0,
    active_bookings: 0,
    monthly_revenue: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Set client-side flag
    setIsClient(true);
    
    const checkAPI = async () => {
      try {
        const response = await fetch('/api/dashboard/public');
        if (response.ok) {
          const data = await response.json();
          setStats(data.data);
          setApiStatus('connected');
        } else {
          setApiStatus('error');
        }
      } catch (error) {
        console.error('API connection error:', error);
        setApiStatus('error');
      } finally {
        setIsLoading(false);
      }
    };

    checkAPI();
  }, []);

  const quickActions = [
    {
      name: 'Properties',
      description: 'Manage your guesthouses and rooms',
      href: '/properties',
      icon: HomeIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Bookings',
      description: 'View and manage reservations',
      href: '/bookings',
      icon: CalendarIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Payments',
      description: 'Track payments and invoices',
      href: '/payments',
      icon: CurrencyDollarIcon,
      color: 'bg-yellow-500',
    },
    {
      name: 'Reports',
      description: 'Revenue and occupancy analytics',
      href: '/reports',
      icon: ChartBarIcon,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 sm:py-6">
            <div className="flex items-center min-w-0 flex-1">
              <HomeIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600 mr-2 sm:mr-3 flex-shrink-0" />
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900 truncate">DarManager</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              {isClient && (
                <>
                  <div className={`hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                    apiStatus === 'connected' 
                      ? 'bg-green-100 text-green-800' 
                      : apiStatus === 'error'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      apiStatus === 'connected' 
                        ? 'bg-green-400' 
                        : apiStatus === 'error'
                        ? 'bg-red-400'
                        : 'bg-yellow-400'
                    }`}></div>
                    <span className="whitespace-nowrap">
                      {apiStatus === 'connected' 
                        ? 'API Connected' 
                        : apiStatus === 'error'
                        ? 'API Error'
                        : 'Checking API...'}
                    </span>
                  </div>
                  {/* Mobile status indicator */}
                  <div className={`sm:hidden w-3 h-3 rounded-full ${
                    apiStatus === 'connected' 
                      ? 'bg-green-400' 
                      : apiStatus === 'error'
                      ? 'bg-red-400'
                      : 'bg-yellow-400'
                  }`} title={apiStatus === 'connected' ? 'API Connected' : apiStatus === 'error' ? 'API Error' : 'Checking API...'}></div>
                </>
              )}
              <button 
                onClick={() => window.location.href = '/login'}
                className="btn-secondary text-sm sm:text-base"
              >
                <Cog6ToothIcon className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Login</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to DarManager
          </h2>
          <p className="text-gray-600">
            Your comprehensive guesthouse management solution for Lebanon. 
            Manage bookings, track payments, and grow your business.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HomeIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Properties</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {!isClient || isLoading ? '...' : stats.total_properties}
                </p>
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
                <p className="text-2xl font-semibold text-gray-900">
                  {!isClient || isLoading ? '...' : stats.active_bookings}
                </p>
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
                <p className="text-2xl font-semibold text-gray-900">
                  {!isClient || isLoading ? '...' : `$${stats.monthly_revenue.toLocaleString()}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <div
                key={action.name}
                className="card p-6 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
              >
                <div className="flex items-center">
                  <div className={`flex-shrink-0 p-3 rounded-lg ${action.color}`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-medium text-gray-900">{action.name}</h4>
                    <p className="text-sm text-gray-500">{action.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Development Status */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Development Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Project Structure</span>
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Complete</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Docker Setup</span>
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Complete</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Basic Frontend</span>
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Complete</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Backend API</span>
              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">Basic</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Database Schema</span>
              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">Pending</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Authentication</span>
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">Planned</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

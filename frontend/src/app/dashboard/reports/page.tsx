'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChartBarIcon,
  ArrowLeftIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  HomeIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

interface PropertyRevenue {
  property_id: string;
  property_name: string;
  total_revenue: number;
  bookings_count: number;
}

interface FinancialReport {
  start_date: string;
  end_date: string;
  total_revenue: number;
  properties: PropertyRevenue[];
  booking_sources_breakdown: Record<string, number>;
  daily_revenue: Array<{ date: string; revenue: number }>;
}

export default function FinancialReportsPage() {
  const router = useRouter();
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Date range states
  const [dateRange, setDateRange] = useState('month'); // 'day', 'week', 'month', 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Initialize dates
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  const fetchReport = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      let queryParams = '';
      
      if (dateRange === 'day') {
        const today = new Date();
        queryParams = `?start_date=${today.toISOString().split('T')[0]}&end_date=${today.toISOString().split('T')[0]}`;
      } else if (dateRange === 'week') {
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        queryParams = `?start_date=${weekAgo.toISOString().split('T')[0]}&end_date=${today.toISOString().split('T')[0]}`;
      } else if (dateRange === 'month') {
        const today = new Date();
        const monthAgo = new Date(today);
        monthAgo.setDate(monthAgo.getDate() - 30);
        queryParams = `?start_date=${monthAgo.toISOString().split('T')[0]}&end_date=${today.toISOString().split('T')[0]}`;
      } else if (dateRange === 'custom' && startDate && endDate) {
        queryParams = `?start_date=${startDate}&end_date=${endDate}`;
      }

      const response = await fetch(`/api/financial-report${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        router.push('/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setReport(data);
      } else {
        setError('Failed to load financial report');
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      fetchReport();
    }
  }, [dateRange, startDate, endDate]);

  const handleDateRangeChange = (range: string) => {
    setDateRange(range);
    
    const today = new Date();
    
    if (range === 'day') {
      setStartDate(today.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (range === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      setStartDate(weekAgo.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (range === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 30);
      setStartDate(monthAgo.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    }
  };

  const exportToCSV = () => {
    if (!report) return;

    // Create CSV content
    let csv = 'Financial Report\n';
    csv += `Period: ${report.start_date} to ${report.end_date}\n`;
    csv += `Total Revenue: $${Number(report.total_revenue || 0).toFixed(2)}\n\n`;
    
    csv += 'Property Revenue\n';
    csv += 'Property Name,Bookings,Revenue\n';
    report.properties.forEach(prop => {
      csv += `"${prop.property_name}",${prop.bookings_count},$${Number(prop.total_revenue || 0).toFixed(2)}\n`;
    });
    
    csv += '\nDaily Revenue\n';
    csv += 'Date,Revenue\n';
    report.daily_revenue.forEach(day => {
      csv += `${day.date},$${Number(day.revenue || 0).toFixed(2)}\n`;
    });
    
    csv += '\nBooking Sources\n';
    csv += 'Source,Revenue\n';
    Object.entries(report.booking_sources_breakdown).forEach(([source, revenue]) => {
      csv += `${source},$${Number(revenue || 0).toFixed(2)}\n`;
    });

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${report.start_date}-to-${report.end_date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 sm:py-6">
            <div className="flex items-center">
              <button 
                onClick={() => router.push('/dashboard')}
                className="mr-4 p-1 rounded-md hover:bg-gray-100"
              >
                <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
              </button>
              <ChartBarIcon className="h-8 w-8 text-primary-600 mr-3" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Financial Reports</h1>
            </div>
            {report && (
              <button
                onClick={exportToCSV}
                className="btn-primary"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Export CSV
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Date Range Selector */}
        <div className="card mb-6">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Select Date Range</h2>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => handleDateRangeChange('day')}
                className={`px-4 py-2 rounded-md ${
                  dateRange === 'day' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => handleDateRangeChange('week')}
                className={`px-4 py-2 rounded-md ${
                  dateRange === 'week' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => handleDateRangeChange('month')}
                className={`px-4 py-2 rounded-md ${
                  dateRange === 'month' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Last 30 Days
              </button>
              <button
                onClick={() => setDateRange('custom')}
                className={`px-4 py-2 rounded-md ${
                  dateRange === 'custom' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Custom Range
              </button>
            </div>

            {dateRange === 'custom' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={fetchReport}
                    className="btn-primary w-full"
                  >
                    Generate Report
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <ChartBarIcon className="h-12 w-12 text-primary-600 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600">Loading financial report...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="card p-6 bg-red-50 border-red-200">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Report Content */}
        {report && !isLoading && (
          <>
            {/* Summary Card */}
            <div className="card mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">Total Revenue</p>
                    <p className="text-4xl font-bold text-green-900">${Number(report.total_revenue || 0).toFixed(2)}</p>
                    <p className="text-sm text-green-700 mt-1">
                      {report.start_date} to {report.end_date}
                    </p>
                  </div>
                  <CurrencyDollarIcon className="h-16 w-16 text-green-600" />
                </div>
              </div>
            </div>

            {/* Properties Revenue */}
            <div className="card mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Revenue by Property</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Property
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bookings
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        % of Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {report.properties.map((property) => (
                      <tr key={property.property_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <HomeIcon className="h-5 w-5 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-900">
                              {property.property_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {property.bookings_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${Number(property.total_revenue || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-1 mr-2">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-primary-600 h-2 rounded-full"
                                  style={{ 
                                    width: `${Number(report.total_revenue || 0) > 0 
                                      ? (Number(property.total_revenue || 0) / Number(report.total_revenue || 1) * 100) 
                                      : 0}%` 
                                  }}
                                />
                              </div>
                            </div>
                            <span className="text-sm text-gray-600">
                              {report.total_revenue > 0 
                                ? `${((Number(property.total_revenue || 0) / Number(report.total_revenue || 1)) * 100).toFixed(1)}%`
                                : '0%'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Booking Sources */}
            {Object.keys(report.booking_sources_breakdown).length > 0 && (
              <div className="card mb-6">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Revenue by Booking Source</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(report.booking_sources_breakdown).map(([source, revenue]) => (
                      <div key={source} className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-500 capitalize">{source}</p>
                        <p className="text-xl font-semibold text-gray-900">${Number(revenue || 0).toFixed(2)}</p>
                        <p className="text-xs text-gray-500">
                          {report.total_revenue > 0 
                            ? `${((Number(revenue || 0) / Number(report.total_revenue || 1)) * 100).toFixed(1)}% of total`
                            : '0%'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Daily Revenue Chart */}
            {report.daily_revenue.length > 0 && (
              <div className="card">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Daily Revenue</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-2">
                    {report.daily_revenue.map((day) => (
                      <div key={day.date} className="flex items-center">
                        <span className="text-sm text-gray-600 w-24">
                          {new Date(day.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                        <div className="flex-1 mx-4">
                          <div className="w-full bg-gray-200 rounded-full h-4">
                            <div 
                              className="bg-blue-600 h-4 rounded-full"
                              style={{ 
                                width: `${Math.max(...report.daily_revenue.map(d => d.revenue)) > 0
                                  ? (day.revenue / Math.max(...report.daily_revenue.map(d => d.revenue)) * 100)
                                  : 0}%` 
                              }}
                            />
                          </div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-20 text-right">
                          ${Number(day.revenue || 0).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
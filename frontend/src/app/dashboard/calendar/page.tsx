'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CalendarIcon, 
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  HomeIcon,
  UserIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface Booking {
  id: string;
  property_id: string;
  guest_id: string;
  check_in_date: string;
  check_out_date: string;
  guests_count: number;
  total_amount?: number;
  status: string;
  booking_source?: string;
  notes?: string;
}

interface Property {
  id: string;
  name: string;
}

interface Guest {
  id: string;
  first_name: string;
  last_name: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  bookings: Booking[];
}

const statusColors = {
  pending: 'bg-yellow-200 border-yellow-300 text-yellow-800',
  confirmed: 'bg-blue-200 border-blue-300 text-blue-800',
  checked_in: 'bg-green-200 border-green-300 text-green-800',
  checked_out: 'bg-gray-200 border-gray-300 text-gray-800',
  cancelled: 'bg-red-200 border-red-300 text-red-800'
};

export default function BookingCalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDateBookings, setShowDateBookings] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{start: Date | null, end: Date | null}>({start: null, end: null});
  const [isSelectingRange, setIsSelectingRange] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const [bookingsResponse, propertiesResponse, guestsResponse] = await Promise.all([
        fetch('/api/bookings', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/properties', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/guests', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (bookingsResponse.status === 401 || propertiesResponse.status === 401 || guestsResponse.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        router.push('/login');
        return;
      }

      if (bookingsResponse.ok && propertiesResponse.ok && guestsResponse.ok) {
        const [bookingsData, propertiesData, guestsData] = await Promise.all([
          bookingsResponse.json(),
          propertiesResponse.json(),
          guestsResponse.json()
        ]);
        
        setBookings(bookingsData);
        setProperties(propertiesData);
        setGuests(guestsData);
      } else {
        setError('Failed to load data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getPropertyName = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    return property ? property.name : 'Unknown Property';
  };

  const getGuestName = (guestId: string) => {
    const guest = guests.find(g => g.id === guestId);
    return guest ? `${guest.first_name} ${guest.last_name}` : 'Unknown Guest';
  };

  const isDateInBooking = (date: Date, booking: Booking): boolean => {
    // Parse dates in local timezone to avoid UTC conversion issues
    const parseLocalDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day); // month is 0-indexed
    };
    
    const checkIn = parseLocalDate(booking.check_in_date);
    const checkOut = parseLocalDate(booking.check_out_date);
    
    // Normalize the comparison date too
    const calendarDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    // For calendar display: show booking from check-in date through (check-out date - 1)
    // Example: booking 26-27 shows on 26 only, booking 25-28 shows on 25,26,27
    return calendarDate >= checkIn && calendarDate < checkOut;
  };

  const getBookingsForDate = (date: Date): Booking[] => {
    return bookings.filter(booking => {
      if (selectedProperty && booking.property_id !== selectedProperty) {
        return false;
      }
      return isDateInBooking(date, booking);
    });
  };

  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for accurate comparison
    
    // Add days from previous month
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonth.getDate() - i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isPast: date < today,
        bookings: getBookingsForDate(date)
      });
    }
    
    // Add days from current month
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString(),
        isPast: date < today,
        bookings: getBookingsForDate(date)
      });
    }
    
    // Add days from next month
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isPast: date < today,
        bookings: getBookingsForDate(date)
      });
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleDateClick = (day: CalendarDay) => {
    // Prevent selecting past dates
    if (day.isPast) return;
    
    if (day.bookings.length > 0) {
      setSelectedDate(day.date);
      setShowDateBookings(true);
      return;
    }

    // Range selection logic
    if (!selectedRange.start || (selectedRange.start && selectedRange.end)) {
      // Start new range selection
      setSelectedRange({ start: day.date, end: null });
      setIsSelectingRange(true);
    } else if (selectedRange.start && !selectedRange.end) {
      // Complete range selection
      const start = selectedRange.start;
      const end = day.date;
      
      if (end >= start) {
        setSelectedRange({ start, end });
        setIsSelectingRange(false);
        // Navigate to create booking with date range
        handleCreateBookingWithRange(start, end);
      } else {
        // If user clicks earlier date, restart selection
        setSelectedRange({ start: day.date, end: null });
      }
    }
  };

  const handleCreateBookingWithRange = (startDate: Date, endDate: Date) => {
    // Fix timezone issue by creating date in local timezone
    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const checkInStr = formatLocalDate(startDate);
    const checkOutStr = formatLocalDate(endDate);
    
    const params = new URLSearchParams({
      check_in_date: checkInStr,
      check_out_date: checkOutStr,
      from_calendar: 'true' // Add flag to identify calendar origin
    });
    
    if (selectedProperty) {
      params.append('property_id', selectedProperty);
    }
    
    router.push(`/dashboard/bookings/new?${params.toString()}`);
  };

  const isDateInRange = (date: Date): boolean => {
    if (!selectedRange.start) return false;
    if (!selectedRange.end) return date.getTime() === selectedRange.start.getTime();
    return date >= selectedRange.start && date <= selectedRange.end;
  };

  const isDateRangeStart = (date: Date): boolean => {
    return selectedRange.start?.getTime() === date.getTime();
  };

  const isDateRangeEnd = (date: Date): boolean => {
    return selectedRange.end?.getTime() === date.getTime();
  };

  const clearSelection = () => {
    setSelectedRange({ start: null, end: null });
    setIsSelectingRange(false);
  };

  const handleCreateBookingForDate = (date: Date) => {
    // Fix timezone issue by creating date in local timezone
    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const dateStr = formatLocalDate(date);
    const params = new URLSearchParams({
      check_in_date: dateStr,
      from_calendar: 'true' // Add flag to identify calendar origin
    });
    if (selectedProperty) {
      params.append('property_id', selectedProperty);
    }
    router.push(`/dashboard/bookings/new?${params.toString()}`);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <CalendarIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <div className="text-lg text-gray-600">Loading calendar...</div>
        </div>
      </div>
    );
  }

  const calendarDays = generateCalendarDays();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 sm:py-6">
            <div className="flex items-center min-w-0 flex-1">
              <button 
                onClick={() => router.push('/dashboard')}
                className="mr-4 p-1 rounded-md hover:bg-gray-100 flex-shrink-0"
              >
                <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
              </button>
              <CalendarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600 mr-2 sm:mr-3 flex-shrink-0" />
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Booking Calendar</h1>
            </div>
            <button 
              onClick={() => router.push('/dashboard/bookings/new')}
              className="btn-primary flex-shrink-0"
            >
              <PlusIcon className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">New Booking</span>
            </button>
          </div>
        </div>
      </header>

                {/* Calendar Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 mb-6">
          {/* Month Navigation */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-semibold text-gray-900 min-w-0">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Property Filter and Range Selection Info */}
          <div className="flex items-center space-x-4">
            {isSelectingRange && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-blue-600 font-medium">
                  Selecting dates... {selectedRange.start && `From: ${selectedRange.start.toLocaleDateString()}`}
                </span>
                <button
                  onClick={clearSelection}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            )}
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="input-field min-w-0"
            >
              <option value="">All Properties</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md mb-6">
          <p className="text-sm">
            📅 <strong>How to book:</strong> Click a start date, then click an end date to select a range. 
            Click dates with bookings to view details. Past dates are disabled.
          </p>
        </div>

        {/* Calendar Legend */}
        <div className="flex flex-wrap items-center space-x-6 mb-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-200 border border-yellow-300 rounded"></div>
            <span>Pending</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-200 border border-blue-300 rounded"></div>
            <span>Confirmed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-200 border border-green-300 rounded"></div>
            <span>Checked In</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-200 border border-gray-300 rounded"></div>
            <span>Checked Out</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-200 border border-red-300 rounded"></div>
            <span>Cancelled</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 bg-gray-50">
            {dayNames.map((day) => (
              <div key={day} className="px-2 py-3 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => {
              const isInRange = isDateInRange(day.date);
              const isRangeStart = isDateRangeStart(day.date);
              const isRangeEnd = isDateRangeEnd(day.date);
              
              return (
                <div
                  key={index}
                  className={`min-h-[120px] p-2 border-r border-b border-gray-200 relative ${
                    day.isPast 
                      ? 'bg-gray-100 cursor-not-allowed opacity-60' 
                      : 'cursor-pointer hover:bg-gray-50'
                  } ${
                    !day.isCurrentMonth ? 'bg-gray-50' : ''
                  } ${
                    day.isToday ? 'bg-blue-50' : ''
                  } ${
                    isInRange && !day.isPast ? 'bg-blue-100' : ''
                  } ${
                    isRangeStart || isRangeEnd ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => handleDateClick(day)}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    day.isPast ? 'text-gray-400' :
                    !day.isCurrentMonth ? 'text-gray-400' : 
                    day.isToday ? 'text-blue-600' : 
                    isInRange ? 'text-blue-800' : 'text-gray-900'
                  }`}>
                    {day.date.getDate()}
                    {isRangeStart && <span className="ml-1 text-xs text-blue-600">Start</span>}
                    {isRangeEnd && <span className="ml-1 text-xs text-blue-600">End</span>}
                  </div>
                  
                  <div className="space-y-1">
                    {day.bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className={`text-xs p-1 rounded border truncate ${
                          statusColors[booking.status as keyof typeof statusColors] || statusColors.pending
                        }`}
                        title={`${getGuestName(booking.guest_id)} - ${getPropertyName(booking.property_id)}`}
                      >
                        {getGuestName(booking.guest_id)}
                      </div>
                    ))}
                    
                    {day.bookings.length === 0 && day.isCurrentMonth && !day.isPast && (
                      <div className="text-xs text-gray-400 italic">
                        {isSelectingRange && !selectedRange.start ? 'Click to start' :
                         isSelectingRange && selectedRange.start && !selectedRange.end ? 'Click to end' :
                         'Available'}
                      </div>
                    )}
                    
                    {day.isPast && (
                      <div className="text-xs text-gray-400 italic">
                        Past date
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Date Bookings Modal */}
      {showDateBookings && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Bookings for {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              <button
                onClick={() => setShowDateBookings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                {getBookingsForDate(selectedDate).map((booking) => (
                  <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          booking.status === 'checked_in' ? 'bg-green-100 text-green-800' :
                          booking.status === 'checked_out' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {booking.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <button
                        onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View Details
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <UserIcon className="h-4 w-4 text-gray-400" />
                        <span>{getGuestName(booking.guest_id)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <HomeIcon className="h-4 w-4 text-gray-400" />
                        <span>{getPropertyName(booking.property_id)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Dates:</span> {new Date(booking.check_in_date).toLocaleDateString()} - {new Date(booking.check_out_date).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="text-gray-500">Guests:</span> {booking.guests_count}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowDateBookings(false);
                    handleCreateBookingForDate(selectedDate);
                  }}
                  className="btn-primary w-full"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create New Booking for This Date
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CalendarIcon, 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  UserIcon,
  HomeIcon,
  CurrencyDollarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface Booking {
  id: string;
  property_id: string;
  room_id?: string;
  guest_id: string;
  check_in_date: string;
  check_out_date: string;
  guests_count: number;
  total_amount?: number;
  status: string;
  booking_source?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
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

const statusOptions = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
  { value: 'checked_in', label: 'Checked In', color: 'bg-green-100 text-green-800' },
  { value: 'checked_out', label: 'Checked Out', color: 'bg-gray-100 text-gray-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' }
];

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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
      // Fetch bookings, properties, and guests in parallel
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

  const handleDeleteBooking = async (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete this booking? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    const token = localStorage.getItem('access_token');
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setBookings(bookings.filter(b => b.id !== bookingId));
      } else {
        alert('Failed to delete booking');
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Network error occurred');
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

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption ? statusOption.color : 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 1;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <CalendarIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <div className="text-lg text-gray-600">Loading bookings...</div>
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
            <div className="flex items-center min-w-0 flex-1">
              <button 
                onClick={() => router.push('/dashboard')}
                className="mr-4 p-1 rounded-md hover:bg-gray-100 flex-shrink-0"
              >
                <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
              </button>
              <CalendarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600 mr-2 sm:mr-3 flex-shrink-0" />
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Booking Management</h1>
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
            <p className="text-gray-600 mb-6">Start by creating your first booking reservation.</p>
            <button 
              onClick={() => router.push('/dashboard/bookings/new')}
              className="btn-primary"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Your First Booking
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="card">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {booking.booking_source && (
                        <span className="text-sm text-gray-500">
                          via {booking.booking_source}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => router.push(`/dashboard/bookings/${booking.id}/edit`)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="Edit booking"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBooking(booking.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Delete booking"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Guest Information */}
                    <div className="flex items-center space-x-2">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{getGuestName(booking.guest_id)}</p>
                        <p className="text-sm text-gray-500">{booking.guests_count} guest{booking.guests_count !== 1 ? 's' : ''}</p>
                      </div>
                    </div>

                    {/* Property Information */}
                    <div className="flex items-center space-x-2">
                      <HomeIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{getPropertyName(booking.property_id)}</p>
                        <p className="text-sm text-gray-500">Property</p>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="flex items-center space-x-2">
                      <ClockIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}
                        </p>
                        <p className="text-sm text-gray-500">{calculateNights(booking.check_in_date, booking.check_out_date)} night{calculateNights(booking.check_in_date, booking.check_out_date) !== 1 ? 's' : ''}</p>
                      </div>
                    </div>

                    {/* Amount */}
                    {booking.total_amount && (
                      <div className="flex items-center space-x-2">
                        <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">${booking.total_amount}</p>
                          <p className="text-sm text-gray-500">Total</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {booking.notes && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600">{booking.notes}</p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button 
                      onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}
                      className="btn-secondary"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

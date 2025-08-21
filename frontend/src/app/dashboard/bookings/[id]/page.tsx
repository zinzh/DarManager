'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  CalendarIcon, 
  ArrowLeftIcon,
  UserIcon,
  HomeIcon,
  CurrencyDollarIcon,
  ClockIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  MapPinIcon
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
  created_at: string;
  updated_at: string;
}

interface Property {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  wifi_password?: string;
  price_per_night?: number;
  max_guests?: number;
}

interface Guest {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  nationality?: string;
  id_number?: string;
  notes?: string;
}

const statusOptions = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
  { value: 'checked_in', label: 'Checked In', color: 'bg-green-100 text-green-800' },
  { value: 'checked_out', label: 'Checked Out', color: 'bg-gray-100 text-gray-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' }
];

export default function BookingDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBookingDetails();
  }, []);

  const fetchBookingDetails = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const bookingResponse = await fetch(`/api/bookings/${bookingId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (bookingResponse.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        router.push('/login');
        return;
      }

      if (bookingResponse.ok) {
        const bookingData = await bookingResponse.json();
        setBooking(bookingData);

        // Fetch property and guest details
        const [propertyResponse, guestResponse] = await Promise.all([
          fetch(`/api/properties/${bookingData.property_id}`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`/api/guests/${bookingData.guest_id}`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (propertyResponse.ok) {
          const propertyData = await propertyResponse.json();
          setProperty(propertyData);
        }

        if (guestResponse.ok) {
          const guestData = await guestResponse.json();
          setGuest(guestData);
        }
      } else {
        setError('Failed to load booking details');
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBooking = async () => {
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
        router.push('/dashboard/bookings');
      } else {
        alert('Failed to delete booking');
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Network error occurred');
    }
  };

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption ? statusOption.color : 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 1;
  };

  const calculateDaysUntil = (dateString: string) => {
    const today = new Date();
    const targetDate = new Date(dateString);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <CalendarIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <div className="text-lg text-gray-600">Loading booking details...</div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">{error || 'Booking not found'}</h3>
          <button 
            onClick={() => router.push('/dashboard/bookings')}
            className="btn-primary"
          >
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  const nights = calculateNights(booking.check_in_date, booking.check_out_date);
  const daysUntilCheckin = calculateDaysUntil(booking.check_in_date);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 sm:py-6">
            <div className="flex items-center min-w-0 flex-1">
              <button 
                onClick={() => router.push('/dashboard/bookings')}
                className="mr-4 p-1 rounded-md hover:bg-gray-100 flex-shrink-0"
              >
                <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
              </button>
              <CalendarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600 mr-2 sm:mr-3 flex-shrink-0" />
              <div>
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Booking Details</h1>
                <p className="text-sm text-gray-500">#{booking.id.slice(-8)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => router.push(`/dashboard/bookings/${bookingId}/edit`)}
                className="btn-secondary"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </button>
              <button
                onClick={handleDeleteBooking}
                className="btn-secondary text-red-600 hover:text-red-800"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Booking Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status and Dates */}
            <div className="card">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">Booking Overview</h2>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(booking.status)}`}>
                    {booking.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Check-in</h3>
                    <p className="text-lg font-semibold text-gray-900">{formatDate(booking.check_in_date)}</p>
                    {daysUntilCheckin >= 0 && (
                      <p className="text-sm text-gray-500">
                        {daysUntilCheckin === 0 ? 'Today' : 
                         daysUntilCheckin === 1 ? 'Tomorrow' :
                         `In ${daysUntilCheckin} days`}
                      </p>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Check-out</h3>
                    <p className="text-lg font-semibold text-gray-900">{formatDate(booking.check_out_date)}</p>
                    <p className="text-sm text-gray-500">{nights} night{nights !== 1 ? 's' : ''}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Guests</h3>
                    <p className="text-lg font-semibold text-gray-900">{booking.guests_count}</p>
                    <p className="text-sm text-gray-500">guest{booking.guests_count !== 1 ? 's' : ''}</p>
                  </div>
                  {booking.total_amount && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Total Amount</h3>
                      <p className="text-lg font-semibold text-gray-900">${booking.total_amount}</p>
                      <p className="text-sm text-gray-500">USD</p>
                    </div>
                  )}
                </div>

                {booking.booking_source && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Booking Source</h3>
                    <p className="text-gray-900 capitalize">{booking.booking_source.replace('_', ' ')}</p>
                  </div>
                )}

                {booking.notes && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Notes & Special Requests</h3>
                    <p className="text-gray-900">{booking.notes}</p>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Booking Timeline</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>Created: {formatDateTime(booking.created_at)}</p>
                    <p>Last updated: {formatDateTime(booking.updated_at)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Property Details */}
            {property && (
              <div className="card">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Property Information</h2>
                </div>
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <HomeIcon className="h-6 w-6 text-gray-400 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{property.name}</h3>
                      {property.description && (
                        <p className="text-gray-600 mt-1">{property.description}</p>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {property.address && (
                          <div className="flex items-start space-x-2">
                            <MapPinIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                            <p className="text-sm text-gray-600">{property.address}</p>
                          </div>
                        )}
                        {property.phone && (
                          <div className="flex items-center space-x-2">
                            <PhoneIcon className="h-4 w-4 text-gray-400" />
                            <p className="text-sm text-gray-600">{property.phone}</p>
                          </div>
                        )}
                        {property.email && (
                          <div className="flex items-center space-x-2">
                            <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                            <p className="text-sm text-gray-600">{property.email}</p>
                          </div>
                        )}
                        {property.wifi_password && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-500">WiFi:</span>
                            <p className="text-sm text-gray-600">{property.wifi_password}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Guest Information Sidebar */}
          <div className="space-y-6">
            {guest && (
              <div className="card">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Guest Information</h2>
                </div>
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <UserIcon className="h-6 w-6 text-gray-400 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {guest.first_name} {guest.last_name}
                      </h3>
                      
                      <div className="space-y-3 mt-4">
                        {guest.email && (
                          <div className="flex items-center space-x-2">
                            <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                            <p className="text-sm text-gray-600">{guest.email}</p>
                          </div>
                        )}
                        {guest.phone && (
                          <div className="flex items-center space-x-2">
                            <PhoneIcon className="h-4 w-4 text-gray-400" />
                            <p className="text-sm text-gray-600">{guest.phone}</p>
                          </div>
                        )}
                        {guest.whatsapp && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-500">WhatsApp:</span>
                            <p className="text-sm text-gray-600">{guest.whatsapp}</p>
                          </div>
                        )}
                        {guest.nationality && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-500">Nationality:</span>
                            <p className="text-sm text-gray-600">{guest.nationality}</p>
                          </div>
                        )}
                        {guest.id_number && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-500">ID Number:</span>
                            <p className="text-sm text-gray-600">{guest.id_number}</p>
                          </div>
                        )}
                      </div>

                      {guest.notes && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Guest Notes</h4>
                          <p className="text-sm text-gray-600">{guest.notes}</p>
                        </div>
                      )}

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => router.push(`/dashboard/guests/${guest.id}`)}
                          className="btn-secondary w-full"
                        >
                          View Guest Profile
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="card">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-6 space-y-3">
                <button
                  onClick={() => router.push(`/dashboard/bookings/${bookingId}/edit`)}
                  className="btn-primary w-full"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit Booking
                </button>
                {property && (
                  <button
                    onClick={() => router.push(`/dashboard/properties/${property.id}`)}
                    className="btn-secondary w-full"
                  >
                    <HomeIcon className="h-4 w-4 mr-2" />
                    View Property
                  </button>
                )}
                <button
                  onClick={() => router.push('/dashboard/bookings/new')}
                  className="btn-secondary w-full"
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  New Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

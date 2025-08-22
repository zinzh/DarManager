'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  UserGroupIcon,
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  PhoneIcon,
  EnvelopeIcon,
  FlagIcon,
  IdentificationIcon,
  DocumentTextIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

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
  created_at: string;
  updated_at: string;
}

interface GuestRevenue {
  guest_id: string;
  guest_name: string;
  total_spent: number;
  bookings_count: number;
}

interface Booking {
  id: string;
  property_id: string;
  check_in_date: string;
  check_out_date: string;
  guests_count: number;
  total_amount?: number;
  status: string;
  booking_source?: string;
  notes?: string;
  created_at: string;
}

interface Property {
  id: string;
  name: string;
}

export default function GuestDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const guestId = params.id as string;

  const [guest, setGuest] = useState<Guest | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [revenue, setRevenue] = useState<GuestRevenue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        // Fetch guest, bookings, properties, and revenue in parallel
        const [guestResponse, bookingsResponse, propertiesResponse, revenueResponse] = await Promise.all([
          fetch(`/api/guests/${guestId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`/api/bookings?guest_id=${guestId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/properties', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`/api/guests/${guestId}/revenue`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (guestResponse.status === 401 || bookingsResponse.status === 401 || propertiesResponse.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          router.push('/login');
          return;
        }

        if (guestResponse.ok && bookingsResponse.ok && propertiesResponse.ok) {
          const [guestData, bookingsData, propertiesData] = await Promise.all([
            guestResponse.json(),
            bookingsResponse.json(),
            propertiesResponse.json()
          ]);
          
          setGuest(guestData);
          setBookings(bookingsData);
          setProperties(propertiesData);
          
          // Revenue might fail for new guests, so handle separately
          if (revenueResponse.ok) {
            const revenueData = await revenueResponse.json();
            setRevenue(revenueData);
          }
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

    fetchData();
  }, [guestId, router]);

  const handleDeleteGuest = async () => {
    if (!guest) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${guest.first_name} ${guest.last_name}? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    const token = localStorage.getItem('access_token');
    try {
      const response = await fetch(`/api/guests/${guestId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        router.push('/dashboard/guests');
      } else {
        alert('Failed to delete guest');
      }
    } catch (error) {
      console.error('Error deleting guest:', error);
      alert('Network error occurred');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <UserGroupIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <div className="text-lg text-gray-600">Loading guest details...</div>
        </div>
      </div>
    );
  }

  if (error || !guest) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error || 'Guest not found'}</div>
          <button 
            onClick={() => router.push('/dashboard/guests')} 
            className="btn-primary"
          >
            Back to Guests
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
            <div className="flex items-center min-w-0 flex-1">
              <button 
                onClick={() => router.push('/dashboard/guests')}
                className="mr-4 p-1 rounded-md hover:bg-gray-100 flex-shrink-0"
              >
                <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
              </button>
              <UserGroupIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600 mr-2 sm:mr-3 flex-shrink-0" />
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900 truncate">
                {guest.first_name} {guest.last_name}
              </h1>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <button 
                onClick={() => router.push(`/dashboard/guests/${guestId}/edit`)}
                className="btn-secondary"
              >
                <PencilIcon className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Edit</span>
              </button>
              <button 
                onClick={handleDeleteGuest}
                className="btn-secondary text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <TrashIcon className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Revenue Summary */}
        {revenue && revenue.total_spent > 0 && (
          <div className="card mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800 mb-1">Total Revenue</p>
                  <p className="text-3xl font-bold text-green-900">${Number(revenue.total_spent || 0).toFixed(2)}</p>
                  <p className="text-sm text-green-700 mt-1">
                    from {revenue.bookings_count} completed booking{revenue.bookings_count !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-green-600">
                  <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Guest Information */}
        <div className="card mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Guest Information</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Information */}
              {guest.email && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    <EnvelopeIcon className="h-4 w-4 inline mr-1" />
                    Email Address
                  </h3>
                  <p className="text-gray-900">
                    <a href={`mailto:${guest.email}`} className="text-blue-600 hover:text-blue-800">
                      {guest.email}
                    </a>
                  </p>
                </div>
              )}
              
              {guest.phone && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    <PhoneIcon className="h-4 w-4 inline mr-1" />
                    Phone Number
                  </h3>
                  <p className="text-gray-900">
                    <a href={`tel:${guest.phone}`} className="text-blue-600 hover:text-blue-800">
                      {guest.phone}
                    </a>
                  </p>
                </div>
              )}

              {guest.whatsapp && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    <PhoneIcon className="h-4 w-4 inline mr-1" />
                    WhatsApp Number
                  </h3>
                  <p className="text-gray-900">
                    <a 
                      href={`https://wa.me/${guest.whatsapp.replace(/[^0-9]/g, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-800"
                    >
                      {guest.whatsapp}
                    </a>
                  </p>
                </div>
              )}
              
              {guest.nationality && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    <FlagIcon className="h-4 w-4 inline mr-1" />
                    Nationality
                  </h3>
                  <p className="text-gray-900">{guest.nationality}</p>
                </div>
              )}

              {guest.id_number && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    <IdentificationIcon className="h-4 w-4 inline mr-1" />
                    ID Number
                  </h3>
                  <p className="text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                    {guest.id_number}
                  </p>
                </div>
              )}

              {/* Timestamps */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  <CalendarIcon className="h-4 w-4 inline mr-1" />
                  Created
                </h3>
                <p className="text-gray-900 text-sm">{formatDate(guest.created_at)}</p>
              </div>

              {guest.updated_at !== guest.created_at && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    <CalendarIcon className="h-4 w-4 inline mr-1" />
                    Last Updated
                  </h3>
                  <p className="text-gray-900 text-sm">{formatDate(guest.updated_at)}</p>
                </div>
              )}
            </div>

            {/* Notes Section */}
            {guest.notes && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  <DocumentTextIcon className="h-4 w-4 inline mr-1" />
                  Additional Notes
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-900 whitespace-pre-wrap">{guest.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Booking History Section */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Booking History</h2>
            <button 
              onClick={() => router.push(`/dashboard/bookings/new?guest_id=${guestId}`)}
              className="btn-primary"
            >
              Create New Booking
            </button>
          </div>
          <div className="p-6">
            {bookings.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
                <p className="text-gray-600 mb-6">This guest hasn't made any bookings yet.</p>
                <button 
                  onClick={() => router.push(`/dashboard/bookings/new?guest_id=${guestId}`)}
                  className="btn-primary"
                >
                  Create First Booking
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => {
                  const property = properties.find(p => p.id === booking.property_id);
                  const nights = Math.ceil((new Date(booking.check_out_date).getTime() - new Date(booking.check_in_date).getTime()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div key={booking.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
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
                          {booking.booking_source && (
                            <span className="text-sm text-gray-500">via {booking.booking_source}</span>
                          )}
                        </div>
                        <button
                          onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          View Details
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-900">{property?.name || 'Unknown Property'}</p>
                          <p className="text-gray-500">{booking.guests_count} guest{booking.guests_count !== 1 ? 's' : ''}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {new Date(booking.check_in_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(booking.check_out_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <p className="text-gray-500">{nights} night{nights !== 1 ? 's' : ''}</p>
                        </div>
                        <div>
                          {booking.total_amount && (
                            <>
                              <p className="font-medium text-gray-900">${booking.total_amount}</p>
                              <p className="text-gray-500">Total</p>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {booking.notes && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-sm text-gray-600">{booking.notes}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

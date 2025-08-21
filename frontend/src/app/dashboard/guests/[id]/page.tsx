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

export default function GuestDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const guestId = params.id as string;

  const [guest, setGuest] = useState<Guest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGuest = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch(`/api/guests/${guestId}`, {
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
          const guestData = await response.json();
          setGuest(guestData);
        } else {
          setError('Failed to load guest details');
        }
      } catch (error) {
        console.error('Error fetching guest:', error);
        setError('Network error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGuest();
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

        {/* Future: Booking History Section */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Booking History</h2>
          </div>
          <div className="p-6">
            <div className="text-center py-8">
              <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
              <p className="text-gray-600 mb-6">This guest hasn't made any bookings yet.</p>
              <button className="btn-primary">
                Create New Booking
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

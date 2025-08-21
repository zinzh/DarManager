'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UserGroupIcon, 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  PhoneIcon,
  EnvelopeIcon,
  FlagIcon,
  IdentificationIcon
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

export default function GuestsPage() {
  const router = useRouter();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGuests();
  }, []);

  const fetchGuests = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch('/api/guests', {
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
        const guestsData = await response.json();
        setGuests(guestsData);
      } else {
        setError('Failed to load guests');
      }
    } catch (error) {
      console.error('Error fetching guests:', error);
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGuest = async (guestId: string) => {
    const guest = guests.find(g => g.id === guestId);
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
        setGuests(guests.filter(g => g.id !== guestId));
      } else {
        alert('Failed to delete guest');
      }
    } catch (error) {
      console.error('Error deleting guest:', error);
      alert('Network error occurred');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <UserGroupIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <div className="text-lg text-gray-600">Loading guests...</div>
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
              <UserGroupIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600 mr-2 sm:mr-3 flex-shrink-0" />
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Guest Management</h1>
            </div>
            <button 
              onClick={() => router.push('/dashboard/guests/new')}
              className="btn-primary flex-shrink-0"
            >
              <PlusIcon className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Add Guest</span>
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

        {guests.length === 0 ? (
          <div className="text-center py-12">
            <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No guests yet</h3>
            <p className="text-gray-600 mb-6">Start by adding guest information for your bookings.</p>
            <button 
              onClick={() => router.push('/dashboard/guests/new')}
              className="btn-primary"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Your First Guest
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guests.map((guest) => (
              <div key={guest.id} className="card">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {guest.first_name} {guest.last_name}
                    </h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/dashboard/guests/${guest.id}/edit`)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="Edit guest"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteGuest(guest.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Delete guest"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {guest.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <EnvelopeIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{guest.email}</span>
                      </div>
                    )}
                    
                    {guest.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <PhoneIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>{guest.phone}</span>
                      </div>
                    )}
                    
                    {guest.nationality && (
                      <div className="flex items-center text-sm text-gray-600">
                        <FlagIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>{guest.nationality}</span>
                      </div>
                    )}

                    {guest.id_number && (
                      <div className="flex items-center text-sm text-gray-600">
                        <IdentificationIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>ID: {guest.id_number}</span>
                      </div>
                    )}
                  </div>

                  {guest.notes && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600 line-clamp-2">{guest.notes}</p>
                    </div>
                  )}

                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <button 
                      onClick={() => router.push(`/dashboard/guests/${guest.id}`)}
                      className="btn-secondary w-full"
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

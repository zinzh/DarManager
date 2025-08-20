'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  HomeIcon,
  ArrowLeftIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  WifiIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

interface Property {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  wifi_password?: string;
  created_at: string;
  updated_at: string;
}

interface Room {
  id: string;
  property_id: string;
  name: string;
  description?: string;
  capacity: number;
  price_per_night?: number;
  status: string;
  keybox_code?: string;
  created_at: string;
  updated_at: string;
}

export default function PropertyDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
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
        // Fetch property details
        const propertyResponse = await fetch(`/api/properties/${propertyId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (propertyResponse.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          router.push('/login');
          return;
        }

        if (propertyResponse.ok) {
          const propertyData = await propertyResponse.json();
          setProperty(propertyData);
        } else {
          setError('Failed to load property details');
        }

        // Fetch rooms for this property
        const roomsResponse = await fetch(`/api/rooms?property_id=${propertyId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (roomsResponse.ok) {
          const roomsData = await roomsResponse.json();
          setRooms(roomsData);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Network error');
      } finally {
        setIsLoading(false);
      }
    };

    if (propertyId) {
      fetchData();
    }
  }, [propertyId, router]);

  const handleDeleteProperty = async () => {
    if (!property) return;
    
    if (!window.confirm(`Are you sure you want to delete "${property.name}"? This will also delete all rooms and cannot be undone.`)) {
      return;
    }

    const token = localStorage.getItem('access_token');
    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        router.push('/dashboard/properties');
      } else {
        alert('Failed to delete property');
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      alert('Network error while deleting property');
    }
  };

  const getRoomStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'occupied':
        return 'bg-red-100 text-red-800';
      case 'cleaning':
        return 'bg-yellow-100 text-yellow-800';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800';
      case 'out_of_order':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <HomeIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <div className="text-lg text-gray-600">Loading property details...</div>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error || 'Property not found'}</div>
          <button 
            onClick={() => router.push('/dashboard/properties')} 
            className="btn-primary"
          >
            Back to Properties
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
                onClick={() => router.push('/dashboard/properties')}
                className="mr-4 p-1 rounded-md hover:bg-gray-100 flex-shrink-0"
              >
                <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
              </button>
              <HomeIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600 mr-2 sm:mr-3 flex-shrink-0" />
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900 truncate">{property.name}</h1>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <button 
                onClick={() => router.push(`/dashboard/properties/${propertyId}/edit`)}
                className="btn-secondary"
              >
                <PencilIcon className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Edit</span>
              </button>
              <button 
                onClick={handleDeleteProperty}
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
        {/* Property Details */}
        <div className="card mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Property Information</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {property.description && (
                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
                  <p className="text-gray-900">{property.description}</p>
                </div>
              )}
              
              {property.address && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    <MapPinIcon className="h-4 w-4 inline mr-1" />
                    Address
                  </h3>
                  <p className="text-gray-900">{property.address}</p>
                </div>
              )}
              
              {property.phone && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    <PhoneIcon className="h-4 w-4 inline mr-1" />
                    Phone
                  </h3>
                  <p className="text-gray-900">{property.phone}</p>
                </div>
              )}
              
              {property.email && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    <EnvelopeIcon className="h-4 w-4 inline mr-1" />
                    Email
                  </h3>
                  <p className="text-gray-900">{property.email}</p>
                </div>
              )}
              
              {property.wifi_password && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    <WifiIcon className="h-4 w-4 inline mr-1" />
                    WiFi Password
                  </h3>
                  <p className="text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                    {property.wifi_password}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rooms Section */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Rooms</h2>
              <p className="text-sm text-gray-500">{rooms.length} room(s) in this property</p>
            </div>
            <button 
              onClick={() => router.push(`/dashboard/properties/${propertyId}/rooms/new`)}
              className="btn-primary"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Room
            </button>
          </div>
          
          <div className="p-6">
            {rooms.length === 0 ? (
              <div className="text-center py-8">
                <BuildingOfficeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms yet</h3>
                <p className="text-gray-600 mb-6">Add rooms to start managing your property inventory.</p>
                <button 
                  onClick={() => router.push(`/dashboard/properties/${propertyId}/rooms/new`)}
                  className="btn-primary"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Your First Room
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.map((room) => (
                  <div key={room.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{room.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${getRoomStatusColor(room.status)}`}>
                        {room.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    {room.description && (
                      <p className="text-sm text-gray-600 mb-2">{room.description}</p>
                    )}
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Capacity:</span>
                        <span className="text-gray-900">{room.capacity} guest(s)</span>
                      </div>
                      
                      {room.price_per_night && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Price:</span>
                          <span className="text-gray-900">${room.price_per_night}/night</span>
                        </div>
                      )}
                      
                      {room.keybox_code && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Keybox:</span>
                          <span className="text-gray-900 font-mono">{room.keybox_code}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-end space-x-2 mt-4 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => router.push(`/dashboard/properties/${propertyId}/rooms/${room.id}/edit`)}
                        className="text-gray-400 hover:text-blue-600"
                        title="Edit room"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete room "${room.name}"?`)) {
                            // TODO: Implement room deletion
                            alert('Room deletion not implemented yet');
                          }
                        }}
                        className="text-gray-400 hover:text-red-600"
                        title="Delete room"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  HomeIcon, 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  WifiIcon
} from '@heroicons/react/24/outline';

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
  created_at: string;
  updated_at: string;
}

export default function PropertiesPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchProperties = async () => {
      try {
        const response = await fetch('/api/properties', {
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
          setProperties(data);
        } else {
          setError('Failed to load properties');
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
        setError('Network error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, [router]);

  const handleDeleteProperty = async (propertyId: string) => {
    if (!window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
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
        setProperties(properties.filter(p => p.id !== propertyId));
      } else {
        alert('Failed to delete property');
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      alert('Network error while deleting property');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <HomeIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <div className="text-lg text-gray-600">Loading properties...</div>
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
              <button 
                onClick={() => router.push('/dashboard')}
                className="mr-4 p-1 rounded-md hover:bg-gray-100"
              >
                <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
              </button>
              <HomeIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600 mr-2 sm:mr-3" />
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Properties</h1>
            </div>
            <button 
              onClick={() => router.push('/dashboard/properties/new')}
              className="btn-primary"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Property
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

        {properties.length === 0 ? (
          <div className="text-center py-12">
            <HomeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No properties yet</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first guesthouse property.</p>
            <button 
              onClick={() => router.push('/dashboard/properties/new')}
              className="btn-primary"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Your First Property
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <div key={property.id} className="card">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {property.name}
                    </h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/dashboard/properties/${property.id}/edit`)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="Edit property"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProperty(property.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Delete property"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {property.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {property.description}
                    </p>
                  )}

                  <div className="space-y-2">
                    {property.address && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPinIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{property.address}</span>
                      </div>
                    )}
                    
                    {property.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <PhoneIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>{property.phone}</span>
                      </div>
                    )}
                    
                    {property.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <EnvelopeIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{property.email}</span>
                      </div>
                    )}
                    
                    {property.price_per_night && (
                      <div className="flex items-center text-sm font-semibold text-green-600">
                        <span>${Number(property.price_per_night || 0).toFixed(2)}/night</span>
                      </div>
                    )}
                    
                    {property.max_guests && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span>Up to {property.max_guests} guest{property.max_guests !== 1 ? 's' : ''}</span>
                      </div>
                    )}

                    {property.wifi_password && (
                      <div className="flex items-center text-sm text-gray-600">
                        <WifiIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>WiFi available</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <button 
                      onClick={() => router.push(`/dashboard/properties/${property.id}`)}
                      className="w-full btn-secondary justify-center"
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

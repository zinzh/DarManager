'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  BuildingOfficeIcon,
  ArrowLeftIcon,
  UserIcon,
  HashtagIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  KeyIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface RoomFormData {
  name: string;
  description: string;
  capacity: number;
  price_per_night: string;
  status: string;
  keybox_code: string;
}

interface Property {
  id: string;
  name: string;
}

const statusOptions = [
  { value: 'available', label: 'Available', color: 'text-green-600' },
  { value: 'occupied', label: 'Occupied', color: 'text-red-600' },
  { value: 'cleaning', label: 'Cleaning', color: 'text-yellow-600' },
  { value: 'maintenance', label: 'Maintenance', color: 'text-orange-600' },
  { value: 'out_of_order', label: 'Out of Order', color: 'text-gray-600' }
];

export default function EditRoomPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;
  const roomId = params.roomId as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [formData, setFormData] = useState<RoomFormData>({
    name: '',
    description: '',
    capacity: 1,
    price_per_night: '',
    status: 'available',
    keybox_code: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [errors, setErrors] = useState<Partial<RoomFormData>>({});

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

        // Fetch room details
        const roomResponse = await fetch(`/api/rooms/${roomId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (propertyResponse.status === 401 || roomResponse.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          router.push('/login');
          return;
        }

        if (propertyResponse.ok && roomResponse.ok) {
          const propertyData = await propertyResponse.json();
          const roomData = await roomResponse.json();
          
          setProperty(propertyData);
          setFormData({
            name: roomData.name || '',
            description: roomData.description || '',
            capacity: roomData.capacity || 1,
            price_per_night: roomData.price_per_night ? roomData.price_per_night.toString() : '',
            status: roomData.status || 'available',
            keybox_code: roomData.keybox_code || ''
          });
        } else {
          alert('Failed to load room or property data');
          router.push(`/dashboard/properties/${propertyId}`);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        alert('Network error occurred');
        router.push(`/dashboard/properties/${propertyId}`);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [propertyId, roomId, router]);

  const validateForm = (): boolean => {
    const newErrors: Partial<RoomFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Room name is required';
    }

    if (formData.capacity < 1) {
      newErrors.capacity = 'Capacity must be at least 1';
    }

    if (formData.price_per_night && isNaN(Number(formData.price_per_night))) {
      newErrors.price_per_night = 'Price must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const submitData = {
        ...formData,
        price_per_night: formData.price_per_night ? Number(formData.price_per_night) : null
      };

      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        router.push('/login');
        return;
      }

      if (response.ok) {
        router.push(`/dashboard/properties/${propertyId}`);
      } else {
        const errorData = await response.json();
        alert(`Failed to update room: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating room:', error);
      alert('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' ? Number(value) : value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof RoomFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BuildingOfficeIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <div className="text-lg text-gray-600">Loading room data...</div>
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
                onClick={() => router.push(`/dashboard/properties/${propertyId}`)}
                className="mr-4 p-1 rounded-md hover:bg-gray-100 flex-shrink-0"
              >
                <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
              </button>
              <BuildingOfficeIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600 mr-2 sm:mr-3 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Edit Room</h1>
                {property && (
                  <p className="text-sm text-gray-500 truncate">in {property.name}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Update Room Details</h2>
            <p className="mt-1 text-sm text-gray-600">
              Edit room information and configuration.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* Room Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  <UserIcon className="h-4 w-4 inline mr-1" />
                  Room Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className={`input-field ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="e.g., Master Bedroom, Living Room"
                  value={formData.name}
                  onChange={handleInputChange}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  <DocumentTextIcon className="h-4 w-4 inline mr-1" />
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  className="input-field"
                  placeholder="Describe the room features, amenities, etc."
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>

              {/* Capacity and Price */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
                    <HashtagIcon className="h-4 w-4 inline mr-1" />
                    Capacity (guests) *
                  </label>
                  <input
                    type="number"
                    id="capacity"
                    name="capacity"
                    min="1"
                    required
                    className={`input-field ${errors.capacity ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="2"
                    value={formData.capacity}
                    onChange={handleInputChange}
                  />
                  {errors.capacity && (
                    <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="price_per_night" className="block text-sm font-medium text-gray-700 mb-1">
                    <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
                    Price per Night (USD)
                  </label>
                  <input
                    type="number"
                    id="price_per_night"
                    name="price_per_night"
                    min="0"
                    step="0.01"
                    className={`input-field ${errors.price_per_night ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="50.00"
                    value={formData.price_per_night}
                    onChange={handleInputChange}
                  />
                  {errors.price_per_night && (
                    <p className="mt-1 text-sm text-red-600">{errors.price_per_night}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    Optional: Room-specific pricing (overrides property pricing)
                  </p>
                </div>
              </div>

              {/* Status and Keybox Code */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    <CheckCircleIcon className="h-4 w-4 inline mr-1" />
                    Room Status *
                  </label>
                  <select
                    id="status"
                    name="status"
                    required
                    className="input-field"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="keybox_code" className="block text-sm font-medium text-gray-700 mb-1">
                    <KeyIcon className="h-4 w-4 inline mr-1" />
                    Keybox Code
                  </label>
                  <input
                    type="text"
                    id="keybox_code"
                    name="keybox_code"
                    className="input-field"
                    placeholder="1234"
                    value={formData.keybox_code}
                    onChange={handleInputChange}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Access code for this specific room (if applicable)
                  </p>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 mt-6">
              <button
                type="button"
                onClick={() => router.push(`/dashboard/properties/${propertyId}`)}
                className="btn-secondary"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  'Update Room'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

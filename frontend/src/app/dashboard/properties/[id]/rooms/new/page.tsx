'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  BuildingOfficeIcon,
  ArrowLeftIcon,
  CurrencyDollarIcon,
  KeyIcon
} from '@heroicons/react/24/outline';

interface RoomFormData {
  name: string;
  description: string;
  capacity: number;
  price_per_night: string;
  status: string;
  keybox_code: string;
}

const ROOM_STATUSES = [
  { value: 'available', label: 'Available' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'out_of_order', label: 'Out of Order' }
];

export default function NewRoomPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;

  const [formData, setFormData] = useState<RoomFormData>({
    name: '',
    description: '',
    capacity: 1,
    price_per_night: '',
    status: 'available',
    keybox_code: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof RoomFormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof RoomFormData, string>> = {};

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
        property_id: propertyId,
        price_per_night: formData.price_per_night ? Number(formData.price_per_night) : null
      };

      const response = await fetch('/api/rooms', {
        method: 'POST',
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
        alert('Failed to create room: ' + (errorData.detail || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Network error. Please try again.');
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 sm:py-6">
            <div className="flex items-center">
              <button 
                onClick={() => router.push(`/dashboard/properties/${propertyId}`)}
                className="mr-4 p-1 rounded-md hover:bg-gray-100"
              >
                <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
              </button>
              <BuildingOfficeIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600 mr-2 sm:mr-3" />
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Add New Room</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Room Information</h2>
            <p className="text-sm text-gray-600">Add details about this room.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Room Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Room Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className={`input-field ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="e.g., Room 101, Blue Suite"
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
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="input-field"
                placeholder="Describe the room features..."
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>

            {/* Capacity and Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity *
                </label>
                <input
                  type="number"
                  id="capacity"
                  name="capacity"
                  min="1"
                  required
                  className={`input-field ${errors.capacity ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Number of guests"
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
              </div>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Room Status
              </label>
              <select
                id="status"
                name="status"
                className="input-field"
                value={formData.status}
                onChange={handleInputChange}
              >
                {ROOM_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Keybox Code */}
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
                placeholder="e.g., 1234, ABC123"
                value={formData.keybox_code}
                onChange={handleInputChange}
              />
              <p className="mt-1 text-sm text-gray-500">
                Code for guest access to the room key.
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
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
                {isLoading ? 'Creating...' : 'Create Room'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

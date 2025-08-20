'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  HomeIcon,
  ArrowLeftIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  WifiIcon
} from '@heroicons/react/24/outline';

interface PropertyFormData {
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  wifi_password: string;
}

export default function NewPropertyPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<PropertyFormData>({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    wifi_password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<PropertyFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<PropertyFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Property name is required';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phone && !/^[\+]?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
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
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        router.push('/login');
        return;
      }

      if (response.ok) {
        router.push('/dashboard/properties');
      } else {
        const errorData = await response.json();
        alert('Failed to create property: ' + (errorData.detail || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating property:', error);
      alert('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof PropertyFormData]) {
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
                onClick={() => router.push('/dashboard/properties')}
                className="mr-4 p-1 rounded-md hover:bg-gray-100"
              >
                <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
              </button>
              <HomeIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600 mr-2 sm:mr-3" />
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Add New Property</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Property Information</h2>
            <p className="text-sm text-gray-600">Add details about your guesthouse property.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Property Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Property Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className={`input-field ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Enter property name"
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
                placeholder="Describe your property..."
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                <MapPinIcon className="h-4 w-4 inline mr-1" />
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                className="input-field"
                placeholder="Enter property address"
                value={formData.address}
                onChange={handleInputChange}
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                <PhoneIcon className="h-4 w-4 inline mr-1" />
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                className={`input-field ${errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="+961 1 234567"
                value={formData.phone}
                onChange={handleInputChange}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                <EnvelopeIcon className="h-4 w-4 inline mr-1" />
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className={`input-field ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="property@example.com"
                value={formData.email}
                onChange={handleInputChange}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* WiFi Password */}
            <div>
              <label htmlFor="wifi_password" className="block text-sm font-medium text-gray-700 mb-1">
                <WifiIcon className="h-4 w-4 inline mr-1" />
                WiFi Password
              </label>
              <input
                type="text"
                id="wifi_password"
                name="wifi_password"
                className="input-field"
                placeholder="WiFi password for guests"
                value={formData.wifi_password}
                onChange={handleInputChange}
              />
              <p className="mt-1 text-sm text-gray-500">
                This will be shared with guests for internet access.
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push('/dashboard/properties')}
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
                {isLoading ? 'Creating...' : 'Create Property'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

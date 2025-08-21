'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  UserGroupIcon,
  ArrowLeftIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  FlagIcon,
  IdentificationIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface GuestFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  whatsapp: string;
  nationality: string;
  id_number: string;
  notes: string;
}

export default function EditGuestPage() {
  const router = useRouter();
  const params = useParams();
  const guestId = params.id as string;

  const [formData, setFormData] = useState<GuestFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    whatsapp: '',
    nationality: '',
    id_number: '',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [errors, setErrors] = useState<Partial<GuestFormData>>({});

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
          const guest = await response.json();
          setFormData({
            first_name: guest.first_name || '',
            last_name: guest.last_name || '',
            email: guest.email || '',
            phone: guest.phone || '',
            whatsapp: guest.whatsapp || '',
            nationality: guest.nationality || '',
            id_number: guest.id_number || '',
            notes: guest.notes || ''
          });
        } else {
          alert('Failed to load guest data');
          router.push('/dashboard/guests');
        }
      } catch (error) {
        console.error('Error fetching guest:', error);
        alert('Network error occurred');
        router.push('/dashboard/guests');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchGuest();
  }, [guestId, router]);

  const validateForm = (): boolean => {
    const newErrors: Partial<GuestFormData> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phone && !/^[\+]?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (formData.whatsapp && !/^[\+]?[\d\s\-\(\)]+$/.test(formData.whatsapp)) {
      newErrors.whatsapp = 'Please enter a valid WhatsApp number';
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
      
      // Filter out empty strings and send only non-empty values
      const submitData = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value.trim() !== '')
      );

      const response = await fetch(`/api/guests/${guestId}`, {
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
        router.push('/dashboard/guests');
      } else {
        const errorData = await response.json();
        alert(`Failed to update guest: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating guest:', error);
      alert('Network error occurred');
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
    if (errors[name as keyof GuestFormData]) {
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
          <UserGroupIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <div className="text-lg text-gray-600">Loading guest data...</div>
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
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Edit Guest</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Update Guest Information</h2>
            <p className="mt-1 text-sm text-gray-600">
              Edit guest details for booking management and communication.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                    <UserIcon className="h-4 w-4 inline mr-1" />
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    required
                    className={`input-field ${errors.first_name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Enter first name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                  />
                  {errors.first_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                    <UserIcon className="h-4 w-4 inline mr-1" />
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    required
                    className={`input-field ${errors.last_name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Enter last name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                  />
                  {errors.last_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    placeholder="guest@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

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
              </div>

              {/* WhatsApp and Nationality */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-1">
                    <PhoneIcon className="h-4 w-4 inline mr-1" />
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    id="whatsapp"
                    name="whatsapp"
                    className={`input-field ${errors.whatsapp ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="+961 70 123456"
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                  />
                  {errors.whatsapp && (
                    <p className="mt-1 text-sm text-red-600">{errors.whatsapp}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    For communication and confirmations
                  </p>
                </div>

                <div>
                  <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-1">
                    <FlagIcon className="h-4 w-4 inline mr-1" />
                    Nationality
                  </label>
                  <input
                    type="text"
                    id="nationality"
                    name="nationality"
                    className="input-field"
                    placeholder="Lebanese, American, etc."
                    value={formData.nationality}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* ID Number */}
              <div>
                <label htmlFor="id_number" className="block text-sm font-medium text-gray-700 mb-1">
                  <IdentificationIcon className="h-4 w-4 inline mr-1" />
                  ID Number
                </label>
                <input
                  type="text"
                  id="id_number"
                  name="id_number"
                  className="input-field"
                  placeholder="Passport or ID number"
                  value={formData.id_number}
                  onChange={handleInputChange}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Passport number, national ID, or other identification
                </p>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  <DocumentTextIcon className="h-4 w-4 inline mr-1" />
                  Additional Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  className="input-field"
                  placeholder="Special requests, preferences, or other notes..."
                  value={formData.notes}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 mt-6">
              <button
                type="button"
                onClick={() => router.push('/dashboard/guests')}
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
                  'Update Guest'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

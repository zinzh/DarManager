'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  CalendarIcon,
  ArrowLeftIcon,
  UserIcon,
  HomeIcon,
  HashtagIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface BookingFormData {
  property_id: string;
  guest_id: string;
  check_in_date: string;
  check_out_date: string;
  guests_count: number;
  total_amount: string;
  status: string;
  booking_source: string;
  notes: string;
}

interface Property {
  id: string;
  name: string;
  max_guests?: number;
  price_per_night?: number;
}

interface Guest {
  id: string;
  first_name: string;
  last_name: string;
}

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'checked_in', label: 'Checked In' },
  { value: 'checked_out', label: 'Checked Out' },
  { value: 'cancelled', label: 'Cancelled' }
];

const sourceOptions = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'phone', label: 'Phone Call' },
  { value: 'walk_in', label: 'Walk-in' },
  { value: 'email', label: 'Email' },
  { value: 'referral', label: 'Referral' },
  { value: 'other', label: 'Other' }
];

export default function NewBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedGuestId = searchParams.get('guest_id');
  const preSelectedPropertyId = searchParams.get('property_id');
  const preSelectedCheckInDate = searchParams.get('check_in_date');
  const preSelectedCheckOutDate = searchParams.get('check_out_date');
  const fromCalendar = searchParams.get('from_calendar') === 'true';
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [formData, setFormData] = useState<BookingFormData>({
    property_id: preSelectedPropertyId || '',
    guest_id: preSelectedGuestId || '',
    check_in_date: preSelectedCheckInDate || '',
    check_out_date: preSelectedCheckOutDate || '',
    guests_count: 1,
    total_amount: '',
    status: 'pending',
    booking_source: 'whatsapp',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [errors, setErrors] = useState<Partial<BookingFormData>>({});
  const [calculatedAmount, setCalculatedAmount] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Auto-calculate total amount when property or dates change
    if (formData.property_id && formData.check_in_date && formData.check_out_date) {
      calculateTotalAmount();
    }
  }, [formData.property_id, formData.check_in_date, formData.check_out_date]);

  const fetchData = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const [propertiesResponse, guestsResponse] = await Promise.all([
        fetch('/api/properties', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/guests', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (propertiesResponse.status === 401 || guestsResponse.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        router.push('/login');
        return;
      }

      if (propertiesResponse.ok && guestsResponse.ok) {
        const [propertiesData, guestsData] = await Promise.all([
          propertiesResponse.json(),
          guestsResponse.json()
        ]);
        
        setProperties(propertiesData);
        setGuests(guestsData);
      } else {
        alert('Failed to load properties or guests');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Network error occurred');
    } finally {
      setIsLoadingData(false);
    }
  };

  const calculateTotalAmount = () => {
    const property = properties.find(p => p.id === formData.property_id);
    if (!property || !property.price_per_night || !formData.check_in_date || !formData.check_out_date) {
      setCalculatedAmount(null);
      return;
    }

    const checkIn = new Date(formData.check_in_date);
    const checkOut = new Date(formData.check_out_date);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    
    if (nights > 0) {
      const total = nights * property.price_per_night;
      setCalculatedAmount(total);
      setFormData(prev => ({ ...prev, total_amount: total.toString() }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<BookingFormData> = {};

    if (!formData.property_id) {
      newErrors.property_id = 'Property is required';
    }

    if (!formData.guest_id) {
      newErrors.guest_id = 'Guest is required';
    }

    if (!formData.check_in_date) {
      newErrors.check_in_date = 'Check-in date is required';
    }

    if (!formData.check_out_date) {
      newErrors.check_out_date = 'Check-out date is required';
    }

    if (formData.check_in_date && formData.check_out_date) {
      if (new Date(formData.check_in_date) >= new Date(formData.check_out_date)) {
        newErrors.check_out_date = 'Check-out date must be after check-in date';
      }
    }

    if (formData.guests_count < 1) {
      newErrors.guests_count = 'Number of guests must be at least 1';
    }

    // Check against property capacity
    const property = properties.find(p => p.id === formData.property_id);
    if (property && property.max_guests && formData.guests_count > property.max_guests) {
      newErrors.guests_count = `Property capacity is ${property.max_guests} guests`;
    }

    if (formData.total_amount && isNaN(Number(formData.total_amount))) {
      newErrors.total_amount = 'Total amount must be a valid number';
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
        total_amount: formData.total_amount ? Number(formData.total_amount) : null,
        booking_source: formData.booking_source || null,
        notes: formData.notes || null
      };

      const response = await fetch('/api/bookings', {
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
        // Navigate back to where we came from
        if (fromCalendar) {
          router.push('/dashboard/calendar');
        } else {
          router.push('/dashboard/bookings');
        }
      } else {
        const errorData = await response.json();
        alert(`Failed to create booking: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'guests_count' ? Number(value) : value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof BookingFormData]) {
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
          <CalendarIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <div className="text-lg text-gray-600">Loading booking form...</div>
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
                onClick={() => fromCalendar ? router.push('/dashboard/calendar') : router.push('/dashboard/bookings')}
                className="mr-4 p-1 rounded-md hover:bg-gray-100 flex-shrink-0"
              >
                <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
              </button>
              <CalendarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600 mr-2 sm:mr-3 flex-shrink-0" />
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Create New Booking</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Booking Details</h2>
            <p className="mt-1 text-sm text-gray-600">
              Create a new reservation for your property.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* Property and Guest Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="property_id" className="block text-sm font-medium text-gray-700 mb-1">
                    <HomeIcon className="h-4 w-4 inline mr-1" />
                    Property *
                  </label>
                  <select
                    id="property_id"
                    name="property_id"
                    required
                    className={`input-field ${errors.property_id ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    value={formData.property_id}
                    onChange={handleInputChange}
                  >
                    <option value="">Select a property</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.name}
                        {property.price_per_night && ` - $${property.price_per_night}/night`}
                        {property.max_guests && ` (max ${property.max_guests} guests)`}
                      </option>
                    ))}
                  </select>
                  {errors.property_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.property_id}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="guest_id" className="block text-sm font-medium text-gray-700 mb-1">
                    <UserIcon className="h-4 w-4 inline mr-1" />
                    Guest *
                  </label>
                  <select
                    id="guest_id"
                    name="guest_id"
                    required
                    className={`input-field ${errors.guest_id ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    value={formData.guest_id}
                    onChange={handleInputChange}
                  >
                    <option value="">Select a guest</option>
                    {guests.map((guest) => (
                      <option key={guest.id} value={guest.id}>
                        {guest.first_name} {guest.last_name}
                      </option>
                    ))}
                  </select>
                  {errors.guest_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.guest_id}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    Don't see the guest? <button type="button" onClick={() => router.push('/dashboard/guests/new')} className="text-blue-600 hover:text-blue-800">Add new guest</button>
                  </p>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="check_in_date" className="block text-sm font-medium text-gray-700 mb-1">
                    Check-in Date *
                  </label>
                  <input
                    type="date"
                    id="check_in_date"
                    name="check_in_date"
                    required
                    className={`input-field ${errors.check_in_date ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    value={formData.check_in_date}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {errors.check_in_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.check_in_date}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="check_out_date" className="block text-sm font-medium text-gray-700 mb-1">
                    Check-out Date *
                  </label>
                  <input
                    type="date"
                    id="check_out_date"
                    name="check_out_date"
                    required
                    className={`input-field ${errors.check_out_date ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    value={formData.check_out_date}
                    onChange={handleInputChange}
                    min={formData.check_in_date || new Date().toISOString().split('T')[0]}
                  />
                  {errors.check_out_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.check_out_date}</p>
                  )}
                </div>
              </div>

              {/* Guest Count and Total Amount */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="guests_count" className="block text-sm font-medium text-gray-700 mb-1">
                    <HashtagIcon className="h-4 w-4 inline mr-1" />
                    Number of Guests *
                  </label>
                  <input
                    type="number"
                    id="guests_count"
                    name="guests_count"
                    min="1"
                    required
                    className={`input-field ${errors.guests_count ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    value={formData.guests_count}
                    onChange={handleInputChange}
                  />
                  {errors.guests_count && (
                    <p className="mt-1 text-sm text-red-600">{errors.guests_count}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="total_amount" className="block text-sm font-medium text-gray-700 mb-1">
                    <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
                    Total Amount (USD)
                  </label>
                  <input
                    type="number"
                    id="total_amount"
                    name="total_amount"
                    min="0"
                    step="0.01"
                    className={`input-field ${errors.total_amount ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    value={formData.total_amount}
                    onChange={handleInputChange}
                  />
                  {errors.total_amount && (
                    <p className="mt-1 text-sm text-red-600">{errors.total_amount}</p>
                  )}
                  {calculatedAmount && (
                    <p className="mt-1 text-sm text-green-600">
                      Calculated: ${calculatedAmount} (based on property pricing)
                    </p>
                  )}
                </div>
              </div>

              {/* Status and Source */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    <CheckCircleIcon className="h-4 w-4 inline mr-1" />
                    Booking Status
                  </label>
                  <select
                    id="status"
                    name="status"
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
                  <label htmlFor="booking_source" className="block text-sm font-medium text-gray-700 mb-1">
                    Booking Source
                  </label>
                  <select
                    id="booking_source"
                    name="booking_source"
                    className="input-field"
                    value={formData.booking_source}
                    onChange={handleInputChange}
                  >
                    {sourceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    How did this booking come in?
                  </p>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  <DocumentTextIcon className="h-4 w-4 inline mr-1" />
                  Notes & Special Requests
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
                onClick={() => fromCalendar ? router.push('/dashboard/calendar') : router.push('/dashboard/bookings')}
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
                    Creating...
                  </>
                ) : (
                  'Create Booking'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

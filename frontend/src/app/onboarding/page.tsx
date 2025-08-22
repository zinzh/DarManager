'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/contexts/TenantContext';
import { 
  BuildingOfficeIcon, 
  UsersIcon, 
  CalendarIcon, 
  CreditCardIcon,
  CheckCircleIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

export default function OnboardingPage() {
  const { tenant, isLoading, error } = useTenant();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const user = await response.json();
          setCurrentUser(user);
        } else {
          router.push('/login');
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Unable to load tenant information</h3>
          <p className="text-gray-500 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  const steps = [
    {
      id: 1,
      title: 'Add Your First Property',
      description: 'Create your guesthouse listing with details, photos, and pricing.',
      icon: BuildingOfficeIcon,
      action: 'Add Property',
      link: '/dashboard/properties/new',
      completed: false,
    },
    {
      id: 2,
      title: 'Set Up Guest Database',
      description: 'Add your existing guests or create new guest profiles.',
      icon: UsersIcon,
      action: 'Add Guests',
      link: '/dashboard/guests/new',
      completed: false,
    },
    {
      id: 3,
      title: 'Create Your First Booking',
      description: 'Test the booking system with a sample reservation.',
      icon: CalendarIcon,
      action: 'New Booking',
      link: '/dashboard/bookings/new',
      completed: false,
    },
    {
      id: 4,
      title: 'Explore the Calendar',
      description: 'View and manage all your bookings in the calendar interface.',
      icon: CalendarIcon,
      action: 'View Calendar',
      link: '/dashboard/calendar',
      completed: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome to DarManager!
              </h1>
              <p className="text-gray-600">
                {tenant ? `${tenant.name} - Let's get you started` : 'Let\'s get you started'}
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircleIcon className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Your Account is Ready!
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Welcome to DarManager, the complete property management solution for Lebanese guesthouses. 
            Follow these steps to set up your account and start managing bookings like a pro.
          </p>
        </div>

        {tenant && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-medium text-blue-900 mb-2">Your Tenant Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-800">Business Name:</span>
                <span className="ml-2 text-blue-700">{tenant.name}</span>
              </div>
              <div>
                <span className="font-medium text-blue-800">Your URL:</span>
                <span className="ml-2 text-blue-700">
                  {tenant.subdomain}.darmanager.net
                </span>
              </div>
              <div>
                <span className="font-medium text-blue-800">Contact Email:</span>
                <span className="ml-2 text-blue-700">{tenant.contact_email}</span>
              </div>
              <div>
                <span className="font-medium text-blue-800">Account Status:</span>
                <span className="ml-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Steps */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Quick Setup Steps
          </h3>
          
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <step.icon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">
                        {step.id}. {step.title}
                      </h4>
                      <p className="text-gray-600 mt-1">
                        {step.description}
                      </p>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      <button
                        onClick={() => router.push(step.link)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                      >
                        <PlayIcon className="h-4 w-4 mr-1" />
                        {step.action}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Help Section */}
        <div className="mt-12 bg-gray-100 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Need Help?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900">📚 Documentation</h4>
              <p>Visit our help center for detailed guides and tutorials.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">💬 Support</h4>
              <p>Contact our support team for personalized assistance.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">🎥 Video Tutorials</h4>
              <p>Watch step-by-step videos to learn the platform.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">📧 Email Support</h4>
              <p>Email us at support@darmanager.net for help.</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Ready to Start Managing Your Guesthouse?
          </h3>
          <div className="space-x-4">
            <button
              onClick={() => router.push('/dashboard/properties/new')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
            >
              Add Your First Property
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-medium"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

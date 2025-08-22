'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BuildingOfficeIcon,
  CalendarIcon,
  UsersIcon,
  CreditCardIcon,
  ChartBarIcon,
  GlobeAltIcon,
  CheckIcon,
  ArrowRightIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

export default function LandingPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const features = [
    {
      icon: BuildingOfficeIcon,
      title: 'Property Management',
      description: 'Manage multiple properties with detailed information, pricing, and availability.'
    },
    {
      icon: CalendarIcon,
      title: 'Booking Calendar',
      description: 'Visual calendar for managing reservations, availability, and preventing overlaps.'
    },
    {
      icon: UsersIcon,
      title: 'Guest Database',
      description: 'Comprehensive guest profiles with contact info, history, and preferences.'
    },
    {
      icon: CreditCardIcon,
      title: 'Payment Tracking',
      description: 'Track payments, revenue, and financial reporting with multiple payment methods.'
    },
    {
      icon: ChartBarIcon,
      title: 'Analytics & Reports',
      description: 'Detailed insights into occupancy rates, revenue trends, and business performance.'
    },
    {
      icon: GlobeAltIcon,
      title: 'Multi-Channel Integration',
      description: 'Handle bookings from WhatsApp, Instagram, phone calls, and direct bookings.'
    }
  ];



  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 lg:py-6">
            <div className="flex items-center min-w-0 flex-shrink-0">
              <BuildingOfficeIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mr-2 sm:mr-3" />
              <span className="text-lg sm:text-2xl font-bold text-gray-900 truncate">DarManager</span>
            </div>
            
            {/* Mobile Layout */}
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-4 min-w-0">
              <div className="flex items-center gap-2 sm:gap-4">
                <button
                  onClick={() => router.push('/access')}
                  className="text-xs sm:text-sm text-gray-700 hover:text-blue-600 font-medium whitespace-nowrap"
                >
                  Client Login
                </button>
                <a
                  href="mailto:contact@darmanager.com"
                  className="hidden sm:inline text-gray-700 hover:text-blue-600 font-medium whitespace-nowrap"
                >
                  Contact Sales
                </a>
              </div>
              <a
                href="mailto:demo@darmanager.com"
                className="bg-blue-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-blue-700 font-medium text-xs sm:text-sm whitespace-nowrap"
              >
                Request Demo
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Property Management
              <span className="block text-blue-600">Made Simple</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              The complete property management solution for modern guesthouses and hotels. 
              Manage bookings, guests, and revenue all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:contact@darmanager.com?subject=DarManager Demo Request"
                className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 font-semibold text-lg flex items-center justify-center"
              >
                Request Demo
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </a>
              <a
                href="mailto:contact@darmanager.com?subject=DarManager Information"
                className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg hover:bg-gray-50 font-semibold text-lg"
              >
                Contact Sales
              </a>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Enterprise solutions available • Trusted worldwide
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Your Properties
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Streamline your guesthouse operations with our comprehensive management platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-xl hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modern Features Section */}
      <section className="py-20 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Built for Modern Hospitality
              </h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckIcon className="h-6 w-6 text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Multi-Channel Bookings</h3>
                    <p className="text-gray-600">WhatsApp, Instagram, phone calls, and direct bookings</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckIcon className="h-6 w-6 text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Flexible Payment Methods</h3>
                    <p className="text-gray-600">Multiple payment options, transfers, and cash tracking</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckIcon className="h-6 w-6 text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Property-Level Management</h3>
                    <p className="text-gray-600">Rent entire properties, not just individual rooms</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckIcon className="h-6 w-6 text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Multi-Language Support</h3>
                    <p className="text-gray-600">Intuitive interface with comprehensive documentation</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-xl">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Get Started?</h3>
                <p className="text-gray-600 mb-6">
                  Join property owners worldwide who trust DarManager for their business
                </p>
                <a
                  href="mailto:contact@darmanager.com?subject=DarManager Setup Request"
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold text-center block"
                >
                  Get Your Instance
                </a>
                <p className="text-sm text-gray-500 mt-3">
                  Your own branded subdomain: yourname.darmanager.net
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Property Management?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join hundreds of property owners who have streamlined their operations with DarManager
          </p>
          <a
            href="mailto:contact@darmanager.com?subject=DarManager Partnership"
            className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 font-semibold text-lg"
          >
            Partner With Us Today
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <BuildingOfficeIcon className="h-6 w-6 text-blue-600 mr-2" />
                <span className="text-xl font-bold text-gray-900">DarManager</span>
              </div>
              <p className="text-gray-600">
                The leading property management platform for modern hospitality businesses.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Product</h3>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-blue-600">Features</a></li>
                <li><a href="#" className="hover:text-blue-600">Pricing</a></li>
                <li><a href="#" className="hover:text-blue-600">Demo</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Support</h3>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-blue-600">Help Center</a></li>
                <li><a href="#" className="hover:text-blue-600">Documentation</a></li>
                <li><a href="#" className="hover:text-blue-600">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Contact</h3>
              <div className="space-y-2 text-gray-600">
                <div className="flex items-center">
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  <span>support@darmanager.com</span>
                </div>
                <div className="flex items-center">
                  <PhoneIcon className="h-4 w-4 mr-2" />
                  <span>+961 XX XXX XXX</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-600">
            <p>&copy; 2025 DarManager. All rights reserved.</p>
            <div className="mt-2">
              <button
                onClick={() => router.push('/admin-login')}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Platform Administration
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
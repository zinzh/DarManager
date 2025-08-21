'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BuildingOfficeIcon,
  ArrowRightIcon,
  GlobeAltIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

export default function AccessPage() {
  const router = useRouter();
  const [subdomain, setSubdomain] = useState('');

  const handleSubdomainAccess = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (subdomain.trim()) {
      // Force a complete page reload to the tenant subdomain
      // In development, redirect to subdomain.localhost/login
      // In production, this would be subdomain.darmanager.com/login
      const targetUrl = `http://${subdomain.toLowerCase()}.localhost/login`;
      
      // Try multiple methods to ensure the redirect works
      try {
        // Method 1: Direct assignment (should work)
        window.location.assign(targetUrl);
      } catch (error) {
        // Method 2: If assign fails, try replace
        window.location.replace(targetUrl);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back to main site */}
      <div className="absolute top-4 left-4">
        <button
          onClick={() => router.push('/')}
          className="flex items-center text-gray-600 hover:text-blue-600"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to DarManager
        </button>
      </div>

      <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <BuildingOfficeIcon className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Access Your DarManager Instance
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your organization's subdomain to access your dashboard
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10">
            <form onSubmit={handleSubdomainAccess} className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md text-sm">
                <div className="flex items-start">
                  <GlobeAltIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Tenant Access</p>
                    <p className="text-blue-600">Each organization has their own secure subdomain for accessing DarManager.</p>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700">
                  Your Organization's Subdomain
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    id="subdomain"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value)}
                    className="flex-1 block w-full border-gray-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="yourcompany"
                  />
                  <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    .darmanager.com
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Example: If your URL is "myhotel.darmanager.com", enter "myhotel"
                </p>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={!subdomain.trim()}
                  className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Access Dashboard
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <div className="text-sm text-gray-600">
                <p className="mb-2">Don't know your subdomain?</p>
                <a
                  href="mailto:support@darmanager.com?subject=Subdomain Help"
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
                  Contact Support
                </a>
              </div>
            </div>

            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Example URLs:</h3>
              <div className="space-y-1 text-xs text-gray-600">
                <p>• Hotel Phoenicia: <code>phoenicia.darmanager.com</code></p>
                <p>• Byblos Guesthouse: <code>byblos.darmanager.com</code></p>
                <p>• Baalbek Inn: <code>baalbek.darmanager.com</code></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
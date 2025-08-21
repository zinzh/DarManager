'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HomeIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        // Store the token in localStorage (in production, consider more secure storage)
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        
        // Check user info for role-based redirects
        try {
          const userResponse = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${data.access_token}`,
            },
          });
          
          if (userResponse.ok) {
            const user = await userResponse.json();
            
            // Super admin goes to admin dashboard
            if (user.role === 'super_admin') {
              router.push('/admin');
              return;
            }
            
            // Check if this is a new tenant (no properties yet)
            const propertiesResponse = await fetch('/api/properties', {
              headers: {
                'Authorization': `Bearer ${data.access_token}`,
              },
            });
            
            if (propertiesResponse.ok) {
              const properties = await propertiesResponse.json();
              
              // If no properties, redirect to onboarding
              if (properties.length === 0) {
                router.push('/onboarding');
                return;
              }
            }
          }
        } catch (err) {
          console.error('Error checking user info:', err);
        }
        
        // Default redirect to dashboard
        router.push('/dashboard');
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <HomeIcon className="h-12 w-12 text-primary-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Sign in to DarManager
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Guesthouse Management System for Lebanon
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card px-4 py-8 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input-field"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="input-field pr-10"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary justify-center"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Demo Credentials</span>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600 bg-blue-50 p-4 rounded-md">
              <p className="font-medium text-blue-900 mb-2">For testing:</p>
              <p><strong>Email:</strong> admin@darmanager.com</p>
              <p><strong>Password:</strong> admin123</p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button 
              onClick={() => router.push('/')}
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              ← Back to homepage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

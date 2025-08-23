'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HomeIcon, EyeIcon, EyeSlashIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { useTenant } from '@/contexts/TenantContext';
import { useAuthStore } from '@/stores/useAuthStore';
import { useFormValidation, loginSchema, LoginFormData } from '@/hooks/useFormValidation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function LoginPage() {
  const router = useRouter();
  const { tenant, subdomain, isLoading: tenantLoading } = useTenant();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useFormValidation<LoginFormData>({
    schema: loginSchema,
  });

  const onSubmit = async (data: LoginFormData) => {
    clearError();
    
    const success = await login(data);
    
    if (success) {
      // Check user role and redirect accordingly
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      
      if (response.ok) {
        const user = await response.json();
        
        // Super admin goes to admin dashboard
        if (user.role === 'super_admin') {
          router.push('/admin');
          return;
        }
        
        // Check if this is a new tenant (no properties yet)
        const propertiesResponse = await fetch('/api/properties', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
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
      
      // Default redirect to dashboard
      router.push('/dashboard');
    }
  };

  if (tenantLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <HomeIcon className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {tenant ? `Welcome to ${tenant.name}` : 'Welcome to DarManager'}
          </h2>
          {subdomain && (
            <p className="mt-2 text-sm text-gray-600">
              Signing in to {subdomain}.darmanager.net
            </p>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in to your account</CardTitle>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <InformationCircleIcon className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <Input
                {...register('email')}
                type="email"
                label="Email address"
                placeholder="Enter your email"
                error={errors.email?.message}
                required
              />

              <div className="relative">
                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
                  placeholder="Enter your password"
                  error={errors.password?.message}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ top: '24px' }}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading || isSubmitting}
                className="w-full"
              >
                {isLoading || isSubmitting ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have access? Contact your administrator
          </p>
        </div>
      </div>
    </div>
  );
}
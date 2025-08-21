'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  domain?: string;
  contact_email: string;
  contact_phone?: string;
  is_active: boolean;
}

interface TenantContextType {
  tenant: Tenant | null;
  subdomain: string | null;
  isLoading: boolean;
  error: string | null;
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  subdomain: null,
  isLoading: true,
  error: null,
});

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

interface TenantProviderProps {
  children: React.ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const detectTenant = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Extract subdomain from current URL
        const host = window.location.host;
        let detectedSubdomain = null;

        // Check for subdomain patterns
        if (host.includes('.localhost')) {
          // tenant.localhost -> tenant
          detectedSubdomain = host.split('.localhost')[0];
        } else if (host.includes('.darmanager.com')) {
          // tenant.darmanager.com -> tenant
          detectedSubdomain = host.split('.darmanager.com')[0];
        } else if (host === 'localhost' || host.startsWith('localhost:')) {
          // Development mode - no tenant
          detectedSubdomain = null;
        }

        setSubdomain(detectedSubdomain);

        // If we have a subdomain, fetch tenant information
        if (detectedSubdomain) {
          try {
            const response = await fetch('/api/tenant/current', {
              headers: {
                'X-Tenant-Subdomain': detectedSubdomain,
              },
            });

            if (response.ok) {
              const tenantData = await response.json();
              setTenant(tenantData);
            } else if (response.status === 404) {
              setError(`Tenant '${detectedSubdomain}' not found`);
            } else {
              setError('Failed to load tenant information');
            }
          } catch (err) {
            console.error('Error fetching tenant:', err);
            setError('Failed to connect to server');
          }
        }
      } catch (err) {
        console.error('Error detecting tenant:', err);
        setError('Failed to detect tenant');
      } finally {
        setIsLoading(false);
      }
    };

    detectTenant();
  }, []);

  return (
    <TenantContext.Provider value={{ tenant, subdomain, isLoading, error }}>
      {children}
    </TenantContext.Provider>
  );
};

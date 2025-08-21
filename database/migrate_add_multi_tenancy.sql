-- Migration: Add Multi-Tenancy Support to DarManager
-- This migration adds tenant support to the existing database schema

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(50) UNIQUE NOT NULL,
    domain VARCHAR(255) UNIQUE,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create updated_at trigger for tenants
CREATE TRIGGER update_tenants_updated_at 
    BEFORE UPDATE ON tenants 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

-- Add SUPER_ADMIN role to user roles enum
ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'super_admin';

-- Add tenant_id to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Add tenant_id to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE;

-- Add tenant_id to guests table  
ALTER TABLE guests ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_properties_tenant_id ON properties(tenant_id);
CREATE INDEX IF NOT EXISTS idx_guests_tenant_id ON guests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON tenants(domain);

-- Create a default tenant for existing data (if any)
DO $$
DECLARE
    default_tenant_id UUID;
    user_count INTEGER;
    property_count INTEGER;
    guest_count INTEGER;
BEGIN
    -- Check if there's existing data
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO property_count FROM properties;
    SELECT COUNT(*) INTO guest_count FROM guests;
    
    -- Only create default tenant if there's existing data
    IF user_count > 0 OR property_count > 0 OR guest_count > 0 THEN
        -- Create default tenant
        INSERT INTO tenants (name, subdomain, contact_email)
        VALUES ('Default Tenant', 'default', 'admin@darmanager.com')
        ON CONFLICT (subdomain) DO NOTHING
        RETURNING id INTO default_tenant_id;
        
        -- If tenant already exists, get its ID
        IF default_tenant_id IS NULL THEN
            SELECT id INTO default_tenant_id FROM tenants WHERE subdomain = 'default';
        END IF;
        
        -- Update existing properties to belong to default tenant
        UPDATE properties 
        SET tenant_id = default_tenant_id 
        WHERE tenant_id IS NULL;
        
        -- Update existing guests to belong to default tenant
        UPDATE guests 
        SET tenant_id = default_tenant_id 
        WHERE tenant_id IS NULL;
        
        -- Update existing non-super-admin users to belong to default tenant
        UPDATE users 
        SET tenant_id = default_tenant_id 
        WHERE tenant_id IS NULL AND role != 'super_admin';
        
        RAISE NOTICE 'Default tenant created and existing data migrated';
    END IF;
END $$;

-- Make tenant_id NOT NULL for properties and guests (after migration)
-- Note: This will be enforced by the application logic for new records

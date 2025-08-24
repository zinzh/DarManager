/**
 * Custom hook for form validation using React Hook Form and Zod.
 * Provides consistent form handling across the application.
 */

import { useForm, UseFormProps, UseFormReturn, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ZodSchema, ZodType } from 'zod';

interface UseFormValidationProps<T extends FieldValues> extends Omit<UseFormProps<T>, 'resolver'> {
  schema: ZodSchema<T>;
}

export function useFormValidation<T extends FieldValues>(
  props: UseFormValidationProps<T>
): UseFormReturn<T> {
  const { schema, ...formProps } = props;

  return useForm<T>({
    resolver: zodResolver(schema),
    ...formProps,
  });
}

// Common validation schemas
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const propertySchema = z.object({
  name: z.string().min(1, 'Property name is required'),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  wifi_password: z.string().optional(),
  price_per_night: z.number().min(0, 'Price must be positive'),
  max_guests: z.number().min(1, 'At least 1 guest required'),
});

export const guestSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone is required'),
  nationality: z.string().optional(),
  id_type: z.string().optional(),
  id_number: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export const bookingSchema = z.object({
  property_id: z.string().min(1, 'Property is required'),
  guest_id: z.string().min(1, 'Guest is required'),
  check_in_date: z.string().min(1, 'Check-in date is required'),
  check_out_date: z.string().min(1, 'Check-out date is required'),
  num_guests: z.number().min(1, 'At least 1 guest required'),
  total_amount: z.number().min(0, 'Amount must be positive'),
  status: z.enum(['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled']),
  booking_source: z.string().optional(),
  special_requests: z.string().optional(),
}).refine((data) => {
  return new Date(data.check_out_date) > new Date(data.check_in_date);
}, {
  message: 'Check-out date must be after check-in date',
  path: ['check_out_date'],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type PropertyFormData = z.infer<typeof propertySchema>;
export type GuestFormData = z.infer<typeof guestSchema>;
export type BookingFormData = z.infer<typeof bookingSchema>;
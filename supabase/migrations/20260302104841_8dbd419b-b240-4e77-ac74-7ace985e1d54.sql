-- Add payment tracking columns to orders
ALTER TABLE public.orders ADD COLUMN is_paid boolean NOT NULL DEFAULT false;
ALTER TABLE public.orders ADD COLUMN payment_method text DEFAULT NULL;
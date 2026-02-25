
-- Add loyalty tracking columns to customers
ALTER TABLE public.customers
ADD COLUMN purchase_count integer NOT NULL DEFAULT 0,
ADD COLUMN loyalty_rewards_claimed integer NOT NULL DEFAULT 0;

-- Create user_settings table for PIN, preferences
CREATE TABLE public.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  pin_hash text,
  hide_profit boolean NOT NULL DEFAULT false,
  dark_mode boolean NOT NULL DEFAULT false,
  last_backup_reminder timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own settings"
ON public.user_settings
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

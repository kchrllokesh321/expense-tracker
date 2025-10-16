-- Add pin_enabled column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS pin_enabled boolean DEFAULT false;
-- Drop existing RLS policies on profiles table
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Disable Row Level Security on profiles table
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
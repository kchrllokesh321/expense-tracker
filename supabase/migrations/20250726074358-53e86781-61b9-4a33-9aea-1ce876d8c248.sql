-- Simplify the find_or_create_user_by_username function to only handle profiles
-- Remove auth.users insertion and let Supabase handle anonymous authentication

CREATE OR REPLACE FUNCTION public.find_or_create_user_by_username(input_username text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  existing_profile_record RECORD;
  new_user_id UUID;
BEGIN
  -- Try to find existing user by username
  SELECT user_id, username INTO existing_profile_record 
  FROM public.profiles 
  WHERE username = input_username 
  LIMIT 1;
  
  IF existing_profile_record.user_id IS NOT NULL THEN
    RETURN existing_profile_record.user_id;
  END IF;
  
  -- If no existing profile, create new profile with the current auth user ID
  -- The auth user should already exist from signInAnonymously() call
  new_user_id := auth.uid();
  
  IF new_user_id IS NULL THEN
    RAISE EXCEPTION 'No authenticated user found. Please sign in first.';
  END IF;
  
  -- Insert into profiles table only
  INSERT INTO public.profiles (user_id, username, pin_enabled, full_name)
  VALUES (new_user_id, input_username, false, input_username);
  
  RETURN new_user_id;
END;
$function$;
-- Remove foreign key constraint that's causing the issue
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Update the find_or_create_user_by_username function to handle user creation properly
CREATE OR REPLACE FUNCTION public.find_or_create_user_by_username(input_username text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  existing_user_id UUID;
  new_user_id UUID;
BEGIN
  -- Try to find existing user by username
  SELECT user_id INTO existing_user_id 
  FROM public.profiles 
  WHERE username = input_username 
  LIMIT 1;
  
  IF existing_user_id IS NOT NULL THEN
    RETURN existing_user_id;
  END IF;
  
  -- Create new user if not found
  new_user_id := gen_random_uuid();
  
  INSERT INTO public.profiles (user_id, username, pin_enabled, full_name)
  VALUES (new_user_id, input_username, false, input_username);
  
  RETURN new_user_id;
END;
$$;
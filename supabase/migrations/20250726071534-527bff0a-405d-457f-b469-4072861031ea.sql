-- Update the find_or_create_user_by_username function to work with Supabase anonymous auth
CREATE OR REPLACE FUNCTION public.find_or_create_user_by_username(input_username text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  existing_profile_record RECORD;
  new_user_id UUID;
  auth_result RECORD;
BEGIN
  -- Try to find existing user by username
  SELECT user_id, username INTO existing_profile_record 
  FROM public.profiles 
  WHERE username = input_username 
  LIMIT 1;
  
  IF existing_profile_record.user_id IS NOT NULL THEN
    RETURN existing_profile_record.user_id;
  END IF;
  
  -- Create new anonymous user in auth.users if not found
  new_user_id := gen_random_uuid();
  
  -- Insert into auth.users (anonymous user)
  INSERT INTO auth.users (
    id,
    aud,
    role,
    email,
    raw_user_meta_data,
    is_anonymous,
    created_at,
    updated_at,
    confirmation_token,
    email_confirmed_at
  ) VALUES (
    new_user_id,
    'authenticated',
    'authenticated', 
    null,
    jsonb_build_object('username', input_username),
    true,
    now(),
    now(),
    '',
    now()
  );
  
  -- Insert into profiles
  INSERT INTO public.profiles (user_id, username, pin_enabled, full_name)
  VALUES (new_user_id, input_username, false, input_username);
  
  RETURN new_user_id;
END;
$function$
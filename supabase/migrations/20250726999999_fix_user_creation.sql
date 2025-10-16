-- Drop and recreate the function with proper transaction handling and error checks
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
  -- Use transaction to prevent race conditions
  BEGIN
    -- Try to find existing user by username
    SELECT user_id, username INTO existing_profile_record 
    FROM public.profiles 
    WHERE username = input_username 
    LIMIT 1
    FOR UPDATE;  -- Lock the row if found
    
    IF existing_profile_record.user_id IS NOT NULL THEN
      RETURN existing_profile_record.user_id;
    END IF;
    
    -- Create new anonymous user in auth.users if not found
    new_user_id := auth.uid();  -- Get current session's user ID
    
    IF new_user_id IS NULL THEN
      RAISE EXCEPTION 'No authenticated user found';
    END IF;
    
    -- Insert into profiles (will fail if username was taken in a concurrent transaction)
    INSERT INTO public.profiles (user_id, username, pin_enabled, full_name)
    VALUES (new_user_id, input_username, false, input_username)
    ON CONFLICT (username) DO NOTHING
    RETURNING user_id INTO existing_profile_record;
    
    IF existing_profile_record.user_id IS NULL THEN
      RAISE EXCEPTION 'Username was taken during creation';
    END IF;
    
    RETURN new_user_id;
  EXCEPTION
    WHEN unique_violation THEN
      -- If we hit a race condition, try to return the existing user
      SELECT user_id INTO existing_profile_record 
      FROM public.profiles 
      WHERE username = input_username 
      LIMIT 1;
      
      IF existing_profile_record.user_id IS NOT NULL THEN
        RETURN existing_profile_record.user_id;
      ELSE
        RAISE EXCEPTION 'Failed to create or find user';
      END IF;
  END;
END;
$function$;
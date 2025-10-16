-- Fix function search path security issues
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix function search path security issues
CREATE OR REPLACE FUNCTION public.update_person_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.people 
    SET balance = balance + CASE 
      WHEN NEW.type = 'lent' THEN NEW.amount 
      WHEN NEW.type = 'borrowed' THEN -NEW.amount 
      ELSE 0 
    END
    WHERE id = NEW.person_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Revert old transaction effect
    UPDATE public.people 
    SET balance = balance - CASE 
      WHEN OLD.type = 'lent' THEN OLD.amount 
      WHEN OLD.type = 'borrowed' THEN -OLD.amount 
      ELSE 0 
    END
    WHERE id = OLD.person_id;
    
    -- Apply new transaction effect
    UPDATE public.people 
    SET balance = balance + CASE 
      WHEN NEW.type = 'lent' THEN NEW.amount 
      WHEN NEW.type = 'borrowed' THEN -NEW.amount 
      ELSE 0 
    END
    WHERE id = NEW.person_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.people 
    SET balance = balance - CASE 
      WHEN OLD.type = 'lent' THEN OLD.amount 
      WHEN OLD.type = 'borrowed' THEN -OLD.amount 
      ELSE 0 
    END
    WHERE id = OLD.person_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix function search path security issues  
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, full_name)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'username',
    NEW.raw_user_meta_data ->> 'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
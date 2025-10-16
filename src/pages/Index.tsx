import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { UsernameEntry } from "@/components/UsernameEntry";
import SplashScreen from "@/components/SplashScreen";

const Index = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const storedUserId = localStorage.getItem('userId');
        
        if (session?.user && storedUserId) {
          // Verify the user exists in profiles
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('user_id', storedUserId)
            .single();
          
          if (profile) {
            // Valid session and existing profile
            setIsAuthenticated(true);
            navigate('/home');
          } else {
            // Profile not found, start fresh
            await supabase.auth.signOut();
            const username = localStorage.getItem('username');
            localStorage.clear();
            if (username) localStorage.setItem('username', username);
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // Keep username on error
        const username = localStorage.getItem('username');
        await supabase.auth.signOut();
        localStorage.clear();
        if (username) localStorage.setItem('username', username);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  if (isLoading) {
    return <SplashScreen />;
  }

  return !isAuthenticated ? (
    <UsernameEntry onSuccess={() => {
      setIsAuthenticated(true);
      navigate('/home');
    }} />
  ) : null;
};

export default Index;

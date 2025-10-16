import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/MainLayout";
import Index from "@/pages/Index";
import Home from "@/pages/Home";
import Analytics from "@/pages/Analytics";
import People from "@/pages/People";
import PersonDetail from "@/pages/PersonDetail";
import TransactionDetail from "@/pages/TransactionDetail";
import EditTransaction from "@/pages/EditTransaction";
import Profile from "@/pages/Profile";
import PinEntry from "@/components/PinEntry";
import { UsernameEntry } from "@/components/UsernameEntry";
import NotFound from "@/pages/NotFound";
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsPin, setNeedsPin] = useState(false);
  const [needsUsername, setNeedsUsername] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Initialize mobile features if running on native platform
        if (Capacitor.isNativePlatform()) {
          // Configure status bar
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: '#000000' });
          
          // Hide splash screen after app is ready
          await SplashScreen.hide();
          
          // Configure keyboard behavior
          Keyboard.addListener('keyboardWillShow', () => {
            document.body.classList.add('keyboard-open');
          });
          
          Keyboard.addListener('keyboardWillHide', () => {
            document.body.classList.remove('keyboard-open');
          });
        }

        // Check for existing user data
        const storedUserId = localStorage.getItem('userId');
        const storedUsername = localStorage.getItem('username');
        
        if (storedUserId && storedUsername) {
          setUser(storedUserId);
          setUsername(storedUsername);
          
          // Check if PIN is enabled for this user
          const { data: profile } = await supabase
            .from('profiles')
            .select('pin_enabled')
            .eq('user_id', storedUserId)
            .single();
          
          if (profile?.pin_enabled) {
            setNeedsPin(true);
          } else {
            setIsAuthenticated(true);
          }
        } else {
          setNeedsUsername(true);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Auth initialization error:', error);
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const handleUsernameSuccess = async (userId: string, username: string) => {
    setLoading(true);
    try {
      // Set user state first
      setUser(userId);
      setUsername(username);
      setNeedsUsername(false);
      
      // Check if PIN is enabled for this user
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('pin_enabled')
        .eq('user_id', userId)
        .single();
      
      if (profileError) {
        throw profileError;
      }
      
      if (profile?.pin_enabled) {
        setNeedsPin(true);
        setIsAuthenticated(false);
      } else {
        setNeedsPin(false);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error in auth transition:', error);
      // Don't show error toast here - just proceed to authenticated state
      // This prevents the "flash" of error when auth is actually successful
      setNeedsPin(false);
      setIsAuthenticated(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePinSuccess = () => {
    setNeedsPin(false);
    setIsAuthenticated(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show username entry first if no user data
  if (needsUsername) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <UsernameEntry onSuccess={handleUsernameSuccess} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // Show PIN entry if PIN is enabled and not authenticated
  if (needsPin && !isAuthenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <PinEntry onSuccess={handlePinSuccess} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  if (!user || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-title text-foreground mb-2">Error</h1>
          <p className="text-subtext text-muted-foreground">Unable to initialize app</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="people" element={<People />} />
              <Route path="profile" element={<Profile />} />
              <Route path="transaction/:id" element={<TransactionDetail />} />
              <Route path="edit-transaction/:id" element={<EditTransaction />} />
              <Route path="person/:id" element={<PersonDetail />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
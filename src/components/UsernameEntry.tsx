import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UsernameEntryProps {
  onSuccess: (userId: string, username: string) => void;
}

export const UsernameEntry: React.FC<UsernameEntryProps> = ({ onSuccess }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast.error('Please enter a username');
      return;
    }

    // Basic validation
    if (username.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast.error('Username can only contain letters, numbers, and underscores');
      return;
    }

    setLoading(true);

    try {
      // Sign out from any existing session but keep the username
      const savedUsername = localStorage.getItem('username');
      await supabase.auth.signOut();
      localStorage.clear();
      if (savedUsername) {
        localStorage.setItem('username', savedUsername);
      }
      
      // Create anonymous session first - we'll need this for both new and existing users
      const { data: initialAuth, error: initialAuthError } = await supabase.auth.signInAnonymously();
      if (initialAuthError) throw initialAuthError;
      if (!initialAuth?.user?.id) throw new Error('Failed to create auth session');
      
      // See if profile exists for this username
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, username')
        .eq('username', username.trim())
        .maybeSingle();

      if (profileError) throw profileError;

      if (existingProfile && existingProfile.user_id) {
        // For existing user: maintain the existing user_id
        const existingUserId = existingProfile.user_id;
        
        // Create new anonymous session
        const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
        if (authError) throw authError;
        if (!authData?.user?.id) throw new Error('Failed to create auth session');
        
        // Store both IDs
        localStorage.setItem('username', username.trim());
        localStorage.setItem('userId', existingUserId);
        
        toast.success('Logged in successfully');
        onSuccess(existingUserId, username.trim());
        return;
      }

      // For new user: get a fresh session
      const { data: newAuth, error: newAuthError } = await supabase.auth.signInAnonymously();
      if (newAuthError) throw newAuthError;
      if (!newAuth?.user?.id) throw new Error('Failed to create auth session for new user');

      const newUserId = newAuth.user.id;

      try {
        // Create profile for the new user
        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert({ 
            user_id: newUserId, 
            username: username.trim(), 
            pin_enabled: false, 
            full_name: username.trim() 
          })
          .select('user_id')
          .single();

        if (createError) throw createError;

        // Ensure profile was created
        const { data: verifyProfile, error: verifyError } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('user_id', newUserId)
          .single();

        if (verifyError || !verifyProfile) {
          throw new Error('Failed to verify profile creation');
        }

        // Successfully created new user
        localStorage.setItem('username', username.trim());
        localStorage.setItem('userId', newUserId);
        localStorage.setItem('userName', username.trim());
        
        toast.success('Welcome! Your account has been created successfully');
        onSuccess(newUserId, username.trim());

      } catch (error) {
        // Clean up if profile creation fails
        await supabase.auth.signOut();
        localStorage.clear();
        throw error;
      }
      return;
    } catch (error: any) {
      console.error('Error during sign-in:', error);
      toast.error('Failed to sign in - please try again');
      try { await supabase.auth.signOut(); } catch (e) { /* ignore */ }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Welcome to ExpenseTracker!</CardTitle>
          <CardDescription>
            Enter your username to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder={localStorage.getItem('username') || "Enter username"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                autoFocus
              />
              <div className="text-sm text-muted-foreground">
                Use 3 or more letters, numbers, or underscores
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading || !username.trim()}>
              {loading ? 'Setting up...' : username.trim().length > 0 ? 'Continue' : 'Enter a username'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
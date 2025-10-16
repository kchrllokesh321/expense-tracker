import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PinEntryProps {
  onSuccess: () => void;
}

const PinEntry = ({ onSuccess }: PinEntryProps) => {
  const [pin, setPin] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkUserProfile();
  }, []);

  const checkUserProfile = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('pin_hash, pin_enabled')
        .eq('user_id', userId)
        .single();

      // If PIN is disabled, skip PIN entry
      if (profile?.pin_enabled === false) {
        onSuccess();
        return;
      }
      
      setIsFirstTime(!profile?.pin_hash);
    } catch (error) {
      console.error('Error checking profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const hashPin = async (pin: string): Promise<string> => {
    // Simple hash for demo - in production use bcrypt
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const verifyPin = async (pin: string): Promise<boolean> => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return false;

      const { data: profile } = await supabase
        .from('profiles')
        .select('pin_hash')
        .eq('user_id', userId)
        .single();

      if (!profile?.pin_hash) return false;

      const hashedPin = await hashPin(pin);
      return hashedPin === profile.pin_hash;
    } catch (error) {
      console.error('Error verifying PIN:', error);
      return false;
    }
  };

  const setNewPin = async (pin: string): Promise<boolean> => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return false;

      const hashedPin = await hashPin(pin);

      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: userId,
          pin_hash: hashedPin
        });

      if (error) {
        console.error('Error setting PIN:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error setting PIN:', error);
      return false;
    }
  };

  const handlePinInput = async (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      
      if (newPin.length === 4) {
        if (isFirstTime) {
          // Set new PIN
          const success = await setNewPin(newPin);
          if (success) {
            toast({
              title: "PIN Set Successfully",
              description: "Your PIN has been created",
            });
            onSuccess();
          } else {
            setIsShaking(true);
            setPin("");
            toast({
              title: "Error",
              description: "Failed to set PIN. Please try again.",
              variant: "destructive",
            });
            setTimeout(() => setIsShaking(false), 500);
          }
        } else {
          // Verify existing PIN
          const isValid = await verifyPin(newPin);
          if (isValid) {
            onSuccess();
          } else {
            setIsShaking(true);
            setPin("");
            toast({
              title: "Incorrect PIN",
              description: "Please try again",
              variant: "destructive",
            });
            setTimeout(() => setIsShaking(false), 500);
          }
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const pinButtons = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'delete']
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-12">
          <h1 className="text-title text-foreground mb-2">
            {isFirstTime ? "Set Your PIN" : "Welcome back!"}
          </h1>
          <p className="text-subtext text-muted-foreground">
            {isFirstTime ? "Create a 4-digit PIN to secure your data" : "Enter your PIN to continue"}
          </p>
        </div>

        {/* PIN Dots */}
        <div className={`flex justify-center gap-4 mb-12 transition-transform duration-200 ${isShaking ? 'animate-pulse' : ''}`}>
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                index < pin.length 
                  ? 'bg-primary border-primary shadow-lg' 
                  : 'border-border bg-card'
              }`}
            />
          ))}
        </div>

        {/* PIN Keypad */}
        <div className="grid grid-cols-3 gap-4">
          {pinButtons.flat().map((button, index) => {
            if (button === '') return <div key={index} />;
            
            if (button === 'delete') {
              return (
                <Button
                  key={index}
                  variant="pin-button"
                  size="pin"
                  onClick={handleDelete}
                  className="col-span-1"
                >
                  ⌫
                </Button>
              );
            }

            return (
              <Button
                key={index}
                variant="pin-button"
                size="pin"
                onClick={() => handlePinInput(button)}
              >
                {button}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PinEntry;
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase, getEffectiveUserId } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertTriangle } from 'lucide-react';

interface ClearDataDialogProps {
  username: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ClearDataDialog({ username, isOpen, onClose }: ClearDataDialogProps) {
  const [confirmUsername, setConfirmUsername] = useState('');
  const [isClearing, setIsClearing] = useState(false);

  const handleClearData = async () => {
    if (confirmUsername !== username) {
      toast.error('Username does not match');
      return;
    }

    setIsClearing(true);

    try {
  const userId = await getEffectiveUserId();
  if (!userId) throw new Error('No user found');

      // Delete all user data but keep the auth record
      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
  .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Delete people data
      const { error: deletePeopleError } = await supabase
        .from('people')
        .delete()
  .eq('user_id', userId);

      if (deletePeopleError) throw deletePeopleError;

      // Delete profile completely
      const { error: deleteProfileError } = await supabase
        .from('profiles')
        .delete()
  .eq('user_id', userId);

      if (deleteProfileError) throw deleteProfileError;

      // Clear ALL local storage including username
      localStorage.clear();

      toast.success('All data cleared successfully');
      window.location.reload(); // Refresh to show empty state
    } catch (error) {
      console.error('Error clearing data:', error);
      toast.error('Failed to clear data. Please try again.');
      setIsClearing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isClearing && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Clear All Data
          </DialogTitle>
          <DialogDescription className="space-y-3">
            <p className="font-medium text-destructive">
              Warning: This action cannot be undone!
            </p>
            <p>
              This will permanently delete all your data, including:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>All transactions and their history</li>
              <li>All people and their records</li>
              <li>Your profile settings and preferences</li>
            </ul>
            <p>
              Your username will be kept, and you can continue using the app as a new user.
            </p>
            <p className="font-medium">
              To confirm, type your username: {username}
            </p>
          </DialogDescription>
        </DialogHeader>

        <Input
          placeholder="Enter your username to confirm"
          value={confirmUsername}
          onChange={(e) => setConfirmUsername(e.target.value)}
          disabled={isClearing}
        />

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isClearing}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={confirmUsername !== username || isClearing}
            onClick={handleClearData}
          >
            {isClearing ? 'Clearing Data...' : 'Clear All Data'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
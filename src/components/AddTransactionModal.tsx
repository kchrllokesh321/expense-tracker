import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, DollarSign, Tag, Calendar, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase, getEffectiveUserId } from "@/integrations/supabase/client";
import { useKeyboard } from "@/hooks/use-keyboard";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransactionAdded: () => void;
}

const AddTransactionModal = ({ isOpen, onClose, onTransactionAdded }: AddTransactionModalProps) => {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { isKeyboardOpen, keyboardHeight } = useKeyboard();
  const modalRef = useRef<HTMLDivElement>(null);
  const activeInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // Handle input focus to track active field
  const handleInputFocus = (element: HTMLInputElement | HTMLTextAreaElement) => {
    activeInputRef.current = element;
  };

  // Scroll active input into view when keyboard opens
  useEffect(() => {
    if (isKeyboardOpen && activeInputRef.current && modalRef.current) {
      setTimeout(() => {
        activeInputRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 100);
    }
  }, [isKeyboardOpen, keyboardHeight]);

  const handleSave = async () => {
    if (!amount || !category) {
      toast({
        title: "Missing Information",
        description: "Please fill in amount and category",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const userId = await getEffectiveUserId();
      
      if (!userId) {
        toast({
          title: "Authentication Error", 
          description: "Please sign in to add transactions",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          amount: parseFloat(amount),
          category,
          date,
          notes: notes || null,
          type,
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Transaction Added",
        description: `${type === 'income' ? 'Income' : 'Expense'} of ₹${amount} recorded`,
      });

      // Reset form
      setAmount("");
      setCategory("");
      setNotes("");
      onTransactionAdded();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add transaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
      <div 
        ref={modalRef}
        className={`bg-card w-full max-w-md rounded-t-3xl transition-all duration-300 ${
          isKeyboardOpen 
            ? 'max-h-screen overflow-y-auto' 
            : 'animate-in slide-in-from-bottom-full'
        }`}
        style={{
          paddingBottom: isKeyboardOpen ? `${keyboardHeight + 20}px` : '0px',
          maxHeight: isKeyboardOpen ? `calc(100vh - ${keyboardHeight}px)` : 'auto'
        }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-title text-foreground">Add Transaction</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Type Toggle */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={type === 'expense' ? "clean-primary" : "clean"}
              className="flex-1"
              onClick={() => setType('expense')}
            >
              Expense
            </Button>
            <Button
              variant={type === 'income' ? "clean-primary" : "clean"}
              className="flex-1"
              onClick={() => setType('income')}
            >
              Income
            </Button>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onFocus={(e) => handleInputFocus(e.target)}
                type="number"
                className="pl-10 bg-background border-0 text-body"
              />
            </div>

            <div className="relative">
              <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Category (e.g., Food, Transport)"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                onFocus={(e) => handleInputFocus(e.target)}
                className="pl-10 bg-background border-0 text-body"
              />
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={date}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDate(e.target.value)}
                onFocus={(e) => handleInputFocus(e.target)}
                className="pl-10 bg-background border-0 text-body"
              />
            </div>

            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onFocus={(e) => handleInputFocus(e.target)}
                className="pl-10 bg-background border-0 text-body resize-none"
                rows={3}
              />
            </div>
          </div>

          {/* Save Button */}
          <Button
            variant="clean-primary"
            className="w-full mt-6"
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Transaction"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddTransactionModal;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, getEffectiveUserId } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, DollarSign, Tag, Calendar, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
  type: string;
  user_id: string;
  created_at: string;
}

const EditTransaction = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');

  useEffect(() => {
    fetchTransaction();
  }, [id]);

  const fetchTransaction = async () => {
    try {
      const userId = await getEffectiveUserId();
      if (!userId) {
        navigate('/');
        return;
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
  .eq('id', id)
  .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching transaction:', error);
        toast({
          title: "Error",
          description: "Failed to load transaction",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      if (data) {
        setTransaction(data);
        setAmount(data.amount.toString());
        setCategory(data.category);
        setDate(data.date);
        setNotes(data.notes || '');
        setType(data.type as 'income' | 'expense');
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to load transaction",
        variant: "destructive"
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!amount || !category || !date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const today = new Date();
    const selectedDate = new Date(date);
    if (selectedDate > today) {
      toast({
        title: "Error",
        description: "Cannot select a future date",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);

    try {
      const userId = await getEffectiveUserId();
      if (!userId) {
        navigate('/');
        return;
      }

      const { error } = await supabase
        .from('transactions')
        .update({
          amount: parseFloat(amount),
          category,
          date,
          notes: notes || null,
          type,
          updated_at: new Date().toISOString()
        })
  .eq('id', id)
  .eq('user_id', userId);

      if (error) {
        console.error('Error updating transaction:', error);
        toast({
          title: "Error",
          description: "Failed to update transaction",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Transaction updated successfully"
      });

      navigate(`/transaction/${id}`);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to update transaction",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-xl font-semibold mb-4">Transaction not found</h2>
        <Button onClick={() => navigate('/')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/transaction/${id}`)}
          className="p-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">Edit Transaction</h1>
        <div />
      </div>

      <div className="space-y-6">
        {/* Type Toggle */}
        <div className="flex space-x-2">
          <Button
            variant={type === 'expense' ? 'default' : 'outline'}
            onClick={() => setType('expense')}
            className="flex-1"
          >
            Expense
          </Button>
          <Button
            variant={type === 'income' ? 'default' : 'outline'}
            onClick={() => setType('income')}
            className="flex-1"
          >
            Income
          </Button>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <label className="text-sm font-medium">Amount *</label>
          </div>
          <Input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-lg"
          />
        </div>

        {/* Category Input */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <label className="text-sm font-medium">Category *</label>
          </div>
          <Input
            placeholder="e.g., Food, Transport, Salary"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>

        {/* Date Input */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <label className="text-sm font-medium">Date *</label>
          </div>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* Notes Input */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <label className="text-sm font-medium">Notes</label>
          </div>
          <Textarea
            placeholder="Add any additional notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full"
        >
          {saving ? 'Updating...' : 'Update Transaction'}
        </Button>
      </div>
    </div>
  );
};

export default EditTransaction;
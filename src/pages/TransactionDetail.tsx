import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { supabase, getEffectiveUserId } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  amount: number;
  category: string;
  date: string;
  notes: string | null;
  type: 'income' | 'expense';
  created_at: string;
}

const TransactionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTransaction();
  }, [id]);

  const fetchTransaction = async () => {
    try {
  const userId = await getEffectiveUserId();
  if (!userId || !id) return;

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('id', id)
        .single();

      if (error) throw error;
      const mappedTransaction = {
        ...data,
        type: data.type as 'income' | 'expense',
      };
      setTransaction(mappedTransaction);
    } catch (error) {
      console.error('Error fetching transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!transaction || !confirm("Are you sure you want to delete this transaction?")) return;
    
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transaction.id);

      if (error) throw error;

      toast({
        title: "Transaction Deleted",
        description: "Transaction has been successfully deleted",
      });
      
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Error",
        description: "Failed to delete transaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-6 pt-8">
        <div className="text-center mt-20">
          <div className="text-body text-foreground">Loading transaction...</div>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-background px-6 pt-8">
        <div className="text-center mt-20">
          <div className="text-body text-foreground">Transaction not found</div>
          <Button
            variant="clean-primary"
            className="mt-4"
            onClick={() => navigate('/')}
          >
            Go Back Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-6 pt-8">
      {/* Header */}
      <div className="flex items-center mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="mr-4"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-title text-foreground">Transaction Details</h1>
      </div>

      {/* Transaction Card */}
      <div className="clean-card rounded-3xl p-6 mb-8">
        <div className="text-center mb-6">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
            transaction.type === 'income' ? 'bg-income/20' : 'bg-expense/20'
          }`}>
            {transaction.type === 'income' ? (
              <ArrowDownRight className="h-8 w-8 text-income" />
            ) : (
              <ArrowUpRight className="h-8 w-8 text-expense" />
            )}
          </div>
          
          <div className="text-display text-foreground mb-2">
            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
          </div>
          
          <div className={`text-card ${
            transaction.type === 'income' ? 'text-income' : 'text-expense'
          }`}>
            {transaction.type === 'income' ? 'Income' : 'Expense'}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-border">
            <span className="text-body text-muted-foreground">Category</span>
            <span className="text-body text-foreground font-medium capitalize">
              {transaction.category}
            </span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-border">
            <span className="text-body text-muted-foreground">Date</span>
            <span className="text-body text-foreground font-medium">
              {formatDate(transaction.date)}
            </span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-border">
            <span className="text-body text-muted-foreground">Time</span>
            <span className="text-body text-foreground font-medium">
              {formatTime(transaction.created_at)}
            </span>
          </div>

          {transaction.notes && (
            <div className="py-3">
              <div className="text-body text-muted-foreground mb-2">Notes</div>
              <div className="text-body text-foreground bg-background rounded-xl p-3">
                {transaction.notes}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        <Button
          variant="clean"
          className="w-full"
          onClick={() => navigate(`/edit-transaction/${transaction.id}`)}
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Transaction
        </Button>

        <Button
          variant="destructive"
          className="w-full rounded-2xl"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Transaction
        </Button>
      </div>

      {/* Transaction ID */}
      <div className="mt-8 text-center">
        <div className="text-subtext text-muted-foreground">
          Transaction ID: {transaction.id}
        </div>
      </div>
    </div>
  );
};

export default TransactionDetail;
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, Plus, ArrowUpRight, ArrowDownRight, Trash2 } from "lucide-react";
import { supabase, getEffectiveUserId } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Person {
  id: string;
  name: string;
  balance: number;
  lastTransaction: string;
}

interface SharedTransaction {
  id: string;
  personId: string;
  amount: number;
  description: string;
  date: string;
  type: 'lent' | 'borrowed'; // lent = user gave money, borrowed = user received money
  timestamp: string;
}

const PersonDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState<Person | null>(null);
  const [transactions, setTransactions] = useState<SharedTransaction[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAmount, setNewAmount] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newType, setNewType] = useState<'lent' | 'borrowed'>('lent');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadPersonData();
  }, [id]);

  const loadPersonData = async () => {
    try {
  const userId = await getEffectiveUserId();
  if (!userId || !id) return;

      // Load person data
      const { data: personData, error: personError } = await supabase
        .from('people')
        .select('*')
  .eq('user_id', userId)
        .eq('id', id)
        .single();

      if (personError) {
        console.error('Error loading person:', personError);
        setPerson(null);
      } else {
        setPerson({
          id: personData.id,
          name: personData.name,
          balance: parseFloat(personData.balance.toString()),
          lastTransaction: personData.updated_at,
        });
      }

      // Load shared transactions
      const { data: transactionData, error: transactionError } = await supabase
        .from('shared_transactions')
        .select('*')
  .eq('user_id', userId)
        .eq('person_id', id)
        .order('created_at', { ascending: false });

      if (transactionError) {
        console.error('Error loading transactions:', transactionError);
      } else {
        const mappedTransactions = (transactionData || []).map(t => ({
          id: t.id,
          personId: t.person_id,
          amount: parseFloat(t.amount.toString()),
          description: t.description,
          date: t.date,
          type: t.type as 'lent' | 'borrowed',
          timestamp: t.created_at,
        }));
        setTransactions(mappedTransactions);
      }
    } catch (error) {
      console.error('Error loading person data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async () => {
    if (!newAmount || !newDescription.trim() || !person) return;

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
        .from('shared_transactions')
        .insert({
          user_id: userId,
          person_id: person.id,
          amount: parseFloat(newAmount),
          description: newDescription.trim(),
          date: new Date().toISOString().split('T')[0],
          type: newType,
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Transaction Added",
        description: `${newType === 'lent' ? 'Lent' : 'Borrowed'} ₹${newAmount} recorded`,
      });

      // Reload data to get updated balance and transactions
      await loadPersonData();

      // Reset form
      setNewAmount("");
      setNewDescription("");
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: "Error",
        description: "Failed to add transaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      const userId = await getEffectiveUserId();
      if (!userId) {
        toast({
          title: "Authentication Error",
          description: "Please sign in to delete transactions",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('shared_transactions')
        .delete()
  .eq('id', transactionId)
  .eq('user_id', userId);

      if (error) {
        throw error;
      }

      toast({
        title: "Transaction Deleted",
        description: "Transaction has been removed successfully",
      });

      // Reload data to get updated balance and transactions
      await loadPersonData();
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
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getBalanceText = (balance: number) => {
    if (balance > 0) {
      return `${person?.name} owes you ${formatCurrency(balance)}`;
    } else if (balance < 0) {
      return `You owe ${person?.name} ${formatCurrency(Math.abs(balance))}`;
    } else {
      return "All settled up";
    }
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return "text-income";
    if (balance < 0) return "text-debt";
    return "text-muted-foreground";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-6 pt-8">
        <div className="text-center mt-20">
          <div className="text-body text-foreground">Loading person...</div>
        </div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="min-h-screen bg-background px-6 pt-8">
        <div className="text-center mt-20">
          <div className="text-body text-foreground">Person not found</div>
          <Button
            variant="clean-primary"
            className="mt-4"
            onClick={() => navigate('/people')}
          >
            Go Back
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
          onClick={() => navigate('/people')}
          className="mr-4"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-title text-foreground">{person.name}</h1>
      </div>

      {/* Balance Card */}
      <div className="clean-card rounded-3xl p-6 mb-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-primary font-bold text-2xl">
              {person.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className={`text-card ${getBalanceColor(person.balance)}`}>
            {getBalanceText(person.balance)}
          </div>
          {person.balance !== 0 && (
            <div className="text-display text-foreground mt-2">
              {formatCurrency(Math.abs(person.balance))}
            </div>
          )}
        </div>
      </div>

      {/* Add Transaction Button */}
      <Button
        variant="clean-primary"
        className="w-full mb-8"
        onClick={() => setShowAddForm(true)}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Shared Expense
      </Button>

      {/* Add Transaction Form */}
      {showAddForm && (
        <div className="clean-card rounded-3xl p-6 mb-8">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={newType === 'lent' ? "clean-primary" : "clean"}
                className="flex-1"
                onClick={() => setNewType('lent')}
              >
                I Lent Money
              </Button>
              <Button
                variant={newType === 'borrowed' ? "clean-primary" : "clean"}
                className="flex-1"
                onClick={() => setNewType('borrowed')}
              >
                I Borrowed Money
              </Button>
            </div>

            <input
              type="number"
              placeholder="Amount"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              className="w-full bg-background border-0 rounded-xl p-3 text-body text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <input
              type="text"
              placeholder="Description (e.g., Dinner, Movie tickets)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full bg-background border-0 rounded-xl p-3 text-body text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <div className="flex gap-3">
              <Button
                variant="clean-primary"
                className="flex-1"
                onClick={handleAddTransaction}
              >
                Add
              </Button>
              <Button
                variant="clean"
                className="flex-1"
                onClick={() => {
                  setShowAddForm(false);
                  setNewAmount("");
                  setNewDescription("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="mb-8">
        <h2 className="text-card text-foreground mb-4">Transaction History</h2>
        
        {transactions.length === 0 ? (
          <div className="clean-sm rounded-2xl p-8 text-center">
            <div className="text-body text-foreground mb-2">No transactions yet</div>
            <div className="text-subtext text-muted-foreground">
              Add a shared expense to get started
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="clean-sm rounded-2xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center flex-1">
                  <div className={`rounded-xl p-2 mr-3 ${
                    transaction.type === 'lent' ? 'bg-income/20' : 'bg-debt/20'
                  }`}>
                    {transaction.type === 'lent' ? (
                      <ArrowUpRight className="h-4 w-4 text-income" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-debt" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-body text-foreground">{transaction.description}</div>
                    <div className="text-subtext text-muted-foreground">
                      {formatDate(transaction.date)} • {transaction.type === 'lent' ? 'You lent' : 'You borrowed'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`text-body font-medium ${
                    transaction.type === 'lent' ? 'text-income' : 'text-debt'
                  }`}>
                    {transaction.type === 'lent' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this transaction?
                          <br />
                          <strong>{transaction.description}</strong> - {formatCurrency(transaction.amount)}
                          <br />
                          This action cannot be undone and will update the balance.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonDetail;
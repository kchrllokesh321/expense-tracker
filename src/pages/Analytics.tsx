import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TrendingUp, TrendingDown, DollarSign, PieChart, Calendar as CalendarIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, PieChart as RechartsPieChart, Cell, BarChart, Bar } from 'recharts';
import { useNavigate } from "react-router-dom";
import { supabase, getEffectiveUserId } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Transaction {
  id: string;
  amount: number;
  category: string;
  date: string;
  type: 'income' | 'expense';
}

const Analytics = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | '30days' | 'year'>('30days');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const userId = await getEffectiveUserId();
      if (!userId) return;

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) throw error;
      const mappedTransactions = (data || []).map(transaction => ({
        ...transaction,
        type: transaction.type as 'income' | 'expense',
      }));
      setTransactions(mappedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactionsByPeriod = () => {
    const now = new Date();
    let startDate: Date;

    if (selectedDate && selectedPeriod === 'day') {
      // Use selected date from calendar
      startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    } else {
      switch (selectedPeriod) {
        case 'day':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case '30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
    }

    if (selectedDate && selectedPeriod === 'day') {
      // For selected date, filter for that specific day
      const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + 1);
      return transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= startDate && transactionDate < endDate;
      });
    }

    return transactions.filter(t => new Date(t.date) >= startDate);
  };

  const filteredTransactions = filterTransactionsByPeriod();

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netAmount = totalIncome - totalExpenses;

  const getCategoryData = () => {
    const categoryMap = new Map<string, number>();
    
    filteredTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount);
      });

    return Array.from(categoryMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  };

  const categoryData = getCategoryData();
  const maxCategoryAmount = Math.max(...categoryData.map(c => c.amount), 1);

  const getChartData = () => {
    const dailyData = new Map<string, { income: number; expense: number }>();
    
    filteredTransactions.forEach(t => {
      const date = new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!dailyData.has(date)) {
        dailyData.set(date, { income: 0, expense: 0 });
      }
      
      const dayData = dailyData.get(date)!;
      if (t.type === 'income') {
        dayData.income += t.amount;
      } else {
        dayData.expense += t.amount;
      }
    });

    return Array.from(dailyData.entries())
      .map(([date, data]) => ({ date, ...data }))
      .slice(-7); // Last 7 data points for readability
  };

  const getPieChartData = () => {
    return categoryData.map((item, index) => ({
      ...item,
      fill: `hsl(${(index * 60) % 360}, 70%, 60%)`
    }));
  };

  const getFilteredTransactionsList = () => {
    let filtered = filteredTransactions;
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(t => t.type === selectedFilter);
    }
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPeriodLabel = () => {
    if (selectedDate && selectedPeriod === 'day') {
      return format(selectedDate, 'MMM dd, yyyy');
    }
    
    switch (selectedPeriod) {
      case 'day': return 'Today';
      case '30days': return 'Last 30 Days';
      case 'year': return 'This Year';
      default: return 'Last 30 Days';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-6 pt-8">
        <div className="mb-8">
          <h1 className="text-title text-foreground mb-2">Analytics</h1>
          <p className="text-subtext text-muted-foreground">Your spending insights</p>
        </div>
        <div className="text-center mt-20">
          <div className="text-body text-foreground">Loading your analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-6 pt-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-title text-foreground mb-2">Analytics</h1>
        <p className="text-subtext text-muted-foreground">Your spending insights</p>
      </div>

      {/* Period Filter */}
      <div className="flex gap-2 mb-8">
        {[
          { key: 'day', label: 'Today' },
          { key: '30days', label: ' 30 Days' },
          { key: 'year', label: 'This Year' }
        ].map(({ key, label }) => (
          <Button
            key={key}
            variant={selectedPeriod === key && !selectedDate ? "clean-primary" : "clean"}
            className="flex-1"
            onClick={() => {
              setSelectedPeriod(key as any);
              if (key !== 'day') {
                setSelectedDate(undefined);
              }
            }}
          >
            {label}
          </Button>
        ))}
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="clean" 
              className={cn(
                "h-10 w-10 p-0",
                selectedDate && "text-primary"
              )}
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date);
                setIsCalendarOpen(false);
                if (date) {
                  setSelectedPeriod('day');
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 mb-8">
        <div className="clean-card rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-card text-muted-foreground">{getPeriodLabel()} Summary</span>
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-body text-foreground">Income</span>
              <span className="text-body text-income font-medium">
                {formatCurrency(totalIncome)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-body text-foreground">Expenses</span>
              <span className="text-body text-expense font-medium">
                {formatCurrency(totalExpenses)}
              </span>
            </div>
            <div className="border-t border-border pt-3">
              <div className="flex justify-between items-center">
                <span className="text-card text-foreground">Net Amount</span>
                <div className="flex items-center">
                  {netAmount >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-income mr-2" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-expense mr-2" />
                  )}
                  <span className={`text-card font-medium ${
                    netAmount >= 0 ? 'text-income' : 'text-expense'
                  }`}>
                    {formatCurrency(Math.abs(netAmount))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="space-y-6 mb-8">
        {/* Bar Chart */}
        <div className="clean-card rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <span className="text-card text-foreground">Income vs Expenses</span>
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getChartData()}>
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Bar 
                  dataKey="income" 
                  fill="hsl(var(--income))" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="expense" 
                  fill="hsl(var(--expense))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="clean-card rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <span className="text-card text-foreground">Category Breakdown</span>
            <PieChart className="h-5 w-5 text-primary" />
          </div>
          {categoryData.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground text-body">No expense data</div>
              <div className="text-subtext text-muted-foreground mt-1">
                Add some transactions to see insights
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {categoryData.map(({ category, amount }) => (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-body text-foreground capitalize">{category}</span>
                    <span className="text-body text-foreground font-medium">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(amount / maxCategoryAmount) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transaction Filters */}
      <div className="clean-card rounded-3xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <span className="text-card text-foreground">Transactions</span>
          <span className="text-subtext text-muted-foreground">
            {getFilteredTransactionsList().length} transactions
          </span>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'all', label: 'All' },
            { key: 'income', label: 'Income' },
            { key: 'expense', label: 'Expenses' }
          ].map(({ key, label }) => (
            <Button
              key={key}
              variant={selectedFilter === key ? "clean-primary" : "clean"}
              size="sm"
              onClick={() => setSelectedFilter(key as any)}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Transaction List */}
        {getFilteredTransactionsList().length === 0 ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground text-body">No transactions found</div>
            <div className="text-subtext text-muted-foreground mt-1">
              Try adjusting your filters
            </div>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {getFilteredTransactionsList().map((transaction) => (
              <div
                key={transaction.id}
                className="clean-sm rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/50 transition-all"
                onClick={() => navigate(`/transaction/${transaction.id}`)}
              >
                <div className="flex items-center">
                  <div className={`rounded-xl p-2 mr-3 ${
                    transaction.type === 'income' 
                      ? 'bg-income/20' 
                      : 'bg-expense/20'
                  }`}>
                    {transaction.type === 'income' ? (
                      <ArrowDownRight className="h-4 w-4 text-income" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-expense" />
                    )}
                  </div>
                  <div>
                    <div className="text-body text-foreground">{transaction.category}</div>
                    <div className="text-subtext text-muted-foreground">
                      {new Date(transaction.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
                <div className={`text-body font-medium ${
                  transaction.type === 'income' ? 'text-income' : 'text-expense'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default Analytics;
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Users, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase, getEffectiveUserId } from "@/integrations/supabase/client";

interface Person {
  id: string;
  name: string;
  balance: number; // positive means they owe user, negative means user owes them
  lastTransaction: string;
}

const People = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadPeople();
  }, []);

  const loadPeople = async () => {
    try {
      const userId = await getEffectiveUserId();
      if (!userId) {
        console.log('No user id available');
        setPeople([]);
        return;
      }

      const { data, error } = await supabase
        .from('people')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading people:', error);
        return;
      }

      const mappedPeople = (data || []).map(person => ({
        id: person.id,
        name: person.name,
        balance: person.balance,
        lastTransaction: person.updated_at,
      }));

      setPeople(mappedPeople);
    } catch (error) {
      console.error('Error loading people:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPerson = async () => {
    if (!newPersonName.trim()) return;

    try {
      const userId = await getEffectiveUserId();
      if (!userId) {
        console.error('No authenticated user found');
        return;
      }

      const { error } = await supabase
        .from('people')
        .insert({
          user_id: userId,
          name: newPersonName.trim(),
          balance: 0,
        });

      if (error) {
        console.error('Error adding person:', error);
        return;
      }

      setNewPersonName("");
      setShowAddForm(false);
      loadPeople(); // Refresh the list
    } catch (error) {
      console.error('Error adding person:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(Math.abs(amount));
  };

  const getBalanceText = (balance: number) => {
    if (balance > 0) {
      return `They owe you ${formatCurrency(balance)}`;
    } else if (balance < 0) {
      return `You owe them ${formatCurrency(balance)}`;
    } else {
      return "All settled up";
    }
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return "text-income";
    if (balance < 0) return "text-debt";
    return "text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-background px-6 pt-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-title text-foreground mb-2">People</h1>
        <p className="text-subtext text-muted-foreground">Track shared expenses and debts</p>
      </div>

      {/* Add Person Button */}
      <div className="mb-8">
        <Button
          variant="clean-primary"
          className="w-full"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Person
        </Button>
      </div>

      {/* Add Person Form */}
      {showAddForm && (
        <div className="clean-card rounded-3xl p-6 mb-8">
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter person's name"
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
              className="w-full bg-background border-0 rounded-xl p-3 text-body text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
            <div className="flex gap-3">
              <Button
                variant="clean-primary"
                className="flex-1"
                onClick={handleAddPerson}
              >
                Add
              </Button>
              <Button
                variant="clean"
                className="flex-1"
                onClick={() => {
                  setShowAddForm(false);
                  setNewPersonName("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* People List */}
      {people.length === 0 ? (
        <div className="clean-sm rounded-3xl p-8 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <div className="text-body text-foreground mb-2">No people added yet</div>
          <div className="text-subtext text-muted-foreground">
            Add friends and family to track shared expenses
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {people.map((person) => (
            <div
              key={person.id}
              className="clean-sm rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/50 transition-all"
              onClick={() => navigate(`/person/${person.id}`)}
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mr-4">
                  <span className="text-primary font-medium text-lg">
                    {person.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="text-body text-foreground font-medium">{person.name}</div>
                  <div className={`text-subtext ${getBalanceColor(person.balance)}`}>
                    {getBalanceText(person.balance)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                {person.balance !== 0 && (
                  <>
                    {person.balance > 0 ? (
                      <ArrowDownRight className="h-4 w-4 text-income mr-2" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-debt mr-2" />
                    )}
                    <span className={`text-body font-medium ${getBalanceColor(person.balance)}`}>
                      {formatCurrency(person.balance)}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {people.length > 0 && (
        <div className="clean-card rounded-3xl p-6 mt-8">
          <h3 className="text-card text-foreground mb-4">Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-body text-foreground">People who owe you</span>
              <span className="text-body text-income font-medium">
                {people.filter(p => p.balance > 0).length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-body text-foreground">People you owe</span>
              <span className="text-body text-debt font-medium">
                {people.filter(p => p.balance < 0).length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-body text-foreground">All settled</span>
              <span className="text-body text-muted-foreground font-medium">
                {people.filter(p => p.balance === 0).length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default People;
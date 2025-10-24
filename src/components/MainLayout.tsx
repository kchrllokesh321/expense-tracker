import { Outlet, NavLink, useLocation } from "react-router-dom";
import { Home, BarChart3, Users, User, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import AddTransactionModal from "./AddTransactionModal";
import { useHaptics } from "@/hooks/use-haptics";
import { ImpactStyle } from '@capacitor/haptics';

const MainLayout = () => {
  const location = useLocation();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { triggerImpact } = useHaptics();

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: BarChart3, label: "Analytics", path: "/analytics" },
    { icon: Users, label: "People", path: "/people" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleTransactionAdded = () => {
    setRefreshKey(prev => prev + 1);
    // Trigger a page refresh or data reload
    window.location.reload();
  };

  const handleNavClick = () => {
    triggerImpact(ImpactStyle.Light);
  };

  const handleFabClick = () => {
    triggerImpact(ImpactStyle.Medium);
    setIsAddModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background relative safe-area-top">
      {/* Main Content */}
      <main className="main-content-bottom-padding safe-area-left safe-area-right">
        <Outlet />
      </main>

      {/* Floating Action Button - Only on Home Screen */}
      {location.pathname === "/" && (
        <Button
          variant="clean-fab"
          size="fab"
          className="fixed bottom-24 right-6 z-10 safe-area-right"
          style={{ bottom: `calc(96px + max(env(safe-area-inset-bottom), 16px))` }}
          onClick={handleFabClick}
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border/50 bottom-nav-container safe-area-left safe-area-right">
        <div className="flex justify-around items-center py-2 px-2 max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200 no-select min-h-[60px] flex-1 ${
                  isActive(item.path)
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Icon className={`h-5 w-5 mb-1 transition-transform duration-200 ${isActive(item.path) ? "scale-110" : ""}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Add Transaction Modal */}
      <AddTransactionModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        onTransactionAdded={handleTransactionAdded}
      />
    </div>
  );
};

export default MainLayout;
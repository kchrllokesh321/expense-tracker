import { useEffect, useState } from "react";

const SplashScreen = () => {
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    setFadeIn(true);
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className={`text-center transition-all duration-1000 ${fadeIn ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <div className="clean-card rounded-3xl p-12 mb-8 inline-block">
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center">
            <span className="text-3xl font-bold text-primary-foreground">₹</span>
          </div>
        </div>
        <h1 className="text-title text-foreground">The Expense Tracker</h1>
        <p className="text-subtext text-muted-foreground mt-2">Premium expense management</p>
      </div>
    </div>
  );
};

export default SplashScreen;
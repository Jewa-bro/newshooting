import React, { createContext, useContext, useState, useEffect } from 'react';

type AnimationContextType = {
  showAnimation: boolean;
  mainPageOpacity: number;
  triggerAnimation: () => void;
  hasAnimationPlayedOnce: boolean;
};

const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

export const AnimationProvider = ({ children }: { children: React.ReactNode }) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [mainPageOpacity, setMainPageOpacity] = useState(1);
  const [hasAnimationPlayedOnce, setHasAnimationPlayedOnce] = useState(false);

  const triggerAnimation = () => {
    if (hasAnimationPlayedOnce) {
      setMainPageOpacity(1);
      setShowAnimation(false);
      return;
    }

    setShowAnimation(true);
    setMainPageOpacity(0.3);
    
    setTimeout(() => {
      setMainPageOpacity(1);
    }, 1500);
    
    setTimeout(() => {
      setShowAnimation(false);
      setHasAnimationPlayedOnce(true);
    }, 2000);
  };

  return (
    <AnimationContext.Provider value={{ showAnimation, mainPageOpacity, triggerAnimation, hasAnimationPlayedOnce }}>
      {children}
    </AnimationContext.Provider>
  );
};

export const useAnimation = () => {
  const context = useContext(AnimationContext);
  if (context === undefined) {
    throw new Error('useAnimation must be used within an AnimationProvider');
  }
  return context;
};
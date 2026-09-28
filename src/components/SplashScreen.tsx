import React from 'react';

export const SplashScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center font-sans max-w-md mx-auto">
      <div className="text-6xl font-extrabold text-yellow-300 animate-pulse">
        CLODY
      </div>
    </div>
  );
};
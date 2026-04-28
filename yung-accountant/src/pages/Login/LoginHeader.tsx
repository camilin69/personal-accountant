// pages/Login/LoginHeader.tsx
import React from 'react';

export const LoginHeader: React.FC = () => {
  return (
    <div className="text-center mb-8">
      <div className={`w-20 h-20 rounded-lg bg-gradient-to-br from-[#0F172A] to-[#3B82F6] flex items-center justify-center mx-auto mb-4`}>
        <img src="/favicon.svg" alt="Yung Accountant" className="w-full h-full p-1.5" />
      </div>
      <h1 className="text-2xl font-light text-white mb-2">Welcome Back</h1>
      <p className="text-white/40 text-sm">Sign in to continue to Yung Accountant</p>
    </div>
  );
};
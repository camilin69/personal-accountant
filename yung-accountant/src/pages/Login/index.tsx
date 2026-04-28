// pages/Login/index.tsx
import React from 'react';
import { LoginForm } from './LoginForm';
import { LoginHeader } from './LoginHeader';
import { LoginFooter } from './LoginFooter';
import { LoginNavbar } from './LoginNavbar';

const Login: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0F1A] via-[#0F172A] to-[#0F0F1A]">
      <LoginNavbar />
      <div className="flex items-center justify-center p-4 min-h-screen pt-20">
        <div className="max-w-md w-full animate-fade-in-up">
          <LoginHeader />
          <LoginForm />
          <LoginFooter />
        </div>
      </div>
    </div>
  );
};

export default Login;
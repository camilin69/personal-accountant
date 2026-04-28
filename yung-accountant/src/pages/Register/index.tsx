// pages/Register/index.tsx
import React from 'react';
import { RegisterForm } from './RegisterForm';
import { RegisterHeader } from './RegisterHeader';
import { RegisterFooter } from './RegisterFooter';
import { RegisterNavbar } from './RegisterNavbar';

const Register: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0F1A] via-[#0F172A] to-[#0F0F1A]">
      <RegisterNavbar />
      <div className="flex items-center justify-center p-4 min-h-screen pt-20">
        <div className="max-w-md w-full animate-fade-in-up">
          <RegisterHeader />
          <RegisterForm />
          <RegisterFooter />
        </div>
      </div>
    </div>
  );
};

export default Register;
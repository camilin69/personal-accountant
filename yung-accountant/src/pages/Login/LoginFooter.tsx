// pages/Login/LoginFooter.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export const LoginFooter: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="mt-6 text-center">
      <p className="text-xs text-white/40">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={() => navigate('/register')}
          className="text-[#3B82F6] hover:text-[#60A5FA] transition-colors font-medium"
        >
          Create Account
        </button>
      </p>
    </div>
  );
};
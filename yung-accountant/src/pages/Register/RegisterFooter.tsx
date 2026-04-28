// pages/Register/RegisterFooter.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export const RegisterFooter: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <div className="mt-6 text-center">
        <p className="text-xs text-white/40">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-[#3B82F6] hover:text-[#60A5FA] transition-colors font-medium"
          >
            Sign In
          </button>
        </p>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-[10px] text-white/30 text-center">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </>
  );
};
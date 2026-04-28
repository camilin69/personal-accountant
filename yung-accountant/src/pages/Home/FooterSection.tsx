// pages/Home/components/FooterSection.tsx
import React from 'react';
import { Logo } from '../../components/common/Logo';

export const FooterSection: React.FC = () => {
  return (
    <footer className="border-t border-white/10 py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
          <Logo size="sm" withText={true} />
          
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8">
            <a href="#" className="text-[10px] sm:text-xs text-white/40 hover:text-white/60 transition-colors">Privacy Policy</a>
            <a href="#" className="text-[10px] sm:text-xs text-white/40 hover:text-white/60 transition-colors">Terms of Service</a>
            <a href="#" className="text-[10px] sm:text-xs text-white/40 hover:text-white/60 transition-colors">Contact</a>
            <a href="#" className="text-[10px] sm:text-xs text-white/40 hover:text-white/60 transition-colors">About</a>
          </div>
          
          <p className="text-[9px] sm:text-[10px] text-white/30">
            © 2024 Yung Accountant. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
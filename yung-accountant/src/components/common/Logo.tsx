// components/common/Logo.tsx
import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  withText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', withText = true, className = '' }) => {
  const sizes = {
    sm: { container: 'w-6 h-6', text: 'text-xs', icon: 'text-[8px]' },
    md: { container: 'w-8 h-8', text: 'text-sm', icon: 'text-[10px]' },
    lg: { container: 'w-12 h-12', text: 'text-base', icon: 'text-xs' }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${sizes[size].container} rounded-lg bg-gradient-to-br from-[#0F172A] to-[#3B82F6] flex items-center justify-center`}>
        <img src="/favicon.svg" alt="Yung Accountant" className="w-full h-full p-1.5" />
      </div>
      {withText && (
        <div>
          <h1 className={`${sizes[size].text} font-light tracking-tight text-white/90`}>
            Yung Accountant
          </h1>
          <p className="text-[9px] text-white/30 font-light hidden sm:block">Track. Save. Grow.</p>
        </div>
      )}
    </div>
  );
};
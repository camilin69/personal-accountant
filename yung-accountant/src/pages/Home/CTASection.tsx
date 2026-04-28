// pages/Home/components/CTASection.tsx
import React from 'react';
import { ChevronRight } from 'lucide-react';

interface CTASectionProps {
  onGetStarted: () => void;
}

export const CTASection: React.FC<CTASectionProps> = ({ onGetStarted }) => {
  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#0F172A]/80 to-[#1E3A5F]/80 border border-white/20 p-6 sm:p-8 lg:p-12 text-center backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-40 h-40 sm:w-60 sm:h-60 lg:w-80 lg:h-80 bg-[#3B82F6]/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-40 h-40 sm:w-60 sm:h-60 lg:w-80 lg:h-80 bg-[#0F172A]/40 rounded-full blur-3xl" />
          
          <h2 className="text-xl sm:text-2xl lg:text-4xl font-light text-white mb-2 sm:mb-3 lg:mb-4">Ready to Transform Your Finances?</h2>
          <p className="text-xs sm:text-sm lg:text-base text-white/40 mb-6 sm:mb-8 lg:mb-10 max-w-md mx-auto px-4">
            Join thousands of users who trust Yung Accountant to manage their money
          </p>
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-[#0F172A] to-[#3B82F6] rounded-full text-white font-light hover:scale-105 transition-all duration-300 text-sm sm:text-base shadow-lg"
          >
            Get Started Now
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
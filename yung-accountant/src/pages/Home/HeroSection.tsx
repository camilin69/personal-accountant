// pages/Home/components/HeroSection.tsx
import React, { useState } from 'react';
import { ArrowRight, Zap, Lock, Menu, X } from 'lucide-react';
import { Logo } from '../../components/common/Logo';

interface HeroSectionProps {
  onGetStarted: () => void;
  onLogin: () => void;
  heroRef: React.RefObject<HTMLDivElement>;
  showScrollIndicator: boolean;
}

const navSections = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'wallets', label: 'Wallets' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'categories', label: 'Categories' },
  { id: 'debts', label: 'Debts' },
  { id: 'goals', label: 'Goals' },
  { id: 'simulation', label: 'Simulation' },
  { id: 'habits', label: 'Habits' }
];

export const HeroSection: React.FC<HeroSectionProps> = ({ 
  onGetStarted, 
  onLogin, 
  heroRef, 
  showScrollIndicator 
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      {/* Navbar Glass */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        showScrollIndicator 
          ? 'bg-transparent backdrop-blur-none border-transparent' 
          : 'bg-[#0F172A]/80 backdrop-blur-xl border-b border-white/10'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo size="md" withText={true} />
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {navSections.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className="text-xs text-white/50 hover:text-white transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={onLogin}
                className="px-4 py-1.5 text-sm font-light text-white/70 hover:text-white transition-colors"
              >
                Log In
              </button>
              <button
                onClick={onGetStarted}
                className="px-5 py-1.5 bg-gradient-to-r from-[#0F172A] to-[#3B82F6] rounded-full text-sm font-light text-white hover:scale-105 transition-transform duration-300 shadow-lg"
              >
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-white/60" /> : <Menu className="w-5 h-5 text-white/60" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed top-16 left-0 right-0 z-50 bg-[#0F172A]/95 backdrop-blur-xl border-b border-white/10 py-4 max-h-[calc(100vh-64px)] overflow-y-auto">
            {navSections.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className="block w-full text-left px-6 py-3 text-sm text-white/70 hover:bg-white/5 transition-colors"
              >
                {item.label}
              </button>
            ))}
            <div className="border-t border-white/10 my-2" />
            <button
              onClick={onLogin}
              className="block w-full text-left px-6 py-3 text-sm text-white/70 hover:bg-white/5 transition-colors"
            >
              Log In
            </button>
            <button
              onClick={onGetStarted}
              className="block w-full text-left px-6 py-3 text-sm text-white/70 hover:bg-white/5 transition-colors"
            >
              Get Started
            </button>
          </div>
        </>
      )}

      {/* Hero Content */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-32 pb-24 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#3B82F6]/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#0F172A]/40 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#3B82F6]/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
              <Zap className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span className="text-[11px] text-white/60 tracking-wide">SMART FINANCE MANAGEMENT</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light text-white mb-6 tracking-tight leading-tight">
              Take Control of Your
              <span className="bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] bg-clip-text text-transparent block mt-3">
                Financial Future
              </span>
            </h1>
            
            <p className="text-lg text-white/40 max-w-2xl mx-auto mb-10 font-light leading-relaxed">
              Track expenses, manage debts, achieve goals, and grow your wealth with our all-in-one financial platform. 
              Join thousands of users who've transformed their financial lives.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onGetStarted}
                className="group px-8 py-3.5 bg-gradient-to-r from-[#0F172A] to-[#3B82F6] rounded-full text-white font-light flex items-center justify-center gap-2 hover:scale-105 transition-all duration-300 text-base shadow-lg"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={onLogin}
                className="px-8 py-3.5 bg-white/5 border border-white/10 rounded-full text-white/70 font-light hover:bg-white/10 hover:scale-105 transition-all duration-300 text-base"
              >
                Sign In
              </button>
            </div>

            {/* Trust Badge */}
            <div className="mt-10 flex items-center justify-center gap-2">
              <Lock className="w-3 h-3 text-white/30" />
              <span className="text-[11px] text-white/30">Bank-level security • No hidden fees • Cancel anytime</span>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        {showScrollIndicator && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 rounded-full border border-white/20 flex justify-center">
              <div className="w-1 h-2 bg-[#3B82F6] rounded-full mt-2 animate-scroll" />
            </div>
          </div>
        )}
      </section>
    </>
  );
};
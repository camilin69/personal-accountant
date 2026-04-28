// pages/Home/components/StatsSection.tsx
import React from 'react';
import { Users, Activity, Star, Cloud } from 'lucide-react';

const stats = [
  { value: '10K+', label: 'Active Users', icon: Users },
  { value: '$50M+', label: 'Transactions Tracked', icon: Activity },
  { value: '98%', label: 'User Satisfaction', icon: Star },
  { value: '24/7', label: 'Support Available', icon: Cloud }
];

export const StatsSection: React.FC = () => {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white/[0.01]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-light text-white mb-3">Trusted by Thousands</h2>
          <p className="text-white/40">Join a growing community of smart financial planners</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center p-8 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/[0.04] transition-all duration-300 hover:scale-105"
            >
              <stat.icon className="w-8 h-8 text-[#3B82F6] mx-auto mb-4" />
              <div className="text-4xl font-light text-white mb-2">{stat.value}</div>
              <div className="text-sm text-white/40">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
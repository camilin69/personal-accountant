// pages/Home/components/FeatureSection.tsx
import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface Feature {
  id: string;
  title: string;
  icon: LucideIcon;
  description: string;
  features: string[];
}

interface FeatureSectionProps {
  feature: Feature;
  index: number;
  isEven: boolean;
}

export const FeatureSection: React.FC<FeatureSectionProps> = ({ feature, index, isEven }) => {
  const Icon = feature.icon;

  return (
    <section id={feature.id} className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 scroll-mt-14 sm:scroll-mt-16">
      <div className="max-w-7xl mx-auto">
        <div className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-8 sm:gap-12 lg:gap-16 items-center`}>
          {/* Content */}
          <div className="flex-1 space-y-4 sm:space-y-6">
            <div className="inline-flex items-center gap-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#0F172A] to-[#3B82F6]/20 flex items-center justify-center">
                <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#3B82F6]" />
              </div>
              <span className="text-xs sm:text-sm text-white/30">/{String(index + 1).padStart(2, '0')}</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-white">
              {feature.title}
            </h2>
            
            <p className="text-sm sm:text-base lg:text-lg text-white/40 font-light leading-relaxed">
              {feature.description}
            </p>
            
            <ul className="space-y-2 sm:space-y-3">
              {feature.features.map((item, idx) => (
                <li key={idx} className="flex items-center gap-2 sm:gap-3 text-white/60">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-light">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Visual/Preview - Icono más grande en móvil */}
          <div className="flex-1 w-full">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#3B82F6]/20 to-[#60A5FA]/20 rounded-2xl blur-2xl" />
              <div className="relative bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6">
                <div className="aspect-square sm:aspect-video rounded-xl bg-gradient-to-br from-[#0F172A] to-[#1E3A5F] border border-white/5 flex items-center justify-center">
                  <Icon className="w-16 h-16 sm:w-20 sm:h-20 text-[#3B82F6]/30" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
// pages/Home/components/MobileMenu.tsx
import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface MobileMenuProps {
  sections: Array<{ id: string; title: string }>;
  onNavigate: (id: string) => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ sections, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
      >
        {isOpen ? <X className="w-5 h-5 text-white/60" /> : <Menu className="w-5 h-5 text-white/60" />}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="absolute top-16 left-0 right-0 z-50 bg-[#1A1A2E]/95 backdrop-blur-xl border-b border-white/10 py-4">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                onClick={() => {
                  setIsOpen(false);
                  onNavigate(section.id);
                }}
                className="block px-6 py-3 text-sm text-white/70 hover:bg-white/5 transition-colors"
              >
                {section.title}
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
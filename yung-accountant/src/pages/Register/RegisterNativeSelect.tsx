// pages/Register/RegisterNativeSelect.tsx
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { createPortal } from 'react-dom';

interface Option {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface RegisterNativeSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  error?: string | null;
  required?: boolean;
}

export const RegisterNativeSelect: React.FC<RegisterNativeSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  error,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.id === value);

  // Actualizar posición del dropdown (usando coordenadas absolutas de la pantalla)
  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = Math.min(options.length * 48, 250);
      
      // Posición inicial: justo debajo del botón
      let top = rect.bottom + 4;
      
      // Verificar si el dropdown se sale de la pantalla hacia abajo
      if (top + dropdownHeight > window.innerHeight && rect.top - dropdownHeight > 0) {
        // Si se sale y hay espacio arriba, mostrarlo hacia arriba
        top = rect.top - dropdownHeight - 4;
      }
      
      console.log('Dropdown position:', { top, left: rect.left, width: rect.width });
      
      setDropdownPosition({
        top: top,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      updatePosition();
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, options.length]);

  // Actualizar posición en scroll/resize
  useEffect(() => {
    if (isOpen) {
      const handleUpdate = () => updatePosition();
      window.addEventListener('scroll', handleUpdate, true);
      window.addEventListener('resize', handleUpdate);
      return () => {
        window.removeEventListener('scroll', handleUpdate, true);
        window.removeEventListener('resize', handleUpdate);
      };
    }
  }, [isOpen]);

  const handleSelect = (optionId: string) => {
    onChange(optionId);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    if (!isOpen) {
      // Actualizar posición antes de abrir
      setTimeout(updatePosition, 0);
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="w-full">
      <label className="block text-xs text-white/40 mb-1.5 font-light">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleDropdown}
        className={`w-full px-4 py-2.5 bg-white/[0.03] border rounded-lg text-white/80 text-sm font-light text-left flex items-center justify-between group transition-all duration-300 hover:bg-white/10 ${
          error ? 'border-red-500/50' : 'border-white/10 focus:border-[#3B82F6]/50'
        }`}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.icon && (
            <span className="flex-shrink-0 text-[#3B82F6]">
              {selectedOption.icon}
            </span>
          )}
          <span className="truncate">{selectedOption?.label || placeholder}</span>
        </span>
        <ChevronDown className={`w-4 h-4 text-white/40 transition-transform duration-300 flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[99999] bg-[#1A1A2E] backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden shadow-2xl"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
          }}
        >
          <div className="overflow-y-auto py-1" style={{ maxHeight: '250px' }}>
            {options.map((option) => {
              const isSelected = value === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option.id)}
                  className={`w-full px-4 py-2.5 text-left text-sm font-light flex items-center gap-2 transition-all duration-200 hover:bg-white/10 ${
                    isSelected ? 'bg-[#3B82F6]/20 text-[#3B82F6]' : 'text-white/80'
                  }`}
                >
                  {option.icon && (
                    <span className="flex-shrink-0 text-[#3B82F6]">
                      {option.icon}
                    </span>
                  )}
                  <span className="truncate flex-1">{option.label}</span>
                  {isSelected && (
                    <Check className="w-4 h-4 flex-shrink-0 text-[#3B82F6]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
      
      {error && (
        <div className="flex items-center gap-1 mt-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
          <p className="text-[10px] text-red-500/80">{error}</p>
        </div>
      )}
    </div>
  );
};
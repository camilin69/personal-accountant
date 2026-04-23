import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useMediaQuery } from '../../hooks/useMediaQuery';

const Layout: React.FC = () => {
  const location = useLocation();
  const mainContentRef = useRef<HTMLDivElement>(null);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
    // Cerrar menú al cambiar de página en móvil
    if (!isDesktop) {
      setIsMobileMenuOpen(false);
    }
  }, [location.pathname, isDesktop]);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="h-screen flex flex-col bg-[#0F0F1A] overflow-hidden">
      <Navbar onMobileMenuClick={toggleMobileMenu} />
      <div className="flex flex-1 overflow-hidden pt-[64px] relative">
        <div className={`
          fixed lg:relative inset-y-0 left-0 z-40
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <Sidebar isMobileOpen={isMobileMenuOpen} onCloseMobile={closeMobileMenu} />
        </div>
        
        {isMobileMenuOpen && !isDesktop && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
            onClick={closeMobileMenu}
          />
        )}
        
        <main 
          ref={mainContentRef}
          className="flex-1 overflow-y-auto bg-[#0F0F1A] w-full"
        >
          <div className="p-3 sm:p-4 md:p-6 max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
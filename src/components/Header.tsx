import React, { useState, useEffect } from 'react';
import { useAnimation } from '../context/AnimationContext';
import { useLocation, useNavigate } from 'react-router-dom';
import logoSrc from '/logo.svg';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const { triggerAnimation } = useAnimation();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (logoClicks === 3) {
      window.scrollTo(0, 0);
      navigate('/admin/login');
      setLogoClicks(0);
    }

    const timer = setTimeout(() => {
      setLogoClicks(0);
    }, 2000);

    return () => clearTimeout(timer);
  }, [logoClicks, navigate]);

  const scrollToSection = (id: string) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          window.scrollTo({
            top: element.offsetTop - 64,
            behavior: 'smooth'
          });
        }
      }, 100);
    } else {
      const element = document.getElementById(id);
      if (element) {
        window.scrollTo({
          top: element.offsetTop - 64,
          behavior: 'smooth'
        });
      }
    }
    setMobileMenuOpen(false);
  };

  const handleLogoClick = () => {
    setLogoClicks(prev => prev + 1);
    if (location.pathname === '/') {
      triggerAnimation();
    } else {
      navigate('/');
    }
    scrollToSection('intro');
  };

  const isDetailPage = location.pathname.includes('/notice/') || location.pathname.includes('/apply');
  const isHomePage = location.pathname === '/';

  return (
    <header 
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled || !isHomePage ? 'bg-white/95 backdrop-blur-sm shadow-md py-2' : 'bg-black/20 backdrop-blur-sm py-3'
      }`}
      style={{ transform: 'none' }}
    >
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div 
          className="flex items-center cursor-pointer" 
          onClick={handleLogoClick}
        >
          <img 
            src={logoSrc}
            alt="대전HB슈팅클럽 로고" 
            className="h-8 w-8 sm:h-10 sm:w-10 mr-2"
          />
          <h1 
            className={`text-lg sm:text-xl font-bold transition-colors duration-300 ${
              isScrolled || !isHomePage ? 'text-blue-900' : 'text-white'
            }`}
          >
            대전HB슈팅클럽
          </h1>
        </div>

        <nav className="hidden md:block">
          <ul className="flex gap-6">
            {['intro', 'instructor', 'notice', 'pricing', 'location', 'contact'].map((section, index) => (
              <li key={index}>
                <button
                  className={`font-medium text-sm lg:text-base transition-colors duration-300 hover:text-blue-700 ${
                    isScrolled || !isHomePage ? 'text-gray-800' : 'text-white'
                  }`}
                  onClick={() => scrollToSection(section)}
                >
                  {section === 'intro' && '소개'}
                  {section === 'instructor' && '지도자 약력'}
                  {section === 'notice' && '공지사항'}
                  {section === 'pricing' && '가격안내'}
                  {section === 'location' && '찾아오시는 길'}
                  {section === 'contact' && '상담문의'}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <button 
          className="md:hidden p-2 -mr-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="메뉴 열기"
        >
          <div className={`w-6 h-0.5 mb-1.5 transition-all duration-300 ${
            isScrolled || !isHomePage ? 'bg-gray-800' : 'bg-white'
          } ${mobileMenuOpen ? 'transform rotate-45 translate-y-2' : ''}`} />
          <div className={`w-6 h-0.5 mb-1.5 transition-all duration-300 ${
            isScrolled || !isHomePage ? 'bg-gray-800' : 'bg-white'
          } ${mobileMenuOpen ? 'opacity-0' : ''}`} />
          <div className={`w-6 h-0.5 transition-all duration-300 ${
            isScrolled || !isHomePage ? 'bg-gray-800' : 'bg-white'
          } ${mobileMenuOpen ? 'transform -rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      <div 
        className={`md:hidden fixed left-0 right-0 bg-white shadow-lg transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? 'max-h-[calc(100vh-4rem)] overflow-y-auto' : 'max-h-0 overflow-hidden'
        }`}
      >
        <ul className="py-2 px-4">
          {['intro', 'instructor', 'notice', 'pricing', 'location', 'contact'].map((section, index) => (
            <li key={index} className="border-b border-gray-100 last:border-none">
              <button
                className="w-full py-4 text-left font-medium text-gray-800 hover:text-blue-700 transition-colors"
                onClick={() => scrollToSection(section)}
              >
                {section === 'intro' && '소개'}
                {section === 'instructor' && '지도자 약력'}
                {section === 'notice' && '공지사항'}
                {section === 'pricing' && '가격안내'}
                {section === 'location' && '찾아오시는 길'}
                {section === 'contact' && '상담문의'}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
};

export default Header;
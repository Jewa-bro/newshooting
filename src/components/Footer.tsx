import React from 'react';
import { useNavigate } from 'react-router-dom';
import logoSrc from '/logo.svg';

const Footer = () => {
  const navigate = useNavigate();

  const handleAdminAccess = () => {
    window.scrollTo(0, 0);
    navigate('/admin/login');
  };

  return (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div className="flex items-center mb-6 md:mb-0">
            <img 
              src={logoSrc} 
              alt="대전HB슈팅클럽 로고" 
              className="h-8 w-8 mr-2"
            />
            <div>
              <h4 className="text-xl font-bold text-white">대전HB슈팅클럽</h4>
              <p className="text-sm">대전광역시 대덕대로 317번길 20 선사엔조이 5층</p>
            </div>
          </div>
          
          <div className="text-center md:text-right">
            <p 
              className="text-sm cursor-pointer hover:text-gray-300 transition-colors"
              onClick={handleAdminAccess}
            >
              사업자등록번호: 203-82-73001
            </p>
            <p className="text-sm">대표: 명희정</p>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-6 text-center">
          <p className="text-sm">&copy; {new Date().getFullYear()} 대전HB슈팅클럽. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
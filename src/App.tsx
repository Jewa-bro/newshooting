import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import IntroSection from './components/IntroSection';
import InstructorSection from './components/InstructorSection';
import NoticeSection from './components/NoticeSection';
import PricingSection from './components/PricingSection';
import LocationSection from './components/LocationSection';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';
import OpeningAnimation from './components/OpeningAnimation';
import NoticeDetail from './pages/NoticeDetail';
import ApplicationForm from './pages/ApplicationForm';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import BusinessForm from './pages/BusinessForm';
import NoticeForm from './pages/NoticeForm';
import { AnimationProvider, useAnimation } from './context/AnimationContext';
import PopupModal from './components/PopupModal';

const AppContent = () => {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <AnimationProvider>
      {!isAdminPage && <OpeningAnimation />}
      {!isAdminPage && <Header />}
      <MainContent />
    </AnimationProvider>
  );
};

const MainContent = () => {
  const { mainPageOpacity, triggerAnimation, hasAnimationPlayedOnce } = useAnimation();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  
  useEffect(() => {
    // 어드민 페이지가 아닐 때만 애니메이션 표시
    if (!isAdminPage) {
      triggerAnimation();
    }
  }, [isAdminPage, triggerAnimation, location.pathname]);
  
  return (
    <div 
      className="font-sans text-gray-800 bg-gray-50 transition-opacity duration-500"
      style={{ opacity: mainPageOpacity }}
    >
      {!isAdminPage && hasAnimationPlayedOnce && <PopupModal />}
      <Routes>
        <Route path="/" element={
          <main>
            <IntroSection />
            <InstructorSection />
            <NoticeSection />
            <PricingSection />
            <LocationSection />
            <ContactSection />
          </main>
        } />
        <Route path="/notice/:id" element={<NoticeDetail />} />
        <Route path="/apply" element={<ApplicationForm />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard/*" element={<AdminDashboard />} />
        <Route path="/admin/dashboard/business/new" element={<BusinessForm />} />
        <Route path="/admin/dashboard/business/edit/:id" element={<BusinessForm />} />
        <Route path="/admin/dashboard/notice/new" element={<NoticeForm />} />
        <Route path="/admin/dashboard/notice/edit/:id" element={<NoticeForm />} />
      </Routes>
      {!isAdminPage && <Footer />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
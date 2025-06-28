import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import IntroSection from './components/IntroSection';
import VideoSection from './components/VideoSection';
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
  const navigate = useNavigate();
  const isAdminPage = location.pathname.startsWith('/admin');
  const isMainPage = location.pathname === '/'; // Check if it's the main page

  useEffect(() => {
    // Handle 404 redirect recovery
    const redirectedPath = sessionStorage.getItem('redirect');
    if (redirectedPath) {
      sessionStorage.removeItem('redirect');
      navigate(redirectedPath, { replace: true });
    }
  }, [navigate]);

  // Scroll to top on main page load/refresh or navigation to main page
  useEffect(() => {
    if (isMainPage) {
      window.scrollTo(0, 0);
    }
  }, [isMainPage]); // Re-run when isMainPage changes (e.g. navigating to or from main page)

  return (
    <AnimationProvider>
      {isMainPage && !isAdminPage && <OpeningAnimation />}
      {!isAdminPage && <Header />}
      <MainContent />
    </AnimationProvider>
  );
};

const MainContent = () => {
  const { mainPageOpacity, triggerAnimation, hasAnimationPlayedOnce } = useAnimation();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  const isMainPage = location.pathname === '/'; // Check if it's the main page
  
  useEffect(() => {
    // Trigger opening animation sequence only on the main, non-admin page
    if (isMainPage && !isAdminPage) {
      triggerAnimation();
    }
  }, [isMainPage, isAdminPage, triggerAnimation]); // Dependencies updated
  
  return (
    <div 
      className="font-sans text-gray-800 bg-gray-50 transition-opacity duration-500"
      style={{ opacity: mainPageOpacity }}
    >
      {isMainPage && !isAdminPage && hasAnimationPlayedOnce && <PopupModal />}
      <Routes>
        <Route path="/" element={
          <main>
            <IntroSection />
            <VideoSection />
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
  // console.log('Vite base URL:', import.meta.env.BASE_URL);
  return (
    <Router basename={import.meta.env.BASE_URL}> 
      <AppContent />
    </Router>
  );
}

export default App;
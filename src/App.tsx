import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Orthopaedic from './pages/Orthopaedic';
import ChildCare from './pages/ChildCare';
import Doctors from './pages/Doctors';
import Gallery from './pages/Gallery';
import Blog from './pages/Blog';
import Contact from './pages/Contact';
import AskUs from './pages/AskUs';
import Appointment from './pages/Appointment';
import Admin from './pages/Admin';
import Login from './pages/Login';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import { authService } from './lib/auth';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}

function ProtectedAdminRoute() {
  const isAuthenticated = authService.isAuthenticated();
  return isAuthenticated ? <Admin /> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <>
      <ScrollToTop />

      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/about" element={<Layout><About /></Layout>} />
        <Route path="/orthopaedic" element={<Layout><Orthopaedic /></Layout>} />
        <Route path="/child-care" element={<Layout><ChildCare /></Layout>} />
        <Route path="/doctors" element={<Layout><Doctors /></Layout>} />
        <Route path="/gallery" element={<Layout><Gallery /></Layout>} />
        <Route path="/blog" element={<Layout><Blog /></Layout>} />
        <Route path="/contact" element={<Layout><Contact /></Layout>} />
        <Route path="/ask-us" element={<Layout><AskUs /></Layout>} />
        <Route path="/appointment" element={<Layout><Appointment /></Layout>} />
        <Route path="/privacy-policy" element={<Layout><PrivacyPolicy /></Layout>} />
        <Route path="/terms" element={<Layout><Terms /></Layout>} />

        {/* Login/Admin */}
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<ProtectedAdminRoute />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
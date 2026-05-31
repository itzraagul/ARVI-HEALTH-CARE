import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Phone, ChevronDown } from 'lucide-react';
import FlashTicker from './FlashTicker';

const navLinks = [
  { label: 'Home', href: '/' },
  {
    label: 'About', href: '/about',
    children: [
      { label: 'About Us', href: '/about' },
      { label: 'Our Doctors', href: '/doctors' },
    ],
  },
  {
    label: 'Services', href: '/orthopaedic',
    children: [
      { label: 'Orthopaedic Care', href: '/orthopaedic' },
      { label: 'Child Care', href: '/child-care' },
    ],
  },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Patient Stories', href: '/gallery?tab=stories' },
  { label: 'Blog', href: '/blog' },
  { label: 'Ask Us', href: '/ask-us' },
  { label: 'Contact', href: '/contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const location = useLocation();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMobileExpanded(null);
    setActiveDropdown(null);
  }, [location]);

  const openDropdown = (label: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveDropdown(label);
  };

  const closeDropdown = () => {
    closeTimer.current = setTimeout(() => setActiveDropdown(null), 150);
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md py-2' : 'bg-white/95 backdrop-blur-sm py-3'}`}>
      {/* Top bar */}
      <div className="bg-[#0A3D62] text-white text-xs py-1.5 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <span>Helping You Move, Helping Them Grow</span>
          <div className="flex items-center gap-4">
            <a href="tel:+919677080778" className="flex items-center gap-1 hover:text-[#0F9FA8] transition-colors">
              <Phone size={12} /> +91 96770 80778
            </a>
            <span className="opacity-50">|</span>
            <span>MON–SAT: 10AM–1PM | 5PM–10PM  |  SUN: 10AM–6PM</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/images/Logo.jpg" alt="ARVI Ortho & Child Care" className="h-12 w-auto" />
            <div className="hidden sm:block">
              <p className="text-[#0A3D62] font-bold text-sm leading-tight font-heading">ARVI ORTHO &</p>
              <p className="text-[#0A3D62] font-bold text-sm leading-tight font-heading">CHILD CARE</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <div
                key={link.href}
                className="relative"
                onMouseEnter={() => link.children && openDropdown(link.label)}
                onMouseLeave={() => link.children && closeDropdown()}
              >
                <Link
                  to={link.href}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    location.pathname === link.href ? 'text-[#0F9FA8] bg-[#0F9FA8]/10' : 'text-gray-700 hover:text-[#0F9FA8] hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                  {link.children && (
                    <ChevronDown size={14} className={`transition-transform duration-200 ${activeDropdown === link.label ? 'rotate-180' : ''}`} />
                  )}
                </Link>

                {link.children && activeDropdown === link.label && (
                  <div
                    className="absolute left-0 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50"
                    style={{ top: 'calc(100% - 2px)' }}
                    onMouseEnter={() => openDropdown(link.label)}
                    onMouseLeave={() => closeDropdown()}
                  >
                    {/* invisible bridge to close gap */}
                    <div className="absolute -top-2 left-0 right-0 h-2" />
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        to={child.href}
                        className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-[#0F9FA8]/10 hover:text-[#0F9FA8] transition-colors"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <a
              href="https://wa.me/919677080778"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/30 text-sm font-semibold hover:bg-[#25D366] hover:text-white transition-all duration-200"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </a>
            <Link to="/appointment" className="btn-primary text-sm px-5 py-2.5">Book Appointment</Link>
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 shadow-lg animate-fade-in">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <div key={link.href}>
                <div className="flex items-center justify-between">
                  <Link
                    to={link.href}
                    className={`flex-1 block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      location.pathname === link.href ? 'text-[#0F9FA8] bg-[#0F9FA8]/10' : 'text-gray-700 hover:text-[#0F9FA8] hover:bg-gray-50'
                    }`}
                  >
                    {link.label}
                  </Link>
                  {link.children && (
                    <button
                      onClick={() => setMobileExpanded(mobileExpanded === link.label ? null : link.label)}
                      className="p-3 text-gray-500"
                    >
                      <ChevronDown size={16} className={`transition-transform ${mobileExpanded === link.label ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
                {link.children && mobileExpanded === link.label && (
                  <div className="pl-6 mt-1 space-y-1">
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        to={child.href}
                        className="block px-4 py-2.5 text-sm text-gray-500 hover:text-[#0F9FA8] rounded-lg hover:bg-gray-50"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="pt-3 flex flex-col gap-2">
              <Link to="/appointment" className="btn-primary justify-center">Book Appointment</Link>
              <a href="tel:+919677080778" className="btn-secondary justify-center"><Phone size={14} /> Call Now</a>
            </div>
          </div>
        </div>
      )}
      <FlashTicker />
    </header>
  );
}

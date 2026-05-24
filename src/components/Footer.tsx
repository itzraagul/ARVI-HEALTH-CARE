import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Youtube } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0A3D62] text-white">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src="/images/Logo.jpg" alt="ARVI" className="h-14 w-auto rounded-lg" />
              <div>
                <p className="font-bold text-base leading-tight font-heading">ARVI ORTHO &</p>
                <p className="font-bold text-base leading-tight font-heading">CHILD CARE</p>
              </div>
            </div>
            <p className="text-blue-200 text-sm leading-relaxed mb-5">
              Advanced Orthopaedic & Pediatric care in Porur, Chennai. Expert specialists dedicated to your family's health and well-being.
            </p>
            <div className="flex gap-3">
              {[
                { icon: Instagram, href: 'https://www.instagram.com/arviclinic' },
              ].map(({ icon: Icon, href }) => (
                <a
                  key={href}
                  href={href}
                  className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-[#0F9FA8] transition-colors"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-base mb-5 font-heading">Quick Links</h3>
            <ul className="space-y-2.5">
              {[
                { label: 'Home', href: '/' },
                { label: 'About Us', href: '/about' },
                { label: 'Orthopaedic Care', href: '/orthopaedic' },
                { label: 'Pediatric Care', href: '/child-care' },
                { label: 'Our Doctors', href: '/doctors' },
                { label: 'Gallery', href: '/gallery' },
                { label: 'Contact', href: '/contact' },
                { label: 'Book Appointment', href: '/appointment' },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    to={l.href}
                    className="text-blue-200 text-sm hover:text-[#0F9FA8] transition-colors flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0F9FA8] flex-shrink-0" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-bold text-base mb-5 font-heading">Our Services</h3>
            <ul className="space-y-2.5">
              {[
                'Fracture Treatment',
                'Joint Pain Care',
                'Spine Treatment',
                'Arthritis Management',
                'Child Vaccination',
                'Growth Monitoring',
                'Nutrition Guidance',
                'Physiotherapy',
              ].map((s) => (
                <li key={s} className="text-blue-200 text-sm flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3CB371] flex-shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-base mb-5 font-heading">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-blue-200">
                <MapPin size={16} className="text-[#0F9FA8] mt-0.5 flex-shrink-0" />
                <span>Rasi Complex, Door No.116/1, Mount Poonamallee Road, Porur, Chennai – 600116</span>
              </li>
              <li>
                <a href="tel:+919677080778" className="flex items-center gap-3 text-sm text-blue-200 hover:text-[#0F9FA8] transition-colors">
                  <Phone size={16} className="text-[#0F9FA8] flex-shrink-0" />
                  +91 96770 80778
                </a>
              </li>
              <li>
                <a href="mailto:arviorthoandchildcare@gmail.com" className="flex items-center gap-3 text-sm text-blue-200 hover:text-[#0F9FA8] transition-colors">
                  <Mail size={16} className="text-[#0F9FA8] flex-shrink-0" />
                  arviorthoandchildcare@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-blue-200">
                <Clock size={16} className="text-[#0F9FA8] mt-0.5 flex-shrink-0" />
                <div>
                  <p>Mon – Sat: 9:00 AM – 8:00 PM</p>
                  <p>Sunday: 10:00 AM – 2:00 PM</p>
                </div>
              </li>
            </ul>
            <a
              href="https://wa.me/919677080778"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] text-white text-sm font-semibold hover:bg-[#1da851] transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col md:flex-row justify-between items-center gap-3 text-sm text-blue-300">
          <p>© 2025 ARVI Ortho and Child Care. All rights reserved.</p>
          <div className="flex gap-5">
            <Link to="/privacy-policy" className="hover:text-[#0F9FA8] transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-[#0F9FA8] transition-colors">Terms & Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

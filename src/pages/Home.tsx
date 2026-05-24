import HeroSection from '../components/HeroSection';
import AboutSection from '../components/AboutSection';
import DoctorsSection from '../components/DoctorsSection';
import ServicesSection from '../components/ServicesSection';
import WhyChooseUs from '../components/WhyChooseUs';
import TestimonialsSection from '../components/TestimonialsSection';
import { Link } from 'react-router-dom';
import { ArrowRight, Phone } from 'lucide-react';

export default function Home() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <ServicesSection />
      <DoctorsSection />
      <WhyChooseUs />
      <TestimonialsSection />

      {/* CTA Banner */}
      <section className="py-16 bg-[#0A3D62]">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white font-heading mb-4">
            Ready to Take the First Step?
          </h2>
          <p className="text-blue-200 text-lg mb-8 max-w-2xl mx-auto">
            Book your appointment today and experience healthcare that truly cares about you and your family.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/appointment" className="btn-primary text-base px-8 py-4">
              <ArrowRight size={18} /> Book Appointment
            </Link>
            <a href="tel:+919677080778" className="flex items-center gap-2 px-8 py-4 border-2 border-white text-white rounded-xl font-semibold text-base hover:bg-white hover:text-[#0A3D62] transition-all duration-300">
              <Phone size={18} /> Call +91 96770 80778
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

import { Link } from 'react-router-dom';
import { Phone, Calendar, Star, Users, Award } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-[#e8f8f9] via-[#f0f9ff] to-[#e8f5e9]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-[#0F9FA8]/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-[#3CB371]/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#0A3D62]/5 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-28 pb-16 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0F9FA8]/10 border border-[#0F9FA8]/30 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-[#0F9FA8] animate-pulse" />
              <span className="text-[#0F9FA8] text-sm font-semibold">Trusted Healthcare in Porur, Chennai</span>
            </div>

            <div className="animate-fade-up">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#0A3D62] leading-tight font-heading">
                Advanced
                <span className="block text-[#0F9FA8]">Orthopaedic &</span>
                <span className="block">Pediatric Care</span>
              </h1>
              <p className="mt-4 text-xl text-[#3CB371] font-semibold italic">
                "Helping You Move, Helping Them Grow"
              </p>
              <p className="mt-4 text-gray-600 text-lg leading-relaxed max-w-lg">
                Comprehensive orthopaedic surgery and pediatric care under one roof. Expert specialists dedicated to your family's health and well-being.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 animate-fade-up delay-200">
              <Link to="/appointment" className="btn-primary text-base px-7 py-4">
                <Calendar size={18} /> Book Appointment
              </Link>
              <a href="tel:+919677080778" className="btn-secondary text-base px-7 py-4">
                <Phone size={18} /> Call Now
              </a>
              <a
                href="https://wa.me/919677080778"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-7 py-4 rounded-xl bg-[#25D366] text-white font-semibold text-base hover:bg-[#1da851] transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </a>
            </div>

            <div className="flex flex-wrap gap-6 animate-fade-up delay-300">
              {[
                { icon: Users, value: '5000+', label: 'Patients Treated' },
                { icon: Award, value: '4.9★', label: 'Patient Rating' },
                { icon: Star, value: '24/7', label: 'Emergency Support' },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0F9FA8]/10 flex items-center justify-center">
                    <Icon size={18} className="text-[#0F9FA8]" />
                  </div>
                  <div>
                    <p className="font-bold text-[#0A3D62] text-lg leading-none">{value}</p>
                    <p className="text-gray-500 text-xs">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Hero Banner + floating rating card only */}
          <div className="relative animate-fade-in delay-200">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img
                src="/images/Logo-banner.png"
                alt="ARVI Ortho and Child Care Clinic"
                className="w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A3D62]/20 to-transparent" />
            </div>

            {/* Floating rating card only — Quick Appointment card removed */}
            <div className="absolute -top-4 -right-4 glass rounded-2xl shadow-glass p-4 animate-float delay-300">
              <div className="flex items-center gap-2 mb-1">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} size={14} fill="#f59e0b" className="text-amber-400" />
                ))}
              </div>
              <p className="text-[#0A3D62] font-bold text-lg">4.9/5</p>
              <p className="text-gray-500 text-xs">500+ Google Reviews</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

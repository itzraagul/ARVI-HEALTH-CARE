import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';

export default function AboutSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          {/* Image area */}
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img
                src="/images/Surgery.PNG"
                alt="Expert Orthopaedic Care"
                className="w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A3D62]/40 to-transparent" />
            </div>
            {/* Floating stat */}
            <div className="absolute -top-5 -left-5 bg-[#0A3D62] text-white rounded-2xl shadow-xl p-4 animate-float delay-300">
              <p className="text-3xl font-bold font-heading">5000+</p>
              <p className="text-blue-300 text-xs">Happy Patients</p>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6">
            <div>
              <span className="text-[#0F9FA8] text-sm font-semibold tracking-widest uppercase">About ARVI Clinic</span>
              <h2 className="mt-3 text-3xl md:text-4xl font-bold text-[#0A3D62] font-heading leading-tight">
                Comprehensive Care for<br />
                <span className="text-[#0F9FA8]">Your Entire Family</span>
              </h2>
            </div>

            <p className="text-gray-600 leading-relaxed">
              ARVI Ortho and Child Care is a premier multi-specialty clinic located in Porur, Chennai, dedicated to providing exceptional orthopaedic and Paediatric healthcare services. Our clinic combines cutting-edge medical technology with compassionate, personalized care.
            </p>

            <p className="text-gray-600 leading-relaxed">
              Founded by two passionate specialists — Dr. Aravindasamy M (MS Ortho) and Dr. Vishali G (MD Paediatrics) — our clinic serves families across Chennai with a commitment to excellence in every aspect of care.
            </p>

            {/* Highlights */}
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                'Expert Orthopaedic Surgery',
                'Comprehensive Paediatric Care',
                'Modern Diagnostic Facilities',
                'Physiotherapy & Rehabilitation',
                'Child Vaccination Programs',
                'Emergency Medical Support',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5">
                  <CheckCircle size={16} className="text-[#3CB371] flex-shrink-0" />
                  <span className="text-sm text-gray-700 font-medium">{item}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link to="/about" className="btn-primary">
                Learn More <ArrowRight size={16} />
              </Link>
              <Link to="/doctors" className="btn-secondary">
                Meet Our Doctors
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

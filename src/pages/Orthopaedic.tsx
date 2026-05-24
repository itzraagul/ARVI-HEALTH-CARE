import { Link } from 'react-router-dom';
import { CheckCircle, Phone, Calendar } from 'lucide-react';

const treatments = [
  {
    title: 'Fracture Management',
    desc: 'Expert management of all fracture types — simple to complex — using modern fixation techniques for optimal healing.',
    icon: '🦴',
  },
  {
    title: 'Spine Treatment',
    desc: 'Advanced diagnosis and treatment of disc problems, spondylitis, spinal stenosis, and other spine conditions.',
    icon: '🔬',
  },
  {
    title: 'Joint Pain Treatment',
    desc: 'Comprehensive care for knee, hip, shoulder and ankle pain including injections and surgical options.',
    icon: '🦵',
  },
  {
    title: 'Arthritis Care',
    desc: 'Medical and surgical management of osteoarthritis, rheumatoid arthritis, and other joint conditions.',
    icon: '💊',
  },
  {
    title: 'Ligament Injuries',
    desc: 'Treatment for ACL, PCL, meniscal tears and other sports-related ligament injuries with rehabilitation.',
    icon: '⚡',
  },
  {
    title: 'Pain Management',
    desc: 'Holistic approach to acute and chronic musculoskeletal pain with medication, therapy and procedures.',
    icon: '🩺',
  },
  {
    title: 'Physiotherapy',
    desc: 'Expert physiotherapy sessions for post-surgical recovery, sports injuries, and chronic pain rehabilitation.',
    icon: '🏃',
  },
  {
    title: 'Home Physiotherapy',
    desc: 'Specialized physiotherapy services at your doorstep for patients who cannot visit the clinic.',
    icon: '🏠',
  },
];

export default function Orthopaedic() {
  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-[#e8f8f9] to-[#f0f9ff] relative overflow-hidden">
        <div className="absolute right-0 top-0 w-1/2 h-full opacity-10 pointer-events-none">
          <img src="/images/Surgery.PNG" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="max-w-7xl mx-auto px-4">
          <div className="max-w-2xl">
            <span className="text-[#0F9FA8] text-sm font-semibold tracking-widest uppercase">Orthopaedic Excellence</span>
            <h1 className="mt-3 text-4xl md:text-5xl font-bold text-[#0A3D62] font-heading leading-tight">
              Advanced Orthopaedic Care
            </h1>
            <p className="mt-5 text-gray-600 text-lg leading-relaxed">
              Expert orthopaedic surgery and treatment by Dr. Aravindasamy M (MS Ortho), Consultant Orthopaedic Surgeon with 10+ years of specialized experience.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <Link to="/appointment" className="btn-primary text-base px-7 py-4">
                <Calendar size={18} /> Book Appointment
              </Link>
              <a href="tel:+919677080778" className="btn-secondary text-base px-7 py-4">
                <Phone size={18} /> Call Now
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Doctor spotlight */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <img
                src="/images/Aravind.PNG"
                alt="Dr. Aravindasamy"
                className="rounded-3xl shadow-2xl w-full object-cover max-h-[500px]"
              />
            </div>
            <div className="space-y-5">
              <span className="text-[#0F9FA8] text-sm font-semibold tracking-widest uppercase">Our Orthopaedic Specialist</span>
              <h2 className="text-3xl font-bold text-[#0A3D62] font-heading">Dr. Aravindasamy M</h2>
              <p className="text-[#0F9FA8] font-semibold">MS Orthopaedics | Consultant Orthopaedic Surgeon</p>
              <p className="text-gray-600 leading-relaxed">
                Dr. Aravindasamy is a highly skilled orthopaedic surgeon specializing in fracture management, spine conditions, joint replacement, and sports injuries. His patient-first approach combined with surgical precision has helped thousands of patients regain mobility and quality of life.
              </p>
              <div className="space-y-2">
                {[
                  'Expert in complex fracture management',
                  'Advanced spine surgery techniques',
                  'Joint replacement and arthroscopy',
                  'Sports injury rehabilitation',
                  'Minimally invasive procedures',
                ].map((s) => (
                  <div key={s} className="flex items-center gap-2.5">
                    <CheckCircle size={16} className="text-[#3CB371] flex-shrink-0" />
                    <span className="text-sm text-gray-700">{s}</span>
                  </div>
                ))}
              </div>
              <Link to="/appointment" className="btn-primary">
                <Calendar size={16} /> Book with Dr. Aravindasamy
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Treatments */}
      <section className="py-20 bg-[#F5F7FA]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-[#0F9FA8] text-sm font-semibold tracking-widest uppercase">Treatments We Offer</span>
            <h2 className="mt-3 text-3xl font-bold text-[#0A3D62] font-heading">Orthopaedic Services</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {treatments.map((t) => (
              <div key={t.title} className="bg-white rounded-2xl p-6 shadow-card card-hover">
                <div className="text-3xl mb-4">{t.icon}</div>
                <h3 className="text-base font-bold text-[#0A3D62] font-heading mb-2">{t.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Surgery image */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl">
            <img src="/images/Surgery.PNG" alt="Expert Orthopaedic Surgery" className="w-full object-cover max-h-96" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A3D62]/80 to-transparent flex items-center">
              <div className="p-10 max-w-xl text-white">
                <h2 className="text-3xl font-bold font-heading mb-3">Expert Care. Better Outcomes.</h2>
                <p className="text-blue-200 mb-6">Personalized orthopaedic care to help you move better and live better. Book your consultation today.</p>
                <Link to="/appointment" className="btn-primary">
                  Book Consultation
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
import { Link } from 'react-router-dom';
import { Calendar, Phone, Award, Star } from 'lucide-react';

const doctors = [
  {
    name: 'Dr. Aravindasamy M',
    qualification: 'MS Orthopaedics',
    role: 'Consultant Orthopaedic Surgeon',
    image: '/images/Aravind.PNG',
    specialties: [
      'Fracture Management',
      'Spine Problems',
      'Joint Pain Treatment',
      'Arthritis Care',
      'Ligament Injuries',
      'Pain Management',
    ],
    color: 'from-[#0A3D62] to-[#0F9FA8]',
    badge: 'Orthopaedic Specialist',
    badgeColor: 'bg-[#0F9FA8]/10 text-[#0F9FA8]',
  },
  {
    name: 'Dr. Vishali G',
    qualification: 'MD Paediatrics',
    role: 'Consultant Paediatrician',
    image: '/images/vishali.PNG',
    specialties: [
      'Child Consultation',
      'Vaccination',
      'Growth & Development',
      'Nutrition & Diet',
      'Fever & Infection Care',
      'Newborn & Baby Care',
    ],
    color: 'from-[#3CB371] to-[#0F9FA8]',
    badge: 'Paediatric Specialist',
    badgeColor: 'bg-[#3CB371]/10 text-[#3CB371]',
  },
  {
    name: 'Physiotherapist Expert',
    qualification: 'Certified & Experienced',
    role: 'Professional Physiotherapy Services',
    image: '/images/Clinic_Pictures_(8).jpg',
    specialties: [
      'Post-Surgical Rehab',
      'Sports Injuries',
      'Chronic Pain',
      'Joint Mobility',
      'Strength Training',
      'Home Therapy',
    ],
    color: 'from-[#FF8C42] to-[#FFB84D]',
    badge: 'Physiotherapy Expert',
    badgeColor: 'bg-[#FF8C42]/10 text-[#FF8C42]',
  },
];

export default function DoctorsSection() {
  return (
    <section className="py-20 bg-[#F5F7FA]">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="text-[#0F9FA8] text-sm font-semibold tracking-widest uppercase">Meet Our Specialists</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold text-[#0A3D62] font-heading">
            Expert Doctors, Compassionate Care
          </h2>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Our highly qualified specialists bring years of expertise combined with genuine compassion to provide the best outcomes for you and your family.
          </p>
        </div>

        {/* Doctor Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {doctors.map((doc) => (
            <div
              key={doc.name}
              className="bg-white rounded-3xl overflow-hidden shadow-card card-hover group"
            >
              {/* Image area */}
              <div className={`relative h-72 bg-gradient-to-br ${doc.color} overflow-hidden`}>
                <img
                  src={doc.image}
                  alt={doc.name}
                  className="absolute inset-0 w-full h-full object-cover object-top mix-blend-overlay opacity-80 group-hover:scale-105 transition-transform duration-500"
                />
                <img
                  src={doc.image}
                  alt={doc.name}
                  className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A3D62]/70 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${doc.badgeColor} bg-white/90 backdrop-blur-sm text-xs font-semibold`}>
                    <Star size={12} fill="currentColor" />
                    {doc.badge}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-[#0A3D62] font-heading">{doc.name}</h3>
                <p className="text-[#0F9FA8] text-sm font-semibold mt-0.5">{doc.qualification}</p>
                <p className="text-gray-500 text-sm">{doc.role}</p>

                {/* Specialties */}
                <div className="mt-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Specialties</p>
                  <div className="flex flex-wrap gap-2">
                    {doc.specialties.map((s) => (
                      <span
                        key={s}
                        className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 font-medium"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-5 flex gap-3">
                  <Link
                    to="/appointment"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#0A3D62] text-white rounded-xl text-sm font-semibold hover:bg-[#0F9FA8] transition-colors"
                  >
                    <Calendar size={14} />
                    Book Appointment
                  </Link>
                  <a
                    href="tel:+919677080778"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-[#0F9FA8] text-[#0F9FA8] rounded-xl text-sm font-semibold hover:bg-[#0F9FA8] hover:text-white transition-colors"
                  >
                    <Phone size={14} />
                    Call
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

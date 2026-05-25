import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const services = [
  {
    title: 'Orthopaedic Care',
    description: 'Advanced treatment for bones, joints, muscles, and spine conditions by our expert orthopaedic surgeon.',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 8c-4 0-8 4-8 8s2 6 4 8l-8 16c-2 4 0 8 4 8s6-3 8-7l2-5 2 5c2 4 4 7 8 7s6-4 4-8l-8-16c2-2 4-4 4-8s-4-8-8-8z" fill="currentColor" opacity="0.2"/><path d="M32 8c-4 0-8 4-8 8s2 6 4 8l-8 16c-2 4 0 8 4 8s6-3 8-7l2-5 2 5c2 4 4 7 8 7s6-4 4-8l-8-16c2-2 4-4 4-8s-4-8-8-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    href: '/orthopaedic',
    color: 'text-[#0F9FA8] bg-[#0F9FA8]/10',
  },
  {
    title: 'Fracture Treatment',
    description: 'Expert management of all types of fractures using modern techniques for faster, complete recovery.',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 12l8 16-6 4 8 20M44 12l-8 16 6 4-8 20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    href: '/orthopaedic',
    color: 'text-[#0A3D62] bg-[#0A3D62]/10',
  },
  {
    title: 'Spine Care',
    description: 'Specialized diagnosis and treatment for back pain, disc problems, and spinal conditions.',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-8 h-8"><ellipse cx="32" cy="12" rx="8" ry="6" stroke="currentColor" strokeWidth="2.5"/><ellipse cx="32" cy="28" rx="8" ry="6" stroke="currentColor" strokeWidth="2.5"/><ellipse cx="32" cy="44" rx="8" ry="6" stroke="currentColor" strokeWidth="2.5"/><line x1="32" y1="18" x2="32" y2="22" stroke="currentColor" strokeWidth="2.5"/><line x1="32" y1="34" x2="32" y2="38" stroke="currentColor" strokeWidth="2.5"/></svg>
    ),
    href: '/orthopaedic',
    color: 'text-[#3CB371] bg-[#3CB371]/10',
  },
  {
    title: 'Arthritis Treatment',
    description: 'Comprehensive arthritis management including medical therapy and surgical interventions when needed.',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-8 h-8"><circle cx="32" cy="32" r="16" stroke="currentColor" strokeWidth="2.5"/><path d="M32 20v12l8 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/><path d="M20 32h4M40 32h4M32 20v-4M32 44v4" stroke="currentColor" strokeWidth="2"/></svg>
    ),
    href: '/orthopaedic',
    color: 'text-[#0F9FA8] bg-[#0F9FA8]/10',
  },
  {
    title: 'Child Consultation',
    description: 'Comprehensive Paediatric consultations for all childhood illnesses, developmental concerns, and wellness checks.',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-8 h-8"><circle cx="32" cy="18" r="10" stroke="currentColor" strokeWidth="2.5"/><path d="M16 50c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/><path d="M44 30l4-4m0 0l4-4m-4 4l4 4m-4-4l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
    ),
    href: '/child-care',
    color: 'text-[#3CB371] bg-[#3CB371]/10',
  },
  {
    title: 'Vaccination',
    description: 'Complete immunization programs for newborns, infants, children, and adults following national schedules.',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-8 h-8"><path d="M40 12l12 12-4 4-12-12 4-4z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M36 16l-20 20 4 4 4-4 8 8 4-4-4-4 4-4 4 4 4-4-8-8 4-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 52l10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
    ),
    href: '/child-care',
    color: 'text-[#0A3D62] bg-[#0A3D62]/10',
  },
  {
    title: 'Growth Monitoring',
    description: "Regular tracking of your child's physical and developmental growth milestones for early detection.",
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-8 h-8"><path d="M8 48l12-16 12 8 16-24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M48 24h8v8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ),
    href: '/child-care',
    color: 'text-[#0F9FA8] bg-[#0F9FA8]/10',
  },
  {
    title: 'Physiotherapy',
    description: 'Expert physiotherapy and rehabilitation services for post-surgery recovery and chronic pain management.',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-8 h-8"><circle cx="32" cy="12" r="6" stroke="currentColor" strokeWidth="2.5"/><path d="M32 18v16M24 26h16M32 34l-8 16M32 34l8 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
    ),
    href: '/orthopaedic',
    color: 'text-[#3CB371] bg-[#3CB371]/10',
  },
];

export default function ServicesSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="text-[#0F9FA8] text-sm font-semibold tracking-widest uppercase">What We Offer</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold text-[#0A3D62] font-heading">
            Comprehensive Medical Services
          </h2>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            From orthopaedic surgeries to Paediatric wellness checks, we provide a full spectrum of medical care for your entire family.
          </p>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => (
            <div
              key={service.title}
              className="group bg-white border border-gray-100 rounded-2xl p-6 shadow-card card-hover"
            >
              <div className={`w-14 h-14 rounded-2xl ${service.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                {service.icon}
              </div>
              <h3 className="text-base font-bold text-[#0A3D62] font-heading mb-2">{service.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">{service.description}</p>
              <Link
                to={service.href}
                className="flex items-center gap-1 text-[#0F9FA8] text-sm font-semibold hover:gap-2 transition-all duration-200"
              >
                Learn More <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

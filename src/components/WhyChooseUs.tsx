import { Shield, Heart, Clock, Users, Baby, Activity } from 'lucide-react';

const stats = [
  { value: '5000+', label: 'Patients Treated', icon: Users },
  { value: '4.9★', label: 'Patient Rating', icon: Heart },
  { value: '24/7', label: 'Emergency Support', icon: Clock },
  { value: '100%', label: 'Satisfaction', icon: Shield },
];

const reasons = [
  {
    icon: Shield,
    title: 'Experienced Specialists',
    description: 'Board-certified orthopaedic surgeon and paediatrician with years of specialized training and clinical excellence.',
    color: 'bg-[#0F9FA8]',
  },
  {
    icon: Heart,
    title: 'Patient-First Philosophy',
    description: 'Every decision centers around patient well-being. We listen, understand, and personalize every treatment plan.',
    color: 'bg-[#0A3D62]',
  },
  {
    icon: Baby,
    title: 'Child-Friendly Environment',
    description: 'Our clinic is designed to make children feel safe and comfortable, reducing anxiety during consultations.',
    color: 'bg-[#3CB371]',
  },
  {
    icon: Activity,
    title: 'Advanced Treatments',
    description: 'We use the latest medical technologies and evidence-based treatments for the best possible outcomes.',
    color: 'bg-[#0F9FA8]',
  },
  {
    icon: Users,
    title: 'Family-Centered Care',
    description: 'We treat the whole family — from newborns to seniors — under one roof, building long-term relationships.',
    color: 'bg-[#0A3D62]',
  },
  {
    icon: Clock,
    title: 'Flexible Timings',
    description: 'Morning and evening OPD hours to fit your busy schedule. Emergency support available when needed.',
    color: 'bg-[#3CB371]',
  },
];

export default function WhyChooseUs() {
  return (
    <section className="py-20 bg-[#F5F7FA]">
      <div className="max-w-7xl mx-auto px-4">
        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {stats.map(({ value, label, icon: Icon }) => (
            <div
              key={label}
              className="bg-white rounded-2xl p-6 text-center shadow-card card-hover"
            >
              <div className="w-12 h-12 rounded-xl bg-[#0F9FA8]/10 flex items-center justify-center mx-auto mb-3">
                <Icon size={22} className="text-[#0F9FA8]" />
              </div>
              <p className="text-3xl font-bold text-[#0A3D62] font-heading">{value}</p>
              <p className="text-gray-500 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-[#0F9FA8] text-sm font-semibold tracking-widest uppercase">Why Choose ARVI</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold text-[#0A3D62] font-heading">
            The ARVI Difference
          </h2>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            We combine clinical expertise with genuine compassion to create healthcare experiences that make real differences in people's lives.
          </p>
        </div>

        {/* Reasons grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reasons.map((r) => (
            <div
              key={r.title}
              className="bg-white rounded-2xl p-6 shadow-card card-hover group"
            >
              <div className={`w-12 h-12 rounded-xl ${r.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <r.icon size={22} className="text-white" />
              </div>
              <h3 className="text-base font-bold text-[#0A3D62] font-heading mb-2">{r.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{r.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

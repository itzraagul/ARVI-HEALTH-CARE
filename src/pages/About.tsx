import { Link } from 'react-router-dom';
import { CheckCircle, Heart, Shield, Users, Award } from 'lucide-react';

export default function About() {
  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-[#e8f8f9] to-[#f0f9ff]">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <span className="text-[#0F9FA8] text-sm font-semibold tracking-widest uppercase">Our Story</span>
          <h1 className="mt-3 text-4xl md:text-5xl font-bold text-[#0A3D62] font-heading">About ARVI Ortho & Child Care</h1>
          <p className="mt-5 text-gray-600 text-lg max-w-3xl mx-auto leading-relaxed">
            A premier multi-specialty clinic in Porur, Chennai, dedicated to providing exceptional orthopaedic and Paediatric healthcare for your entire family.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div className="space-y-6">
              <span className="text-[#0F9FA8] text-sm font-semibold tracking-widest uppercase">Our Mission</span>
              <h2 className="text-3xl font-bold text-[#0A3D62] font-heading">
                Healing with Expertise & Compassion
              </h2>
              <p className="text-gray-600 leading-relaxed">
                At ARVI Ortho and Child Care, our mission is to provide world-class medical care that combines clinical excellence with genuine human compassion. We believe every patient deserves personalized attention and the highest standard of treatment.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Founded by two passionate specialists who share a vision of making quality orthopaedic and Paediatric care accessible to families in Porur and across Chennai, ARVI Clinic has grown to become a trusted name in healthcare.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Heart, label: 'Patient-First Care' },
                  { icon: Shield, label: 'Clinical Excellence' },
                  { icon: Users, label: 'Family Healthcare' },
                  { icon: Award, label: 'Expert Specialists' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-3 p-4 bg-[#F5F7FA] rounded-xl">
                    <div className="w-10 h-10 rounded-xl bg-[#0F9FA8]/10 flex items-center justify-center">
                      <Icon size={18} className="text-[#0F9FA8]" />
                    </div>
                    <span className="text-sm font-semibold text-[#0A3D62]">{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <img src="/images/Logo-banner.png" alt="About ARVI Clinic" className="rounded-3xl shadow-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-[#F5F7FA]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-[#0F9FA8] text-sm font-semibold tracking-widest uppercase">Our Values</span>
            <h2 className="mt-3 text-3xl font-bold text-[#0A3D62] font-heading">What Drives Us Every Day</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Compassion', desc: 'We treat every patient with empathy, kindness, and respect, understanding that illness affects the whole family.' },
              { title: 'Excellence', desc: 'We continuously strive for the highest standards in medical practice, staying updated with the latest treatments.' },
              { title: 'Integrity', desc: 'We maintain complete transparency and honesty in all our interactions with patients and their families.' },
              { title: 'Innovation', desc: 'We embrace modern medical technologies and evidence-based approaches to deliver the best outcomes.' },
              { title: 'Accessibility', desc: 'We believe quality healthcare should be accessible to all families, with flexible timings and fair pricing.' },
              { title: 'Community', desc: 'We are committed to improving the overall health of our community through education and preventive care.' },
            ].map((v) => (
              <div key={v.title} className="bg-white rounded-2xl p-6 shadow-card card-hover">
                <div className="w-10 h-10 rounded-xl bg-[#0F9FA8] flex items-center justify-center mb-4">
                  <CheckCircle size={20} className="text-white" />
                </div>
                <h3 className="text-base font-bold text-[#0A3D62] font-heading mb-2">{v.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#0A3D62]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white font-heading mb-4">Experience the ARVI Difference</h2>
          <p className="text-blue-200 mb-8">Book your appointment and let us take care of your family's health needs.</p>
          <Link to="/appointment" className="btn-primary text-base px-8 py-4 mx-auto">
            Book Appointment
          </Link>
        </div>
      </section>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Phone, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';

type DoctorProfile = {
  id: string; full_name: string; specialization: string; role: string;
  doctor_key: string; specialties: string[]; profile_picture: string | null;
  badge_label: string;
};

const ROLE_COLORS: Record<string, string> = {
  doctor_aravind: 'from-[#0A3D62] to-[#0F9FA8]',
  doctor_vishali:  'from-[#3CB371] to-[#0F9FA8]',
  physiotherapist: 'from-[#FF8C42] to-[#FFB84D]',
  doctor:          'from-[#6366F1] to-[#8B5CF6]',
  technician:      'from-[#0891B2] to-[#06B6D4]',
};

const ROLE_BADGE_COLOR: Record<string, string> = {
  doctor_aravind: 'text-[#0F9FA8]',
  doctor_vishali:  'text-[#3CB371]',
  physiotherapist: 'text-[#FF8C42]',
  doctor:          'text-[#6366F1]',
  technician:      'text-[#0891B2]',
};

// Fallback images per role
const FALLBACK_IMAGE: Record<string, string> = {
  doctor_aravind: '/images/Aravind.PNG',
  doctor_vishali:  '/images/vishali.PNG',
  physiotherapist: '/images/Clinic_Pictures_(8).jpg',
  doctor:          '/images/Aravind.PNG',
  technician:      '/images/Clinic_Pictures_(8).jpg',
};

export default function DoctorsSection() {
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      const { data } = await supabase
        .from('admin_users')
        .select('id, full_name, specialization, role, doctor_key, specialties, profile_picture, badge_label')
        .eq('show_in_doctors', true)
        .eq('is_active', true)
        .order('created_at', { ascending: true });
      setDoctors(data || []);
      setLoading(false);
    };
    fetchDoctors();
  }, []);

  if (loading) return (
    <section className="py-20 bg-[#F5F7FA] flex justify-center">
      <div className="w-10 h-10 border-2 border-[#0F9FA8]/30 border-t-[#0F9FA8] rounded-full animate-spin"/>
    </section>
  );

  return (
    <section className="py-20 bg-[#F5F7FA]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-14">
          <span className="text-[#0F9FA8] text-sm font-semibold tracking-widest uppercase">Meet Our Specialists</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold text-[#0A3D62] font-heading">Expert Doctors, Compassionate Care</h2>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">Our highly qualified specialists bring years of expertise combined with genuine compassion.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {doctors.map(doc => {
            const color     = ROLE_COLORS[doc.role]      || ROLE_COLORS.doctor;
            const badgeClr  = ROLE_BADGE_COLOR[doc.role] || ROLE_BADGE_COLOR.doctor;
            const imgSrc    = doc.profile_picture || FALLBACK_IMAGE[doc.role] || '/images/Aravind.PNG';
            const badge     = doc.badge_label || 'Specialist';
            const specs     = doc.specialties || [];

            return (
              <div key={doc.id} className="bg-white rounded-3xl overflow-hidden shadow-card card-hover group">
                <div className={`relative h-72 bg-gradient-to-br ${color} overflow-hidden`}>
                  <img src={imgSrc} alt={doc.full_name}
                    className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A3D62]/70 via-transparent to-transparent"/>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm text-xs font-semibold ${badgeClr}`}>
                      <Star size={12} fill="currentColor"/>{badge}
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-[#0A3D62] font-heading">{doc.full_name}</h3>
                  <p className={`text-sm font-semibold mt-0.5 ${badgeClr}`}>{doc.specialization}</p>
                  {specs.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Specialties</p>
                      <div className="flex flex-wrap gap-2">
                        {specs.map(s => <span key={s} className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">{s}</span>)}
                      </div>
                    </div>
                  )}
                  <div className="mt-5 flex gap-3">
                    <Link to="/appointment" className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#0A3D62] text-white rounded-xl text-sm font-semibold hover:bg-[#0F9FA8] transition-colors">
                      <Calendar size={14}/> Book Appointment
                    </Link>
                    <a href="tel:+919677080778" className="flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-[#0F9FA8] text-[#0F9FA8] rounded-xl text-sm font-semibold hover:bg-[#0F9FA8] hover:text-white transition-colors">
                      <Phone size={14}/> Call
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

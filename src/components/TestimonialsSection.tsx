import { useEffect, useState } from 'react';
import { Star, Quote, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Testimonial = {
  id?: string;
  patient_name: string;
  rating: number;
  review: string;
  doctor?: string;
  review_date?: string;
  source?: 'manual' | 'google';
};

const fallbackTestimonials: Testimonial[] = [
  { patient_name: 'Rajesh Kumar',    rating: 5, review: 'Dr. Aravindasamy treated my knee injury with exceptional skill. I am back to walking pain-free within weeks. Highly recommended!', doctor: 'Dr. Aravindasamy' },
  { patient_name: 'Priya Suresh',    rating: 5, review: 'Dr. Vishali is amazing with children. My son was scared of doctors but she made him feel so comfortable. Best paediatrician in Porur!', doctor: 'Dr. Vishali' },
  { patient_name: 'Meenakshi Rajan', rating: 5, review: 'Excellent clinic with modern facilities. The staff is caring and the doctors are highly knowledgeable. Very satisfied with the treatment.', doctor: 'Dr. Aravindasamy' },
  { patient_name: 'Arjun Nair',      rating: 5, review: 'My daughter received vaccination here. Dr. Vishali explained everything clearly. Very professional and child-friendly environment.', doctor: 'Dr. Vishali' },
  { patient_name: 'Sundar Krishnan', rating: 5, review: "After years of back pain, Dr. Aravindasamy's treatment has given me a new life. The physiotherapy support is also excellent.", doctor: 'Dr. Aravindasamy' },
];

// Static Google reviews — update these with real ones when Google Places API is configured
const googleReviews: Testimonial[] = [
  { patient_name: 'Karthik S',  rating: 5, review: 'Best orthopaedic clinic in Porur! Dr. Aravindasamy is very experienced and explains everything clearly. Minimal waiting time and helpful staff.', doctor: 'Dr. Aravindasamy M', review_date: '3 weeks ago',   source: 'google' },
  { patient_name: 'Lavanya R',  rating: 5, review: 'Took my 2-year-old to Dr. Vishali for vaccination. She is so gentle with kids! The clinic is very clean and the staff made my baby comfortable.', doctor: 'Dr. Vishali G',       review_date: '1 month ago',  source: 'google' },
  { patient_name: 'Murugan P',  rating: 5, review: 'Excellent physiotherapy services. Recovered from my sports injury faster than expected. The team is highly professional and encouraging.',        doctor: 'Physiotherapy Dept',    review_date: '2 months ago', source: 'google' },
  { patient_name: 'Divya T',    rating: 5, review: 'Dr. Vishali is an amazing Paediatrician. Very patient with children and parents. My son actually looks forward to his check-ups now!',            doctor: 'Dr. Vishali G',       review_date: '2 months ago', source: 'google' },
  { patient_name: 'Selvam K',   rating: 5, review: "Came with chronic knee pain. After Dr. Aravindasamy's treatment I am back to my daily activities. Very satisfied with the complete care.",       doctor: 'Dr. Aravindasamy M', review_date: '3 months ago', source: 'google' },
  { patient_name: 'Nithya M',   rating: 5, review: 'Very clean clinic with modern equipment. The staff is courteous and the appointment process is smooth. Highly recommended for families.',        doctor: 'General',             review_date: '4 months ago', source: 'google' },
];

function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={size} fill={i <= rating ? '#f59e0b' : 'none'} className={i <= rating ? 'text-amber-400' : 'text-gray-300'} />
      ))}
    </div>
  );
}

function GoogleLogo({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" style={{ width: size, height: size }} fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(fallbackTestimonials);
  const [current, setCurrent] = useState(0);
  const [tab, setTab] = useState<'patients' | 'google'>('patients');

  useEffect(() => {
    supabase.from('testimonials').select('*').eq('is_published', true).order('created_at', { ascending: false })
      .then(({ data }) => { if (data?.length) setTestimonials(data); });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrent(c => (c + 1) % testimonials.length), 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  return (
    <section className="py-20 bg-gradient-to-br from-[#0A3D62] to-[#0F9FA8]">
      <div className="max-w-7xl mx-auto px-4">

        <div className="text-center mb-10">
          <span className="text-[#3CB371] text-sm font-semibold tracking-widest uppercase">Patient Stories</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold text-white font-heading">What Our Patients Say</h2>
          <p className="mt-4 text-blue-200 max-w-xl mx-auto">Real stories from real patients who trusted us with their health.</p>
        </div>

        {/* Tab switcher */}
        <div className="flex justify-center mb-10">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-1 flex gap-1">
            <button onClick={() => setTab('patients')}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'patients' ? 'bg-white text-[#0A3D62]' : 'text-white/80 hover:text-white'}`}>
              Patient Reviews
            </button>
            <button onClick={() => setTab('google')}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${tab === 'google' ? 'bg-white text-[#0A3D62]' : 'text-white/80 hover:text-white'}`}>
              <GoogleLogo size={14} /> Google Reviews
            </button>
          </div>
        </div>

        {/* Patient Reviews Tab */}
        {tab === 'patients' && (
          <>
            <div className="max-w-3xl mx-auto mb-10">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 text-center">
                <Quote size={40} className="text-[#3CB371]/50 mx-auto mb-4" />
                <p className="text-white text-lg leading-relaxed mb-6 italic">"{testimonials[current]?.review}"</p>
                <div className="flex justify-center mb-3"><Stars rating={testimonials[current]?.rating || 5} size={20} /></div>
                <p className="font-bold text-white text-base">{testimonials[current]?.patient_name}</p>
                <p className="text-blue-200 text-sm">{testimonials[current]?.doctor}</p>
              </div>
            </div>
            <div className="flex justify-center gap-2 mb-10">
              {testimonials.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)}
                  className={`rounded-full transition-all duration-300 ${i === current ? 'w-8 h-2.5 bg-[#3CB371]' : 'w-2.5 h-2.5 bg-white/30'}`} />
              ))}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {testimonials.slice(0, 6).map((t, i) => (
                <div key={i} onClick={() => setCurrent(i)}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 hover:bg-white/20 transition-colors cursor-pointer">
                  <div className="mb-3"><Stars rating={t.rating} size={13} /></div>
                  <p className="text-blue-100 text-sm leading-relaxed mb-4 line-clamp-3">"{t.review}"</p>
                  <p className="text-white font-semibold text-sm">{t.patient_name}</p>
                  <p className="text-blue-300 text-xs">{t.doctor}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Google Reviews Tab */}
        {tab === 'google' && (
          <>
            <div className="max-w-xs mx-auto bg-white rounded-2xl p-5 text-center mb-10 shadow-xl">
              <div className="flex items-center justify-center gap-2 mb-2">
                <GoogleLogo size={18} />
                <span className="font-bold text-gray-800 text-sm">Google Reviews</span>
              </div>
              <div className="text-4xl font-bold text-[#0A3D62] mb-1">5.0</div>
              <div className="flex justify-center"><Stars rating={5} size={20} /></div>
              <p className="text-gray-400 text-xs mt-2">Based on Google patient reviews</p>
              <a href="https://www.google.com/maps/search/ARVI+Ortho+Child+Care+Porur+Chennai"
                target="_blank" rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-xs text-[#0F9FA8] font-semibold hover:underline">
                Write a Review <ExternalLink size={11} />
              </a>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {googleReviews.map((r, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0A3D62] to-[#0F9FA8] flex items-center justify-center text-white font-bold text-sm">
                        {r.patient_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-[#0A3D62] text-sm">{r.patient_name}</p>
                        <p className="text-gray-400 text-xs">{r.review_date}</p>
                      </div>
                    </div>
                    <GoogleLogo size={16} />
                  </div>
                  <div className="mb-2"><Stars rating={r.rating} size={13} /></div>
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-4">"{r.review}"</p>
                  <p className="text-[#0F9FA8] text-xs mt-2 font-medium">{r.doctor}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <a href="https://www.google.com/maps/search/ARVI+Ortho+Child+Care+Porur+Chennai"
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#0A3D62] rounded-xl font-semibold text-sm hover:shadow-lg transition-all">
                <GoogleLogo size={16} /> View All Google Reviews <ExternalLink size={14} />
              </a>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

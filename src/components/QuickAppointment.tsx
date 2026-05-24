import { useState } from 'react';
import { Calendar, Clock, User, Stethoscope, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const DOCTORS = [
  { value: 'dr-aravindasamy', label: 'Dr. Aravindasamy M (MS Ortho)' },
  { value: 'dr-vishali', label: 'Dr. Vishali G (MD Paediatrics)' },
  { value: 'physiotherapist', label: 'Physiotherapist Expert' },
];

const TIME_SLOTS = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
  '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM',
];

export default function QuickAppointment() {
  const [form, setForm] = useState({
    patient_name: '',
    patient_phone: '',
    doctor: '',
    appointment_date: '',
    appointment_time: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patient_name || !form.patient_phone || !form.doctor || !form.appointment_date || !form.appointment_time) return;
    setStatus('loading');
    const { error } = await supabase.from('appointments').insert([form]);
    if (error) {
      setStatus('error');
    } else {
      setStatus('success');
      setForm({ patient_name: '', patient_phone: '', doctor: '', appointment_date: '', appointment_time: '' });
    }
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-gradient-to-br from-[#0A3D62] to-[#0F9FA8] rounded-3xl p-8 md:p-12 shadow-2xl">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            {/* Left */}
            <div className="text-white space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-sm font-medium">
                <Calendar size={14} />
                Quick Appointment Booking
              </div>
              <h2 className="text-3xl md:text-4xl font-bold font-heading leading-tight">
                Book Your <span className="text-[#3CB371]">Appointment</span><br />In Minutes
              </h2>
              <p className="text-blue-200 text-base leading-relaxed">
                Submit your appointment request online. Our team will confirm your slot very shortly. Payment can be made at clinic or online after confirmation.
              </p>
              <div className="space-y-3 pt-2">
                {[
                  { step: '1', text: 'Fill the form & select your preferred slot' },
                  { step: '2', text: 'Admin reviews & confirms your appointment' },
                  { step: '3', text: 'Receive WhatsApp/SMS confirmation' },
                  { step: '4', text: 'Visit clinic or pay online advance' },
                ].map(({ step, text }) => (
                  <div key={step} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#3CB371] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {step}
                    </div>
                    <p className="text-sm text-blue-100">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <div className="glass rounded-2xl p-6 shadow-glass">
              {status === 'success' ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} className="text-[#3CB371]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#0A3D62] mb-2">Request Submitted!</h3>
                  <p className="text-gray-600 text-sm mb-5">Our team will confirm your appointment very shortly via WhatsApp.</p>
                  <button
                    onClick={() => setStatus('idle')}
                    className="btn-primary mx-auto"
                  >
                    Book Another
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h3 className="text-lg font-bold text-[#0A3D62] font-heading mb-2">Request Appointment</h3>

                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Your Full Name *"
                      value={form.patient_name}
                      onChange={(e) => setForm({ ...form, patient_name: e.target.value })}
                      required
                      className="input-field pl-10"
                    />
                  </div>

                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    <input
                      type="tel"
                      placeholder="Mobile Number *"
                      value={form.patient_phone}
                      onChange={(e) => setForm({ ...form, patient_phone: e.target.value })}
                      required
                      className="input-field pl-10"
                    />
                  </div>

                  <div className="relative">
                    <Stethoscope size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                      value={form.doctor}
                      onChange={(e) => setForm({ ...form, doctor: e.target.value })}
                      required
                      className="input-field pl-10 appearance-none"
                    >
                      <option value="">Select Doctor *</option>
                      {DOCTORS.map((d) => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      min={today}
                      value={form.appointment_date}
                      onChange={(e) => setForm({ ...form, appointment_date: e.target.value })}
                      required
                      className="input-field pl-10"
                    />
                  </div>

                  <div className="relative">
                    <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                      value={form.appointment_time}
                      onChange={(e) => setForm({ ...form, appointment_time: e.target.value })}
                      required
                      className="input-field pl-10 appearance-none"
                    >
                      <option value="">Select Time Slot *</option>
                      {TIME_SLOTS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  {status === 'error' && (
                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-xl">
                      <AlertCircle size={16} />
                      Something went wrong. Please try again.
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full py-3.5 bg-[#0A3D62] text-white rounded-xl font-semibold text-sm hover:bg-[#0F9FA8] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {status === 'loading' ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
                    ) : (
                      <><Calendar size={16} /> Request Appointment</>
                    )}
                  </button>

                  <p className="text-xs text-gray-500 text-center">
                    Our team will confirm your slot very shortly
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

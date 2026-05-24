import { useState } from 'react';
import { Calendar, Clock, User, Stethoscope, FileText, Phone, CheckCircle, AlertCircle, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateTimeSlots, isSlotPast } from '../lib/timeSlots';
import { toast } from '../lib/toast';

const DOCTORS = [
  { value: 'dr-aravindasamy', label: 'Dr. Aravindasamy M', spec: 'MS Orthopaedics', dept: 'Orthopaedic Care' },
  { value: 'dr-vishali', label: 'Dr. Vishali G', spec: 'MD Paediatrics', dept: 'Child Care' },
  { value: 'physiotherapist', label: 'Physiotherapist Expert', spec: 'BPT', dept: 'Physiotherapy Services' },
];

const TIME_SLOTS = generateTimeSlots();

export default function Appointment() {
  const [form, setForm] = useState({
    patient_name: '', patient_phone: '', patient_email: '',
    doctor: '', appointment_date: '', appointment_time: '', reason: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const today = new Date().toISOString().split('T')[0];

  const handleChange = (field: string, value: string) => {
    if (field === 'appointment_date') {
      setForm(prev => ({ ...prev, appointment_date: value, appointment_time: '' }));
    } else {
      setForm(prev => ({ ...prev, [field]: value }));
    }
  };

  const validateForm = (): string | null => {
    if (!form.patient_name.trim()) return 'Patient name is required';
    if (!form.patient_phone.trim()) return 'Phone number is required';
    if (!/^[\d\s\+\-\(\)]{7,15}$/.test(form.patient_phone.replace(/\s/g, ''))) return 'Enter a valid phone number';
    if (form.patient_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.patient_email)) return 'Enter a valid email address';
    if (!form.doctor) return 'Please select a doctor';
    if (!form.appointment_date) return 'Please select a date';
    if (!form.appointment_time) return 'Please select a time slot';
    if (isSlotPast(form.appointment_date, form.appointment_time)) return 'Selected time has already passed';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateForm();
    if (err) { setErrorMsg(err); return; }
    setErrorMsg('');
    setStatus('loading');

    const { error } = await supabase.from('appointments').insert([{
      patient_name: form.patient_name.trim(),
      patient_phone: form.patient_phone.trim(),
      patient_email: form.patient_email.trim() || null,
      doctor: form.doctor,
      appointment_date: form.appointment_date,
      appointment_time: form.appointment_time,
      reason: form.reason.trim() || null,
      status: 'pending',
      payment_status: 'unpaid',
    }]);

    if (error) {
      setStatus('error');
      setErrorMsg('Failed to submit. Please try again or call us directly.');
      toast.error('Appointment submission failed');
    } else {
      setStatus('success');
      toast.success('Appointment request submitted successfully!');
    }
  };

  const resetForm = () => {
    setStatus('idle'); setErrorMsg('');
    setForm({ patient_name: '', patient_phone: '', patient_email: '', doctor: '', appointment_date: '', appointment_time: '', reason: '' });
  };

  if (status === 'success') {
    const selectedDoctor = DOCTORS.find(d => d.value === form.doctor);
    return (
      <div className="pt-20 min-h-screen bg-[#F5F7FA] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-12 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-[#3CB371]" />
          </div>
          <h2 className="text-2xl font-bold text-[#0A3D62] font-heading mb-3">Appointment Requested!</h2>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Your appointment has been submitted. Our team will confirm your slot and contact you shortly.
          </p>
          <div className="bg-[#F5F7FA] rounded-2xl p-4 mb-6 text-sm text-left space-y-2">
            <p className="text-gray-500"><span className="font-semibold text-[#0A3D62]">Patient:</span> {form.patient_name}</p>
            <p className="text-gray-500"><span className="font-semibold text-[#0A3D62]">Doctor:</span> {selectedDoctor?.label}</p>
            <p className="text-gray-500"><span className="font-semibold text-[#0A3D62]">Date:</span> {new Date(form.appointment_date + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="text-gray-500"><span className="font-semibold text-[#0A3D62]">Time:</span> {form.appointment_time}</p>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Our team will contact you on <strong>{form.patient_phone}</strong> to confirm.
          </p>
          <div className="flex gap-3">
            <button onClick={resetForm} className="btn-primary flex-1 justify-center">Book Another</button>
            <a href="tel:+919677080778" className="btn-secondary flex-1 justify-center"><Phone size={14} /> Call Us</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20">
      <section className="py-16 bg-gradient-to-br from-[#0A3D62] to-[#0F9FA8]">
        <div className="max-w-7xl mx-auto px-4 text-center text-white">
          <span className="text-[#3CB371] text-sm font-semibold tracking-widest uppercase">Online Booking</span>
          <h1 className="mt-3 text-4xl md:text-5xl font-bold font-heading">Book Your Appointment</h1>
          <p className="mt-4 text-blue-100 text-lg max-w-2xl mx-auto">
            Request an appointment online. Our team will confirm your slot and contact you shortly.
          </p>
        </div>
      </section>

      <section className="py-16 bg-[#F5F7FA]">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { step: '1', label: 'Fill the Form', icon: FileText },
              { step: '2', label: 'We Confirm', icon: CheckCircle },
              { step: '3', label: 'Get Notified', icon: Phone },
              { step: '4', label: 'Visit Clinic', icon: Stethoscope },
            ].map(({ step, label, icon: Icon }) => (
              <div key={step} className="bg-white rounded-2xl p-5 text-center shadow-card">
                <div className="w-10 h-10 rounded-xl bg-[#0F9FA8] flex items-center justify-center mx-auto mb-3">
                  <Icon size={18} className="text-white" />
                </div>
                <div className="text-xs text-gray-400 mb-1">Step {step}</div>
                <p className="text-sm font-semibold text-[#0A3D62]">{label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-3xl shadow-card p-8 md:p-10">
            <h2 className="text-2xl font-bold text-[#0A3D62] font-heading mb-7">Patient Information</h2>
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <User size={14} className="inline mr-1.5" />Patient Full Name *
                  </label>
                  <input type="text" value={form.patient_name} onChange={e => handleChange('patient_name', e.target.value)}
                    required placeholder="Enter patient's full name" className="input-field" maxLength={100} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Phone size={14} className="inline mr-1.5" />Mobile Number *
                  </label>
                  <input type="tel" value={form.patient_phone} onChange={e => handleChange('patient_phone', e.target.value)}
                    required placeholder="+91 98765 43210" className="input-field" maxLength={15} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Mail size={14} className="inline mr-1.5" />Email Address (Optional)
                </label>
                <input type="email" value={form.patient_email} onChange={e => handleChange('patient_email', e.target.value)}
                  placeholder="your@email.com" className="input-field" maxLength={150} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Stethoscope size={14} className="inline mr-1.5" />Select Doctor *
                </label>
                <div className="grid md:grid-cols-3 gap-4">
                  {DOCTORS.map(d => (
                    <label key={d.value} className={`relative flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                      form.doctor === d.value ? 'border-[#0F9FA8] bg-[#0F9FA8]/5' : 'border-gray-200 hover:border-[#0F9FA8]/50'
                    }`}>
                      <input type="radio" name="doctor" value={d.value} checked={form.doctor === d.value}
                        onChange={e => handleChange('doctor', e.target.value)} className="mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-[#0A3D62]">{d.label}</p>
                        <p className="text-xs text-[#0F9FA8]">{d.spec}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{d.dept}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Calendar size={14} className="inline mr-1.5" />Preferred Date *
                  </label>
                  <input type="date" min={today} value={form.appointment_date}
                    onChange={e => handleChange('appointment_date', e.target.value)} required className="input-field" />
                  <p className="text-xs text-[#0F9FA8] mt-1.5">✓ All days including Sunday available</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Clock size={14} className="inline mr-1.5" />Preferred Time *
                  </label>
                  <div className="space-y-3">
                    {[
                      { label: 'Morning (9:00 AM – 11:30 AM)', slots: TIME_SLOTS.morning },
                      { label: 'Afternoon / Evening (12:00 PM – 6:00 PM)', slots: TIME_SLOTS.afternoon },
                      { label: 'Night (6:30 PM – 11:30 PM)', slots: TIME_SLOTS.night },
                    ].map(({ label, slots }) => (
                      <div key={label}>
                        <p className="text-xs font-medium text-gray-400 mb-1.5">{label}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {slots.map(t => {
                            const past = isSlotPast(form.appointment_date, t);
                            return (
                              <button key={t} type="button" disabled={past}
                                onClick={() => !past && handleChange('appointment_time', t)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                  form.appointment_time === t
                                    ? 'bg-[#0F9FA8] text-white shadow-sm'
                                    : past
                                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                    : 'bg-gray-100 text-gray-600 hover:bg-[#0F9FA8]/10 hover:text-[#0F9FA8]'
                                }`}
                              >{t}</button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <FileText size={14} className="inline mr-1.5" />Reason for Visit (Optional)
                </label>
                <textarea value={form.reason} onChange={e => handleChange('reason', e.target.value)}
                  rows={3} placeholder="Briefly describe your symptoms or reason for consultation..."
                  className="input-field resize-none" maxLength={500} />
              </div>

              {(errorMsg || status === 'error') && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-xl">
                  <AlertCircle size={16} />{errorMsg || 'Failed to submit. Please try again.'}
                </div>
              )}

              <button type="submit" disabled={status === 'loading'}
                className="w-full btn-primary justify-center py-4 text-base disabled:opacity-60 disabled:cursor-not-allowed">
                {status === 'loading'
                  ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
                  : <><Calendar size={18} /> Request Appointment</>
                }
              </button>
              <p className="text-xs text-gray-400 text-center">
                By submitting, you agree to our privacy policy. Your information is kept strictly confidential.
              </p>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

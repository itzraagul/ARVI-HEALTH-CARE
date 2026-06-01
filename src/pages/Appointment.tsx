import { useState, useEffect } from 'react';
import { Calendar, Clock, User, Stethoscope, FileText, Phone, CheckCircle, AlertCircle, Mail, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateTimeSlots, isSlotPast, isSunday } from '../lib/timeSlots';
import { toast } from '../lib/toast';

// DOCTORS is now fetched dynamically from DB inside the component
type DoctorOption = { value: string; label: string; spec: string; dept: string; specialist: string; };

// TIME_SLOTS are generated dynamically per selected date in the component
const CLINIC_NAME = 'ARVI Ortho & Child Care';

// New schema: leave_management uses 'specialist' field
type LeaveRecord = {
  id: string;
  specialist: string;   // 'doctor_aravind' | 'doctor_vishali' | 'physiotherapist' | 'clinic_holiday'
  start_date: string;
  end_date: string;
  full_day: boolean;
  half_day_period?: string;
  time_from?: string;
  time_to?: string;
  status: string;
};

export default function Appointment() {
  const [form, setForm] = useState({
    patient_name: '', patient_phone: '', patient_email: '',
    doctor: '', appointment_date: '', appointment_time: '', reason: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [leaveBlocked, setLeaveBlocked] = useState<{ blocked: boolean; message: string }>({ blocked: false, message: '' });
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchData = async () => {
      // Fetch active doctors/technicians from DB
      const { data: dbDoctors } = await supabase
        .from('admin_users')
        .select('full_name, role, username, specialization, doctor_key')
        .in('role', ['doctor_aravind','doctor_vishali','physiotherapist','doctor','technician'])
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      const doctorList: DoctorOption[] = (dbDoctors || []).map(d => ({
        value:      d.doctor_key || d.username,
        label:      d.full_name,
        spec:       d.specialization || '',
        dept:       d.role === 'doctor' || d.role === 'doctor_aravind' || d.role === 'doctor_vishali' ? 'Medical Consultation' : 'Specialist Services',
        specialist: d.role,
      }));
      setDoctors(doctorList);

      // Fetch active leaves
      const { data: leaveData, error } = await supabase
        .from('leave_management')
        .select('*')
        .eq('status', 'active')
        .gte('end_date', today);
      if (!error) setLeaves(leaveData || []);
    };
    fetchData();
  }, []);

  // Re-check whenever doctor or date changes
  useEffect(() => {
    if (!form.doctor || !form.appointment_date) {
      setLeaveBlocked({ blocked: false, message: '' });
      return;
    }
    checkLeaveBlock(form.doctor, form.appointment_date);
  }, [form.doctor, form.appointment_date, leaves]);

  const toMins = (s: string) => {
    const [timePart, period] = s.trim().split(' ');
    const [h, m = 0] = timePart.split(':').map(Number);
    const pm = period?.toUpperCase() === 'PM' && h !== 12;
    const am = period?.toUpperCase() === 'AM' && h === 12;
    return (pm ? h + 12 : am ? 0 : h) * 60 + m;
  };

  // Compute blocked slots for a doctor+date based on leave records
  const getBlockedInfo = (doctorValue: string, date: string) => {
    const docInfo = DOCTORS.find(d => d.value === doctorValue);
    if (!docInfo || !date) return { allDay: false, message: '', blockedTimes: [] as string[] };
    const matchingLeaves = leaves.filter(l => {
      if (l.status !== 'active') return false;
      if (l.start_date > date || l.end_date < date) return false;
      if (l.specialist === 'clinic_holiday') return true;
      return l.specialist === docInfo.specialist;
    });
    if (!matchingLeaves.length) return { allDay: false, message: '', blockedTimes: [] as string[] };

    // Full-day leave (any specialist including clinic_holiday) → all slots blocked
    const fullLeave = matchingLeaves.find(l => l.full_day === true);
    if (fullLeave) {
      return {
        allDay: true,
        blockedTimes: [] as string[],
        message: fullLeave.specialist === 'clinic_holiday'
          ? `${CLINIC_NAME} is closed on this date. Please choose another date.`
          : `${docInfo.label} is on full-day leave. Please choose another date.`,
      };
    }

    // Half-day leave (doctor-specific OR clinic_holiday)
    // Use clinic_holiday record first if present, otherwise the doctor's own leave
    const hl = matchingLeaves.find(l => l.specialist === 'clinic_holiday') || matchingLeaves[0];

    let fromMins: number;
    let toMins2: number;
    if (hl.time_from && hl.time_to) {
      // Specific time range provided
      fromMins = toMins(hl.time_from);
      toMins2  = toMins(hl.time_to);
    } else if (hl.half_day_period === 'first_half') {
      fromMins = 0;        // covers all morning slots from 10 AM
      toMins2  = 13 * 60 + 1; // 1:01 PM — ensures 1:00 PM slot IS blocked
    } else {
      fromMins = 13 * 60; // 1:00 PM onwards
      toMins2  = 24 * 60;
    }

    // Compute which available clinic slots fall in the blocked range
    const slots = generateTimeSlots(date);
    const allSlots = [...slots.morning, ...slots.evening, ...slots.sunday_afternoon];
    const blockedTimes = allSlots.filter(slot => {
      const sm = toMins(slot);
      return sm >= fromMins && sm < toMins2;
    });

    const isClinicHoliday = hl.specialist === 'clinic_holiday';
    const rangeStr = hl.time_from && hl.time_to
      ? `${hl.time_from} – ${hl.time_to}`
      : hl.half_day_period === 'first_half' ? 'morning (10 AM – 1 PM)' : 'evening (5 PM – 10 PM)';

    return {
      allDay: false,
      blockedTimes,
      message: isClinicHoliday
        ? `${CLINIC_NAME} is partially closed — unavailable ${rangeStr} on this date.`
        : `${docInfo.label} is unavailable ${rangeStr} on this date. Please select a different time.`,
    };
  };

  const [blockedSlots, setBlockedSlots] = useState<string[]>([]);

  const checkLeaveBlock = (doctorValue: string, date: string) => {
    const info = getBlockedInfo(doctorValue, date);
    setBlockedSlots(info.blockedTimes);
    if (info.allDay) {
      setLeaveBlocked({ blocked: true, message: info.message });
    } else if (info.blockedTimes.length > 0) {
      setLeaveBlocked({ blocked: false, message: info.message });
    } else {
      setLeaveBlocked({ blocked: false, message: '' });
    }
  };

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
    if (blockedSlots.includes(form.appointment_time)) return 'The selected time slot is unavailable due to doctor\'s leave. Please choose a different time.';
    if (leaveBlocked.blocked) return leaveBlocked.message;
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateForm();
    if (err) { setErrorMsg(err); return; }
    setErrorMsg(''); setStatus('loading');

    // Server-side leave re-check before inserting (prevents race conditions)
    const { data: activeLeaves } = await supabase
      .from('leave_management')
      .select('specialist, start_date, end_date')
      .eq('status', 'active')
      .lte('start_date', form.appointment_date)
      .gte('end_date', form.appointment_date);

    if (activeLeaves?.length) {
      const docInfo = DOCTORS.find(d => d.value === form.doctor);
      const blocked = activeLeaves.some(l =>
        l.specialist === 'clinic_holiday' || l.specialist === docInfo?.specialist
      );
      if (blocked) {
        setStatus('error');
        setErrorMsg('This slot is no longer available due to leave. Please choose another date.');
        return;
      }
    }

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
      toast.error('Submission failed');
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
        <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-12 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6"><CheckCircle size={40} className="text-[#3CB371]" /></div>
          <h2 className="text-2xl font-bold text-[#0A3D62] font-heading mb-3">Appointment Requested!</h2>
          <p className="text-gray-600 mb-4 leading-relaxed">Your appointment has been submitted. Our team will confirm your slot and contact you shortly.</p>
          <div className="bg-[#F5F7FA] rounded-2xl p-4 mb-6 text-sm text-left space-y-2">
            <p className="text-gray-500"><span className="font-semibold text-[#0A3D62]">Patient:</span> {form.patient_name}</p>
            <p className="text-gray-500"><span className="font-semibold text-[#0A3D62]">Doctor:</span> {selectedDoctor?.label}</p>
            <p className="text-gray-500"><span className="font-semibold text-[#0A3D62]">Date:</span> {new Date(form.appointment_date + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="text-gray-500"><span className="font-semibold text-[#0A3D62]">Time:</span> {form.appointment_time}</p>
          </div>
          <p className="text-sm text-gray-500 mb-6">Our team will contact you on <strong>{form.patient_phone}</strong> to confirm.</p>
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
          <p className="mt-4 text-blue-100 text-lg max-w-2xl mx-auto">Request an appointment online. Our team will confirm your slot and contact you shortly.</p>
        </div>
      </section>

      <section className="py-16 bg-[#F5F7FA]">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[{ step: '1', label: 'Fill the Form', icon: FileText }, { step: '2', label: 'We Confirm', icon: CheckCircle }, { step: '3', label: 'Get Notified', icon: Phone }, { step: '4', label: 'Visit Clinic', icon: Stethoscope }].map(({ step, label, icon: Icon }) => (
              <div key={step} className="bg-white rounded-2xl p-5 text-center shadow-card">
                <div className="w-10 h-10 rounded-xl bg-[#0F9FA8] flex items-center justify-center mx-auto mb-3"><Icon size={18} className="text-white" /></div>
                <div className="text-xs text-gray-400 mb-1">Step {step}</div>
                <p className="text-sm font-semibold text-[#0A3D62]">{label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-3xl shadow-card p-6 sm:p-8 md:p-10">
            <h2 className="text-2xl font-bold text-[#0A3D62] font-heading mb-7">Patient Information</h2>
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5"><User size={14} className="inline mr-1.5" />Patient Full Name *</label>
                  <input type="text" value={form.patient_name} onChange={e => handleChange('patient_name', e.target.value)} required placeholder="Enter patient's full name" className="input-field" maxLength={100} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5"><Phone size={14} className="inline mr-1.5" />Mobile Number *</label>
                  <input type="tel" value={form.patient_phone} onChange={e => handleChange('patient_phone', e.target.value)} required placeholder="+91 98765 43210" className="input-field" maxLength={15} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5"><Mail size={14} className="inline mr-1.5" />Email Address (Optional)</label>
                <input type="email" value={form.patient_email} onChange={e => handleChange('patient_email', e.target.value)} placeholder="your@email.com" className="input-field" maxLength={150} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3"><Stethoscope size={14} className="inline mr-1.5" />Select Doctor *</label>
                <div className="grid sm:grid-cols-3 gap-4">
                  {DOCTORS.map(d => (
                    <label key={d.value} className={`relative flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${form.doctor === d.value ? 'border-[#0F9FA8] bg-[#0F9FA8]/5' : 'border-gray-200 hover:border-[#0F9FA8]/50'}`}>
                      <input type="radio" name="doctor" value={d.value} checked={form.doctor === d.value} onChange={e => handleChange('doctor', e.target.value)} className="mt-0.5" />
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5"><Calendar size={14} className="inline mr-1.5" />Preferred Date *</label>
                  <input type="date" min={today} value={form.appointment_date} onChange={e => handleChange('appointment_date', e.target.value)} required className="input-field" />
                  <p className="text-xs text-[#0F9FA8] mt-1.5">All days including Sunday available</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5"><Clock size={14} className="inline mr-1.5" />Preferred Time *</label>

                  {leaveBlocked.blocked && form.appointment_date ? (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                      <XCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-red-600">{leaveBlocked.message}</p>
                    </div>
                  ) : (
                    (() => {
                      const slots = generateTimeSlots(form.appointment_date);
                      const sun = isSunday(form.appointment_date);
                      const groups = sun
                        ? [
                            { label: '10:00 AM – 1:00 PM (Morning)', slots: slots.morning },
                            { label: '1:00 PM – 6:00 PM (Afternoon)', slots: slots.sunday_afternoon },
                          ]
                        : [
                            { label: '10:00 AM – 1:00 PM (Morning)', slots: slots.morning },
                            { label: '5:00 PM – 10:00 PM (Evening)', slots: slots.evening },
                          ];
                      return (
                        <div className="space-y-3">
                          {leaveBlocked.message && (
                            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                              <p className="text-xs text-amber-700">{leaveBlocked.message}</p>
                            </div>
                          )}
                          {groups.map(({ label, slots: groupSlots }) => (
                            groupSlots.length > 0 && (
                              <div key={label}>
                                <p className="text-xs font-medium text-gray-400 mb-1.5">{label}</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {groupSlots.map(t => {
                                    const past    = isSlotPast(form.appointment_date, t);
                                    const onLeave = blockedSlots.includes(t);
                                    const disabled = past || onLeave;
                                    return (
                                      <button key={t} type="button" disabled={disabled}
                                        onClick={() => !disabled && handleChange('appointment_time', t)}
                                        title={onLeave ? 'Doctor unavailable at this time' : undefined}
                                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                          form.appointment_time === t ? 'bg-[#0F9FA8] text-white shadow-sm' :
                                          onLeave ? 'bg-amber-50 text-amber-400 cursor-not-allowed line-through' :
                                          past    ? 'bg-gray-100 text-gray-300 cursor-not-allowed' :
                                          'bg-gray-100 text-gray-600 hover:bg-[#0F9FA8]/10 hover:text-[#0F9FA8]'
                                        }`}>{t}</button>
                                    );
                                  })}
                                </div>
                              </div>
                            )
                          ))}
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5"><FileText size={14} className="inline mr-1.5" />Reason for Visit (Optional)</label>
                <textarea value={form.reason} onChange={e => handleChange('reason', e.target.value)} rows={3} placeholder="Briefly describe your symptoms or reason for consultation..." className="input-field resize-none" maxLength={500} />
              </div>

              {(errorMsg || status === 'error') && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-xl">
                  <AlertCircle size={16} />{errorMsg || 'Failed to submit. Please try again.'}
                </div>
              )}

              <button type="submit" disabled={status === 'loading' || leaveBlocked.blocked}
                className="w-full btn-primary justify-center py-4 text-base disabled:opacity-60 disabled:cursor-not-allowed">
                {status === 'loading'
                  ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
                  : <><Calendar size={18} /> Request Appointment</>
                }
              </button>
              <p className="text-xs text-gray-400 text-center">By submitting, you agree to our privacy policy. Your information is kept strictly confidential.</p>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

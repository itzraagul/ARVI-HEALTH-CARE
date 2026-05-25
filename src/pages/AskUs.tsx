import { useState } from 'react';
import { HelpCircle, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const faqs = [
  {
    q: 'Do I need a referral to book an appointment?',
    a: 'No, you can directly book an appointment with our specialists without any referral. Simply call us or use the online booking form.',
  },
  {
    q: 'What are the consultation timings?',
    a: 'We are open Monday to Saturday from 9:00 AM to 8:00 PM, and Sundays from 10:00 AM to 2:00 PM for OPD consultations.',
  },
  {
    q: 'Does the clinic accept health insurance?',
    a: 'Yes, we accept major health insurance plans. Please contact our reception for a complete list of accepted insurance providers.',
  },
  {
    q: 'Is the clinic child-friendly?',
    a: "Absolutely! Our clinic is specially designed to be welcoming for children. Dr. Vishali's Paediatric section has a child-friendly setup to help kids feel at ease.",
  },
  {
    q: 'Can I get physiotherapy services at home?',
    a: 'Yes, we offer home physiotherapy services for patients who cannot visit the clinic. Please contact us to arrange home sessions.',
  },
  {
    q: 'How do I get my test reports?',
    a: 'Test reports can be collected from the clinic reception. We also send reports via WhatsApp or email upon request.',
  },
  {
    q: 'What should I bring for my first consultation?',
    a: 'Please bring any previous medical records, X-rays, scans, or prescriptions related to your condition. Government ID for patient registration is also required.',
  },
  {
    q: 'Is emergency care available?',
    a: 'We handle orthopaedic emergencies like fractures and injuries during our clinic hours. For life-threatening emergencies, please go to the nearest emergency hospital.',
  },
];

export default function AskUs() {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    const { error } = await supabase.from('contact_messages').insert([{
      ...form,
      subject: 'Ask Us Query',
    }]);
    if (error) setStatus('error');
    else {
      setStatus('success');
      setForm({ name: '', phone: '', email: '', message: '' });
    }
  };

  return (
    <div className="pt-20">
      <section className="py-16 bg-gradient-to-br from-[#e8f8f9] to-[#f0f9ff]">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <span className="text-[#0F9FA8] text-sm font-semibold tracking-widest uppercase">Patient Support</span>
          <h1 className="mt-3 text-4xl font-bold text-[#0A3D62] font-heading">Ask Us Anything</h1>
          <p className="mt-4 text-gray-600 max-w-xl mx-auto">
            Have questions about our services, appointments, or treatments? We are here to help.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-14">
            {/* FAQ */}
            <div>
              <h2 className="text-2xl font-bold text-[#0A3D62] font-heading mb-8">Frequently Asked Questions</h2>
              <div className="space-y-3">
                {faqs.map((faq, i) => (
                  <div
                    key={i}
                    className="border border-gray-200 rounded-2xl overflow-hidden"
                  >
                    <button
                      onClick={() => setActiveIdx(activeIdx === i ? null : i)}
                      className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <HelpCircle size={18} className="text-[#0F9FA8] flex-shrink-0" />
                        <span className="text-sm font-semibold text-[#0A3D62]">{faq.q}</span>
                      </div>
                      <span className={`text-[#0F9FA8] text-xl font-light transition-transform ${activeIdx === i ? 'rotate-45' : ''}`}>+</span>
                    </button>
                    {activeIdx === i && (
                      <div className="px-5 pb-5 pt-0">
                        <p className="text-gray-600 text-sm leading-relaxed pl-7">{faq.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Ask Question Form */}
            <div>
              <h2 className="text-2xl font-bold text-[#0A3D62] font-heading mb-8">Ask Your Question</h2>
              <div className="bg-[#F5F7FA] rounded-3xl p-7">
                {status === 'success' ? (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle size={32} className="text-[#3CB371]" />
                    </div>
                    <h3 className="text-xl font-bold text-[#0A3D62] mb-2">Question Sent!</h3>
                    <p className="text-gray-600 mb-5">Our medical team will respond within 24 hours.</p>
                    <button onClick={() => setStatus('idle')} className="btn-primary mx-auto">Ask Another</button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Name *</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                        placeholder="Full name"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number *</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        required
                        placeholder="+91 96770 80778"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Email (Optional)</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="you@example.com"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Question *</label>
                      <textarea
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        required
                        rows={5}
                        placeholder="Type your question here..."
                        className="input-field resize-none"
                      />
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
                      className="btn-primary w-full justify-center py-3.5"
                    >
                      {status === 'loading' ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
                      ) : (
                        'Submit Question'
                      )}
                    </button>
                    <p className="text-xs text-gray-400 text-center">
                      Our medical team responds within 24 hours
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

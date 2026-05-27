import { useState } from 'react';
import { Phone, Mail, MapPin, Clock, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Contact() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    const { error } = await supabase.from('contact_messages').insert([form]);
    if (error) setStatus('error');
    else {
      setStatus('success');
      setForm({ name: '', phone: '', email: '', subject: '', message: '' });
    }
  };

  return (
    <div className="pt-20">
      <section className="py-16 bg-gradient-to-br from-[#e8f8f9] to-[#f0f9ff]">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <span className="text-[#0F9FA8] text-sm font-semibold tracking-widest uppercase">Get In Touch</span>
          <h1 className="mt-3 text-4xl font-bold text-[#0A3D62] font-heading">Contact Us</h1>
          <p className="mt-4 text-gray-600 max-w-xl mx-auto">
            Have questions? We are here to help. Reach out through any of the channels below.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-10">
            {/* Contact Info */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-[#0A3D62] font-heading">Clinic Information</h2>

              {[
                {
    icon: MapPin,
    title: 'Address',
    content: (
      <a
        href="https://maps.app.goo.gl/VyoNg3KmtathG7mn9?g_st=aw"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline"
      >
        Rasi Complex, Door No.116/1,
        <br />
        Mount Poonamallee Road,
        <br />
        Porur, Chennai – 600116
      </a>
    ),
    color: 'bg-[#0F9FA8]',
  },
                {
                  icon: Phone,
                  title: 'Phone',
                  content: '+91 96770 80778 (WhatsApp)\n+91 63744 70778',
                  color: 'bg-[#0A3D62]',
                },
                {
                  icon: Mail,
                  title: 'Email',
                  content: 'arviorthoandchildcare@gmail.com',
                  color: 'bg-[#3CB371]',
                },
                {
                  icon: Clock,
                  title: 'Timings',
                  content: 'Mon – Sat: 10:00 AM – 10:00 PM\nSunday: 10:00 AM – 06:00 PM',
                  color: 'bg-[#0F9FA8]',
                },
              ].map(({ icon: Icon, title, content, color }) => (
                <div key={title} className="flex gap-4">
                  <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#0A3D62] text-sm">{title}</p>
                    <p className="text-gray-500 text-sm whitespace-pre-line mt-0.5">{content}</p>
                  </div>
                </div>
              ))}

              {/* WhatsApp */}
              <a
                href="https://wa.me/919677080778"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/30 hover:bg-[#25D366]/20 transition-colors"
              >
                <div className="w-11 h-11 rounded-xl bg-[#25D366] flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Chat on WhatsApp</p>
                  <p className="text-gray-500 text-xs">Usually responds within 1 hour</p>
                </div>
              </a>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl shadow-card border border-gray-100 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#0F9FA8]/10 flex items-center justify-center">
                    <MessageSquare size={20} className="text-[#0F9FA8]" />
                  </div>
                  <h2 className="text-xl font-bold text-[#0A3D62] font-heading">Send us a Message</h2>
                </div>

                {status === 'success' ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle size={32} className="text-[#3CB371]" />
                    </div>
                    <h3 className="text-xl font-bold text-[#0A3D62] mb-2">Message Sent!</h3>
                    <p className="text-gray-600 mb-5">We will get back to you within 24 hours.</p>
                    <button onClick={() => setStatus('idle')} className="btn-primary mx-auto">Send Another</button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          required
                          placeholder="Your full name"
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
                    </div>
                    <div className="grid md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          placeholder="you@example.com"
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
                        <input
                          type="text"
                          value={form.subject}
                          onChange={(e) => setForm({ ...form, subject: e.target.value })}
                          placeholder="How can we help?"
                          className="input-field"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Message *</label>
                      <textarea
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        required
                        rows={5}
                        placeholder="Write your message here..."
                        className="input-field resize-none"
                      />
                    </div>
                    {status === 'error' && (
                      <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-xl">
                        <AlertCircle size={16} />
                        Something went wrong. Please try again or call us directly.
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={status === 'loading'}
                      className="btn-primary w-full justify-center py-4 text-base"
                    >
                      {status === 'loading' ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
                      ) : (
                        <><MessageSquare size={18} /> Send Message</>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="py-8 bg-white pb-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="rounded-3xl overflow-hidden shadow-card h-80 bg-[#F5F7FA] flex items-center justify-center">
            <div className="text-center">
              <MapPin size={48} className="text-[#0F9FA8] mx-auto mb-3" />
              <p className="font-semibold text-[#0A3D62]">ARVI Ortho & Child Care</p>
              <p className="text-gray-500 text-sm mt-1">Rasi Complex, Mount Poonamallee Road, Porur, Chennai – 600116</p>
              <a
                href="https://maps.app.goo.gl/kpoiXLXRUarDwB7TA"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary mt-4 mx-auto"
              >
                Open in Google Maps
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

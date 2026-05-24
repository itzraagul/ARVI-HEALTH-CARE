export default function Terms() {
  return (
    <div className="pt-20">
      <section className="py-16 bg-gradient-to-br from-[#e8f8f9] to-[#f0f9ff]">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-[#0A3D62] font-heading">Terms & Conditions</h1>
          <p className="mt-3 text-gray-500">Last updated: January 2025</p>
        </div>
      </section>
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 space-y-8">
          {[
            {
              title: '1. Acceptance of Terms',
              content: 'By accessing and using the ARVI Ortho and Child Care website and services, you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.',
            },
            {
              title: '2. Appointment Booking',
              content: 'Online appointment requests are subject to availability and confirmation by our staff. Appointment requests submitted online are not confirmed until you receive a WhatsApp or phone confirmation from our team. Please arrive 10 minutes before your scheduled appointment time.',
            },
            {
              title: '3. Cancellation Policy',
              content: 'We request that you inform us at least 24 hours in advance if you need to cancel or reschedule your appointment. Repeated last-minute cancellations may affect your ability to book future appointments.',
            },
            {
              title: '4. Medical Disclaimer',
              content: 'Information provided on this website is for general informational purposes only and does not constitute medical advice. Always consult with our qualified medical professionals for specific medical conditions and treatments.',
            },
            {
              title: '5. Payment Terms',
              content: 'Consultation fees are payable at the time of visit. For advance payments made online, our refund policy applies. Please contact our reception for details regarding payment methods accepted.',
            },
            {
              title: '6. Contact',
              content: 'For questions regarding these terms, please contact us at info@arviortho.com or +91 96770 80778.',
            },
          ].map(({ title, content }) => (
            <div key={title}>
              <h2 className="text-xl font-bold text-[#0A3D62] font-heading mb-3">{title}</h2>
              <p className="text-gray-600 leading-relaxed">{content}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

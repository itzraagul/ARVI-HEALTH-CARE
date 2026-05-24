export default function PrivacyPolicy() {
  return (
    <div className="pt-20">
      <section className="py-16 bg-gradient-to-br from-[#e8f8f9] to-[#f0f9ff]">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-[#0A3D62] font-heading">Privacy Policy</h1>
          <p className="mt-3 text-gray-500">Last updated: January 2025</p>
        </div>
      </section>
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 prose prose-gray max-w-none space-y-8">
          {[
            {
              title: '1. Information We Collect',
              content: 'We collect personal information that you provide when booking appointments or contacting us, including your name, phone number, email address, and medical history relevant to your consultation. This information is collected solely to provide you with healthcare services.',
            },
            {
              title: '2. How We Use Your Information',
              content: 'Your information is used to: schedule and manage appointments, send confirmation and reminder messages, provide medical care and treatment, communicate important health information, and improve our services.',
            },
            {
              title: '3. Data Protection',
              content: 'We implement industry-standard security measures to protect your personal and medical information. All data is encrypted and stored securely. We do not sell, rent, or share your personal information with third parties without your explicit consent, except as required by law.',
            },
            {
              title: '4. Medical Records',
              content: 'Your medical records are kept strictly confidential and are accessible only to authorized medical staff involved in your care. We comply with all applicable medical privacy laws and regulations.',
            },
            {
              title: '5. Contact Information',
              content: 'If you have questions about this privacy policy or your personal data, please contact us at info@arviortho.com or call +91 96770 80778.',
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

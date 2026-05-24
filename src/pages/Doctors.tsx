import DoctorsSection from '../components/DoctorsSection';
import { Link } from 'react-router-dom';

export default function Doctors() {
  return (
    <div className="pt-20">
      <section className="py-16 bg-gradient-to-br from-[#e8f8f9] to-[#f0f9ff]">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <span className="text-[#0F9FA8] text-sm font-semibold tracking-widest uppercase">Our Specialists</span>
          <h1 className="mt-3 text-4xl md:text-5xl font-bold text-[#0A3D62] font-heading">Meet Our Expert Doctors</h1>
          <p className="mt-5 text-gray-600 text-lg max-w-2xl mx-auto">
            Highly qualified specialists committed to providing exceptional healthcare with genuine compassion.
          </p>
        </div>
      </section>
      <DoctorsSection />
      <section className="py-16 bg-[#0A3D62]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white font-heading mb-4">Ready to Consult Our Specialists?</h2>
          <p className="text-blue-200 mb-8">Book your appointment today and get expert medical care for you and your family.</p>
          <Link to="/appointment" className="btn-primary text-base px-8 py-4 mx-auto">
            Book Appointment
          </Link>
        </div>
      </section>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { CheckCircle, Phone, Calendar, Baby } from 'lucide-react';

const services = [
  { title: 'Child Consultation', desc: 'Comprehensive consultations for all childhood illnesses and concerns.', icon: '👶' },
  { title: 'Vaccination', desc: 'Complete immunization programs following national vaccination schedules.', icon: '💉' },
  { title: 'Growth & Development', desc: "Regular monitoring of your child's physical and developmental milestones.", icon: '📈' },
  { title: 'Nutrition & Diet', desc: 'Expert guidance on age-appropriate nutrition for optimal growth.', icon: '🥗' },
  { title: 'Fever & Infection', desc: 'Prompt and effective management of fevers, infections, and viral illnesses.', icon: '🌡️' },
  { title: 'Newborn Care', desc: 'Specialized care and guidance for newborns during the critical first weeks.', icon: '🍼' },
  { title: 'Respiratory Care', desc: 'Expert management of asthma, bronchitis, and respiratory infections.', icon: '💨' },
  { title: 'Developmental Assessment', desc: 'Comprehensive evaluation of developmental delays and learning challenges.', icon: '🧠' },
];

const vaccineSchedule = [
  { age: 'Birth', vaccines: 'BCG, Hepatitis B (1st dose), OPV-0' },
  { age: '6 Weeks', vaccines: 'DTwP/DTaP (1), IPV (1), Hep B (2), Hib (1), Rotavirus (1), PCV (1)' },
  { age: '10 Weeks', vaccines: 'DTwP/DTaP (2), IPV (2), Hib (2), Rotavirus (2), PCV (2)' },
  { age: '14 Weeks', vaccines: 'DTwP/DTaP (3), IPV (3), Hib (3), Rotavirus (3), PCV (3)' },
  { age: '6 Months', vaccines: 'Hepatitis B (3rd dose), OPV (2)' },
  { age: '9 Months', vaccines: 'MMR (1st dose), Typhoid (1)' },
  { age: '12 Months', vaccines: 'Hepatitis A (1), Varicella (1)' },
  { age: '15 Months', vaccines: 'MMR (2nd dose), Varicella (2), PCV Booster' },
];

export default function ChildCare() {
  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-[#e8f5e9] to-[#f0fff4] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="max-w-2xl">
            <span className="text-[#3CB371] text-sm font-semibold tracking-widest uppercase">Paediatric Excellence</span>
            <h1 className="mt-3 text-4xl md:text-5xl font-bold text-[#0A3D62] font-heading leading-tight">
              Expert Child Care<br />
              <span className="text-[#3CB371]">With Compassion</span>
            </h1>
            <p className="mt-5 text-gray-600 text-lg leading-relaxed">
              Comprehensive Paediatric care by Dr. Vishali G (MD Paediatrics), Consultant Paediatrician dedicated to your child's health and development.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <Link to="/appointment" className="btn-green text-base px-7 py-4">
                <Calendar size={18} /> Book Appointment
              </Link>
              <a href="tel:+919677080778" className="btn-secondary text-base px-7 py-4">
                <Phone size={18} /> Call Now
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Doctor Spotlight */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <span className="text-[#3CB371] text-sm font-semibold tracking-widest uppercase">Our Paediatric Specialist</span>
              <h2 className="text-3xl font-bold text-[#0A3D62] font-heading">Dr. Vishali G</h2>
              <p className="text-[#3CB371] font-semibold">MD Paediatrics | Consultant Paediatrician</p>
              <p className="text-gray-600 leading-relaxed">
                Dr. Vishali is a compassionate and highly skilled paediatrician who specializes in child health from newborn care to adolescent medicine. Her gentle approach helps children feel safe and comfortable during consultations.
              </p>
              <div className="space-y-2">
                {[
                  'Specialist in newborn and neonatal care',
                  'Complete vaccination guidance and administration',
                  'Growth and developmental assessment',
                  'Nutritional counseling and diet planning',
                  'Management of childhood infections and fevers',
                ].map((s) => (
                  <div key={s} className="flex items-center gap-2.5">
                    <CheckCircle size={16} className="text-[#3CB371] flex-shrink-0" />
                    <span className="text-sm text-gray-700">{s}</span>
                  </div>
                ))}
              </div>
              <Link to="/appointment" className="btn-green">
                <Calendar size={16} /> Book with Dr. Vishali
              </Link>
            </div>
            <div className="relative">
              <img
                src="/images/vishali.PNG"
                alt="Dr. Vishali"
                className="rounded-3xl shadow-2xl w-full object-cover max-h-[500px] object-top"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 bg-[#F5F7FA]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-[#3CB371] text-sm font-semibold tracking-widest uppercase">Paediatric Services</span>
            <h2 className="mt-3 text-3xl font-bold text-[#0A3D62] font-heading">Complete Child Healthcare</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {services.map((s) => (
              <div key={s.title} className="bg-white rounded-2xl p-6 shadow-card card-hover">
                <div className="text-3xl mb-4">{s.icon}</div>
                <h3 className="text-base font-bold text-[#0A3D62] font-heading mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vaccination Schedule */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-[#3CB371] text-sm font-semibold tracking-widest uppercase">Immunization</span>
            <h2 className="mt-3 text-3xl font-bold text-[#0A3D62] font-heading">Vaccination Schedule</h2>
            <p className="mt-3 text-gray-600">Following IAP (Indian Academy of Paediatrics) recommended immunization schedule</p>
          </div>
          <div className="overflow-x-auto rounded-2xl shadow-card">
            <table className="w-full">
              <thead>
                <tr className="bg-[#0A3D62] text-white">
                  <th className="py-4 px-6 text-left text-sm font-semibold rounded-tl-2xl">Age</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold rounded-tr-2xl">Recommended Vaccines</th>
                </tr>
              </thead>
              <tbody>
                {vaccineSchedule.map((row, i) => (
                  <tr
                    key={row.age}
                    className={i % 2 === 0 ? 'bg-white' : 'bg-[#F5F7FA]'}
                  >
                    <td className="py-4 px-6 text-sm font-semibold text-[#0F9FA8]">{row.age}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{row.vaccines}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-gray-400 text-xs text-center mt-4">* Consult Dr. Vishali for personalized vaccination plan for your child</p>
        </div>
      </section>
    </div>
  );
}

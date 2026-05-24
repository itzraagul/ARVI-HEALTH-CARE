# ARVI Ortho & Child Care — Website

Official website for **ARVI Ortho & Child Care** clinic located at Porur, Chennai.

Built with **React + TypeScript + Vite**, backend powered by **Supabase**.

---

## 🏥 About the Clinic

**ARVI Ortho & Child Care**
Rasi Complex, Door No.116/1, Mount Poonamallee Road, Porur, Chennai – 600116

- **Phone:** +91 96770 80778
- **Email:** arviorthoandchildcare@gmail.com
- **Timings:** Mon–Sat 9AM–8PM | Sun 10AM–2PM

**Doctors:**
- Dr. Aravindasamy M — MS Orthopaedics
- Dr. Vishali G — MD Paediatrics
- Physiotherapist Expert — BPT

---

## 🚀 Local Development

### Prerequisites
- Node.js v18 or higher — download from [nodejs.org](https://nodejs.org)
- npm (comes with Node.js)

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open in browser
# http://localhost:5173
```

### Build for Production

```bash
npm run build
# Output is in the dist/ folder — deploy this folder
```

---

## 🗄️ Supabase Setup

### Environment Variables

The `.env` file is pre-configured. If you need to update it:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Run Migrations

Run these SQL files in order in **Supabase Dashboard → SQL Editor → New Query**:

1. `supabase/migrations/20260512100146_create_clinic_tables.sql`
2. `supabase/migrations/20260523000001_enhancements.sql`
3. `supabase/migrations/20260523000002_media_whatsapp.sql`
4. `supabase/migrations/20260523000003_reply_system.sql`

Each file is safe to run multiple times (uses `IF NOT EXISTS` / `ON CONFLICT DO NOTHING`).

### Create Storage Buckets (if not auto-created)

In Supabase Dashboard → Storage → New Bucket:
- Name: `clinic-images` → toggle **Public** ON
- Name: `clinic-videos` → toggle **Public** ON

---

## 🔐 Admin Login

Access the admin portal at `/login`

| Role | Username | Password | Access |
|---|---|---|---|
| Master Admin | `admin` | `Admin@123` | Full access |
| Dr. Aravindasamy | `aravind` | `Pass@123` | His + physio appointments |
| Dr. Vishali | `vishali` | `Pass@123` | Her + physio appointments |
| Clinic Assistant | `CA` | `Pass@123` | Read-only all appointments |
| Physiotherapist | `Physiotherapist` | `Pass@123` | Physio appointments only |

> Usernames are **not case-sensitive**. Change passwords after first login.

---

## 📁 Project Structure

```
project/
├── public/
│   └── images/          # Static clinic images and logo
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── HeroSection.tsx
│   │   ├── TestimonialsSection.tsx
│   │   └── ...
│   ├── pages/           # Route pages
│   │   ├── Home.tsx
│   │   ├── About.tsx
│   │   ├── Appointment.tsx
│   │   ├── Gallery.tsx
│   │   ├── Blog.tsx
│   │   ├── Contact.tsx
│   │   ├── AskUs.tsx
│   │   ├── Admin.tsx      # Admin portal
│   │   └── Login.tsx
│   ├── lib/
│   │   ├── supabase.ts    # Supabase client + types
│   │   ├── auth.ts        # Admin authentication
│   │   ├── toast.ts       # Toast notifications
│   │   └── timeSlots.ts   # Appointment time slot generator
│   └── App.tsx            # Routes
├── supabase/
│   └── migrations/        # SQL migration files
├── .env                   # Environment variables
└── package.json
```

---

## 🌟 Features

### Public Website
- Home page with hero, services, doctors, testimonials
- Online appointment booking (all days including Sunday, 9AM–11:30PM)
- Photo & Video Gallery (with Google Images album)
- Medical Blog
- Ask Us / FAQ section
- Contact page with Google Maps embed

### Admin Portal (`/login`)
- **Dashboard** — appointment stats, quick overview
- **Appointments** — approve, reject, complete with WhatsApp confirmation
- **Messages** — view and reply to contact/ask-us messages
- **Media Manager** — upload images/videos, manage Google Images album
- **User Management** — create/edit/delete admin users (Master Admin only)
- **WhatsApp** — toggle auto-confirmations, view delivery log
- **My Settings** — change password

---

## 📱 WhatsApp Confirmations

When an appointment is approved in the admin portal:
1. WhatsApp opens automatically with a pre-filled confirmation message
2. Admin clicks Send in WhatsApp — message delivered to patient
3. Delivery is logged in the WhatsApp tab

No API key required — uses WhatsApp's `wa.me` link system.

---

## 🌐 Deployment

### Netlify (Recommended — Free)
1. Run `npm run build`
2. Go to [netlify.com](https://netlify.com)
3. Drag and drop the `dist/` folder
4. Add environment variables in: Site Settings → Environment Variables
5. Done — live in seconds

### Vercel
```bash
npm install -g vercel
vercel --prod
```

Add environment variables in Vercel dashboard.

---

## 🔧 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript |
| Build Tool | Vite 5 |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| Backend/DB | Supabase (PostgreSQL) |
| Storage | Supabase Storage |
| Auth | Custom session-based |
| Icons | Lucide React |

---

## 📞 Support

For technical issues contact the IT Team at **+91 96770 80778**

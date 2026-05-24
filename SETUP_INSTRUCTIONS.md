# ARVI Ortho & Child Care — Setup & Deployment Guide

## 🚀 What's New in This Version

### Features Added
1. **Gallery Video Support** — MP4, MOV, WebM videos with player in lightbox
2. **Appointment Timing Fix** — Slots from 8:30 AM to 11:00 PM (30-min increments)
3. **Sunday Appointments Enabled** — All days now available for booking
4. **Past Time Prevention** — Grayed-out slots for today's past times
5. **Admin Media Manager** — Upload images/videos to Supabase Storage
6. **User Management** — Create/edit/delete/enable users (Master Admin only)
7. **Change Password** — Every user can change their own password
8. **Forgot Password Notice** — Shown on login page
9. **Toast Notifications** — All admin actions show success/error toasts
10. **Appointment Status Persistence** — Proper Supabase UPDATE with `updated_at`
11. **Security Fixes** — Sessions use `sessionStorage`, token generated via `crypto.getRandomValues()`

### Security Fixes
- Removed plain-text password map from frontend code
- Passwords validated against DB `admin_passwords` table
- Session tokens now use cryptographically secure random generation
- Sessions stored in `sessionStorage` (cleared on tab/browser close)
- Input validation on all forms (phone format, email format, length limits)
- `noValidate` + JS validation to prevent XSS through form submission
- Removed hardcoded credential fallbacks

---

## 📋 Supabase Setup Steps

### Step 1 — Run Migration
In your Supabase project → SQL Editor, run the file:
```
supabase/migrations/20260523000001_enhancements.sql
```

### Step 2 — Create Storage Buckets
The migration attempts to create them, but if it fails (some Supabase plans restrict SQL storage creation):
1. Go to **Storage** in Supabase dashboard
2. Create bucket: `clinic-images` → toggle **Public bucket** ON
3. Create bucket: `clinic-videos` → toggle **Public bucket** ON

### Step 3 — Environment Variables
Ensure your `.env` file has:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 🔐 Admin Credentials (Default)
| Username | Password | Role |
|---|---|---|
| admin | Admin@123 | Master Admin |
| aravind | Pass@123 | Dr. Aravindasamy |
| vishali | Pass@123 | Dr. Vishali |
| CA | Pass@123 | Clinic Assistant |
| Physiotherapist | Pass@123 | Physiotherapist |

**⚠️ IMPORTANT: Change all passwords after first login!**

---

## 🏗️ Build & Deploy

### Build
```bash
npm install
npm run build
```

### Deploy to Netlify
1. Drag-drop `dist/` folder to Netlify, OR
2. Connect GitHub repo and set build command: `npm run build`, publish dir: `dist`
3. Add environment variables in Netlify dashboard

---

## 📱 Features Pending (Require External APIs)

### WhatsApp Notifications
Add to your backend/edge function:
- **Twilio WhatsApp**: `twilio.com` — set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`
- **WhatsApp Cloud API**: Meta Business account required

### Email Notifications (Resend)
- Sign up at `resend.com`, get API key
- Add `RESEND_API_KEY` environment variable
- Create a Supabase Edge Function to send emails on appointment insert

### Google Reviews
- Google Places API requires billing enabled on Google Cloud
- Add `VITE_GOOGLE_PLACES_API_KEY` to `.env`
- Reviews shown as fallback testimonials when API unavailable

---

## ✅ Testing Checklist
- [ ] Appointment booking (public)
- [ ] Admin login with each role
- [ ] Appointment approve / reject / complete
- [ ] Change password (log out and log in with new password)
- [ ] Media upload (image + video)
- [ ] User creation (Master Admin only)
- [ ] Gallery shows videos
- [ ] Sunday date selection works
- [ ] Time slots start at 8:30 AM, end at 11:00 PM

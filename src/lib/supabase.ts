import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Appointment = {
  id: string;
  patient_name: string;
  patient_phone: string;
  patient_email?: string;
  doctor: string;
  appointment_date: string;
  appointment_time: string;
  reason?: string;
  status: string;
  payment_status?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
};

export type ContactMessage = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  subject?: string;
  message: string;
  is_read?: boolean;
  created_at?: string;
};

export type GalleryItem = {
  id?: string;
  title: string;
  category: string;
  media_url: string;
  media_type: 'image' | 'video';
  thumbnail_url?: string;
  is_published?: boolean;
  created_at?: string;
};

export type AdminUser = {
  id: string;
  username: string;
  role: string;
  full_name: string;
  email: string;
  is_active: boolean;
  created_at?: string;
};

export type Testimonial = {
  id?: string;
  patient_name: string;
  rating: number;
  review: string;
  doctor?: string;
  is_published?: boolean;
  created_at?: string;
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  category: string;
  cover_image?: string;
  author?: string;
  is_published?: boolean;
  reading_time?: number;
  created_at?: string;
  updated_at?: string;
};

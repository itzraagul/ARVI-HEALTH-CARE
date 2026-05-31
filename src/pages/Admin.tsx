import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, MessageSquare, LogOut, RefreshCw,
  CheckCircle, XCircle, Clock, ChevronRight, Search, Upload,
  Image as ImageIcon, Film, Trash2, Users, Lock, Eye, EyeOff,
  Plus, Edit2, UserCheck, UserX, AlertCircle, X, Globe, Heart,
  ChevronDown, ChevronUp, FileText, Play, Pin, PinOff,
  MessageCircle, ToggleLeft, ToggleRight, History, Send, Reply,
  Tag, FolderOpen, CalendarOff, Megaphone, Zap, Bell, BellOff, Phone,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import LeaveCalendar from '../components/LeaveCalendar';
import { authService } from '../lib/auth';
import { toast } from '../lib/toast';

type Tab = 'dashboard' | 'appointments' | 'messages' | 'media' | 'users' | 'settings' | 'whatsapp' | 'stories' | 'leave' | 'flashnews';

type Appointment = {
  id: string; patient_name: string; patient_phone: string; patient_email?: string;
  doctor: string; appointment_date: string; appointment_time: string;
  reason?: string; status: string; payment_status?: string;
  whatsapp_sent?: boolean; created_at?: string;
};
type ContactMessage = {
  id: string; name: string; phone: string; email?: string;
  subject?: string; message: string; is_read?: boolean;
  admin_reply?: string; replied_at?: string; created_at?: string;
};
type MediaItem = {
  id: string; title: string; category: string; media_url: string;
  media_type: string; thumbnail_url?: string; is_published?: boolean; is_pinned?: boolean; created_at?: string;
};
type AdminUserRow = {
  id: string; username: string; role: string; full_name: string; email: string; is_active: boolean;
};
type WaLog = {
  id: string; patient_name: string; patient_phone: string;
  message_sent: string; status: string; error_message?: string; created_at: string;
};

function fmtDate(d?: string) {
  if (!d) return '';
  return new Date(d + (d.includes('T') ? '' : 'T12:00:00'))
    .toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const doctorLabels: Record<string, string> = {
  'dr-aravindasamy': 'Dr. Aravindasamy M',
  'dr-vishali': 'Dr. Vishali G',
  'physiotherapist': 'Physiotherapist Expert',
};
const statusColor: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
};
const roleLabels: Record<string, string> = {
  master_admin: 'Master Admin', doctor_aravind: 'Dr. Aravindasamy',
  doctor_vishali: 'Dr. Vishali', clinic_assistant: 'Clinic Assistant', physiotherapist: 'Physiotherapist',
};
const CLINIC_NAME = 'ARVI Ortho & Child Care';
const CLINIC_PHONE = '+91 96770 80778';
const MEDIA_CATEGORIES = ['Clinic', 'Doctors', 'Promotions', 'Google Images', 'Videos'];

// ─── WhatsApp: emoji-safe encoding ───────────────────────────────────────────
function buildWaMessage(apt: Appointment): string {
  const dateStr = fmtDate(apt.appointment_date);
  const doctorName = doctorLabels[apt.doctor] || apt.doctor;
  // Unicode escape sequences: survive all build tools and file encodings
  const E_TICK  = '\u2705';
  const E_CAL   = '\uD83D\uDCC5';
  const E_CLOCK = '\uD83D\uDD50';
  const E_DOC   = '\uD83D\uDC68\u200D\u2695\uFE0F';
  const E_HOSP  = '\uD83C\uDFE5';
  const E_PRAY  = '\uD83D\uDE4F';
  return [
    `Hello ${apt.patient_name},`,
    ``,
    `${E_TICK} Your appointment has been confirmed successfully!`,
    ``,
    `${E_CAL} Date: ${dateStr}`,
    `${E_CLOCK} Time: ${apt.appointment_time}`,
    `${E_DOC} Doctor: ${doctorName}`,
    `${E_HOSP} Clinic: ${CLINIC_NAME}`,
    ``,
    `Please arrive 10 minutes before your scheduled time.`,
    ``,
    `For queries, call us at ${CLINIC_PHONE}.`,
    ``,
    `Thank you for choosing ${CLINIC_NAME}. We look forward to seeing you! ${E_PRAY}`,
  ].join('\n');
}
function cleanPhone(raw: string): string {
  let p = raw.replace(/\D/g, '');
  if (p.startsWith('0')) p = p.slice(1);
  if (!p.startsWith('91') && p.length === 10) p = '91' + p;
  return p;
}

// ─── WhatsApp message builder ───────────────────────────────────────────────
async function sendWhatsAppMessage(apt: Appointment): Promise<{ success: boolean; error?: string }> {
  const message = buildWaMessage(apt);

  const phone = cleanPhone(apt.patient_phone);
  if (!phone || phone.length < 10) {
    return { success: false, error: 'Invalid phone number' };
  }

  const encoded = encodeURIComponent(message);
  const waUrl = `https://wa.me/${phone}?text=${encoded}`;

  // Programmatic anchor click: avoids popup blockers & double-open bug
  const _a = document.createElement('a');
  _a.href = waUrl;
  _a.target = '_blank';
  _a.rel = 'noopener noreferrer';
  document.body.appendChild(_a);
  _a.click();
  setTimeout(() => { try { document.body.removeChild(_a); } catch {} }, 200);

  try {
    await supabase.from('whatsapp_logs').insert([{
      appointment_id: apt.id,
      patient_name: apt.patient_name,
      patient_phone: apt.patient_phone,
      message_sent: message,
      status: 'sent',
    }]);
    await supabase.from('appointments').update({ whatsapp_sent: true }).eq('id', apt.id);
  } catch { /* non-fatal */ }

  return { success: true };
}

// ─── Change Password Modal ────────────────────────────────────────────────────
function ChangePasswordModal({ userId, targetName, onClose }: { userId: string; targetName?: string; onClose: () => void }) {
  const [form, setForm] = useState({ current: '', newPw: '', confirm: '' });
  const [showC, setShowC] = useState(false);
  const [showN, setShowN] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (form.newPw.length < 6) { setError('Min 6 characters required'); return; }
    if (form.newPw !== form.confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    const r = await authService.changePassword(userId, form.current, form.newPw);
    setLoading(false);
    if (r.success) { toast.success('Password changed'); onClose(); }
    else setError(r.error || 'Failed');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#0A3D62]">Change Password{targetName ? ` — ${targetName}` : ""}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 text-sm rounded-xl"><AlertCircle size={16} />{error}</div>}
          {[
            { label: 'Current Password', field: 'current', show: showC, toggle: () => setShowC(v => !v) },
            { label: 'New Password', field: 'newPw', show: showN, toggle: () => setShowN(v => !v) },
            { label: 'Confirm New Password', field: 'confirm', show: showN, toggle: () => {} },
          ].map(({ label, field, show, toggle }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <div className="relative">
                <input type={show ? 'text' : 'password'} value={(form as any)[field]}
                  onChange={e => setForm({ ...form, [field]: e.target.value })} required
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 focus:border-[#0F9FA8] outline-none" />
                {field !== 'confirm' && (
                  <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                )}
              </div>
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-[#0F9FA8] text-white rounded-xl text-sm font-semibold disabled:opacity-60">
              {loading ? 'Saving...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── User Modal ───────────────────────────────────────────────────────────────
function UserModal({ user, onClose, onSave }: { user?: AdminUserRow | null; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    username: user?.username || '', full_name: user?.full_name || '',
    email: user?.email || '', role: user?.role || 'clinic_assistant',
    password: '', is_active: user?.is_active ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sha = async (t: string) => {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!form.username.trim() || !form.full_name.trim()) { setError('Username and full name required'); return; }
    if (!user && form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      if (user) {
        const upd: any = { full_name: form.full_name, email: form.email, role: form.role, is_active: form.is_active };
        if (form.password) upd.password_hash = await sha(form.password);
        const { error: e } = await supabase.from('admin_users').update(upd).eq('id', user.id);
        if (e) throw e;
        toast.success('User updated');
      } else {
        const { error: e } = await supabase.from('admin_users').insert([{
          username: form.username.trim(), full_name: form.full_name.trim(),
          email: form.email, role: form.role, is_active: form.is_active,
          password_hash: await sha(form.password),
        }]);
        if (e) throw e;
        toast.success('User created');
      }
      onSave(); onClose();
    } catch (err: any) { setError(err.message || 'Failed'); toast.error('Save failed'); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#0A3D62]">{user ? 'Edit User' : 'Add New User'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 text-sm rounded-xl"><AlertCircle size={16} />{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
              <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                disabled={!!user} required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#0F9FA8] outline-none disabled:bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#0F9FA8] outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#0F9FA8] outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#0F9FA8] outline-none">
              {Object.entries(roleLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{user ? 'New Password (blank = no change)' : 'Password *'}</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder={user ? 'Leave blank to keep current' : 'Set password'}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#0F9FA8] outline-none" />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="rounded" />
            <span className="text-sm text-gray-700">Account is active</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-[#0F9FA8] text-white rounded-xl text-sm font-semibold disabled:opacity-60">
              {loading ? 'Saving...' : (user ? 'Update' : 'Create User')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Reply Modal ──────────────────────────────────────────────────────────────
function ReplyModal({ msg, onClose, onReplied }: { msg: ContactMessage; onClose: () => void; onReplied: (id: string, reply: string) => void }) {
  const [reply, setReply] = useState(msg.admin_reply || '');
  const [loading, setLoading] = useState(false);

  const sendReply = async () => {
    if (!reply.trim()) { toast.error('Please type a reply'); return; }
    setLoading(true);
    const { error } = await supabase.from('contact_messages').update({
      admin_reply: reply.trim(),
      replied_at: new Date().toISOString(),
      is_read: true,
    }).eq('id', msg.id);
    setLoading(false);
    if (error) { toast.error('Failed to save reply'); return; }
    toast.success('Reply saved successfully');
    onReplied(msg.id, reply.trim());
    onClose();
  };

  // Open email client with pre-filled reply
  const openEmailClient = () => {
    if (!msg.email) { toast.error('No email address for this sender'); return; }
    const subject = encodeURIComponent(`Re: ${msg.subject || 'Your enquiry at ARVI Ortho & Child Care'}`);
    const body = encodeURIComponent(
      `Dear ${msg.name},\n\n${reply}\n\nBest regards,\nARVI Ortho & Child Care\nPhone: ${CLINIC_PHONE}\nEmail: arviorthoandchildcare@gmail.com`
    );
    window.open(`mailto:${msg.email}?subject=${subject}&body=${body}`, '_blank');
  };

  const openWhatsApp = () => {
    if (!msg.phone) { toast.error('No phone number for this sender'); return; }
    const phone = cleanPhone(msg.phone);
    const text = encodeURIComponent(`Dear ${msg.name},\n\n${reply}\n\nBest regards,\nARVI Ortho & Child Care\nPhone: ${CLINIC_PHONE}`);
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F9FA8]/10 flex items-center justify-center">
              <Reply size={20} className="text-[#0F9FA8]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#0A3D62]">Reply to {msg.name}</h2>
              <p className="text-gray-400 text-xs">{msg.email} • {msg.phone}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>

        {/* Original message */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <p className="text-xs text-gray-400 font-semibold uppercase mb-2">Original Message</p>
          {msg.subject && <p className="font-semibold text-[#0A3D62] text-sm mb-1">{msg.subject}</p>}
          <p className="text-gray-600 text-sm leading-relaxed">{msg.message}</p>
          <p className="text-xs text-gray-400 mt-2">{new Date(msg.created_at!).toLocaleString('en-IN')}</p>
        </div>

        {/* Reply box */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Your Reply</label>
          <textarea value={reply} onChange={e => setReply(e.target.value)} rows={5}
            placeholder="Type your reply here..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#0F9FA8] focus:ring-2 focus:ring-[#0F9FA8]/10 outline-none text-sm resize-none" />
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <button onClick={sendReply} disabled={loading || !reply.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0F9FA8] text-white rounded-xl font-semibold text-sm disabled:opacity-60 hover:bg-[#0a7a82]">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle size={16} />}
            Save Reply
          </button>
          {msg.email && (
            <button onClick={openEmailClient}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-xl font-semibold text-sm hover:bg-blue-600">
              <Send size={16} />Send via Email
            </button>
          )}
          {msg.phone && (
            <button onClick={openWhatsApp}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#25D366] text-white rounded-xl font-semibold text-sm hover:bg-[#1da851]">
              <MessageCircle size={16} />Send via WhatsApp
            </button>
          )}
          <button onClick={onClose} className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 ml-auto">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Google Image Modal ────────────────────────────────────────────────────
function AddGoogleImageModal({ onClose, onAdded }: { onClose: () => void; onAdded: (item: MediaItem) => void }) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async () => {
    if (!url.trim()) { setError('Please enter an image URL'); return; }
    setLoading(true);
    const { data, error: err } = await supabase.from('gallery_items').insert([{
      title: title.trim() || 'Google Image',
      category: 'Google Images',
      media_url: url.trim(),
      media_type: 'image',
      is_published: true,
    }]).select().single();
    setLoading(false);
    if (err) { setError('Failed to add: ' + err.message); return; }
    toast.success('Image added to Google Images album');
    onAdded(data);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><Globe size={20} className="text-blue-600" /></div>
            <h2 className="text-xl font-bold text-[#0A3D62]">Add Google Image URL</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 text-sm rounded-xl"><AlertCircle size={16} />{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL *</label>
            <div className="flex gap-2">
              <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/image.jpg"
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#0F9FA8] outline-none text-sm" />
              <button onClick={() => { if (url.trim()) { setPreview(url.trim()); setError(''); } }} className="px-4 py-2.5 bg-gray-100 rounded-xl text-sm font-medium hover:bg-gray-200">Preview</button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title (Optional)</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Patient Review Photo"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#0F9FA8] outline-none text-sm" />
          </div>
          {preview && (
            <div className="rounded-xl overflow-hidden border border-gray-200">
              <img src={preview} alt="preview" className="w-full max-h-48 object-contain p-2 bg-gray-50"
                onError={() => setError('Image could not be loaded. Check the URL.')} />
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium">Cancel</button>
            <button onClick={handleAdd} disabled={loading || !url.trim()}
              className="flex-1 px-4 py-2.5 bg-[#0F9FA8] text-white rounded-xl text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={16} />}
              Add Image
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Change Category Modal ─────────────────────────────────────────────────────
function ChangeCategoryModal({ item, onClose, onChanged }: { item: MediaItem; onClose: () => void; onChanged: (id: string, cat: string) => void }) {
  const [category, setCategory] = useState(item.category);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase.from('gallery_items').update({ category }).eq('id', item.id);
    setLoading(false);
    if (error) { toast.error('Failed to update category'); return; }
    toast.success('Category updated');
    onChanged(item.id, category);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F9FA8]/10 flex items-center justify-center"><Tag size={20} className="text-[#0F9FA8]" /></div>
            <h2 className="text-xl font-bold text-[#0A3D62]">Change Category</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <p className="text-sm text-gray-500 mb-4 truncate">File: <span className="font-medium text-[#0A3D62]">{item.title}</span></p>
        <div className="space-y-2 mb-6">
          {MEDIA_CATEGORIES.map(cat => (
            <label key={cat} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${category === cat ? 'border-[#0F9FA8] bg-[#0F9FA8]/5' : 'border-gray-200 hover:border-[#0F9FA8]/40'}`}>
              <input type="radio" name="cat" value={cat} checked={category === cat} onChange={() => setCategory(cat)} className="text-[#0F9FA8]" />
              <div className="flex items-center gap-2">
                {cat === 'Google Images' && <Globe size={14} className="text-blue-500" />}
                {cat === 'Videos' && <Film size={14} className="text-purple-500" />}
                {cat === 'Doctors' && <span className="text-sm">👨‍⚕️</span>}
                {cat === 'Clinic' && <span className="text-sm">🏥</span>}
                {cat === 'Promotions' && <span className="text-sm">📣</span>}
                <span className="text-sm font-medium text-gray-700">{cat}</span>
              </div>
            </label>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium">Cancel</button>
          <button onClick={handleSave} disabled={loading || category === item.category}
            className="flex-1 px-4 py-2.5 bg-[#0F9FA8] text-white rounded-xl text-sm font-semibold disabled:opacity-60">
            {loading ? 'Saving...' : 'Save Category'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin ───────────────────────────────────────────────────────────────
export default function Admin() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const userRole = authService.getUserRole();

  const [tab, setTab] = useState<Tab>('dashboard');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUserRow[]>([]);
  const [waLogs, setWaLogs] = useState<WaLog[]>([]);
  const [waEnabled, setWaEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [mediaCategory, setMediaCategory] = useState('All');
  const [showChangePw, setShowChangePw] = useState(false);
  const [changePwTarget, setChangePwTarget] = useState<{ id: string; name: string } | null>(null);
  // ── Patient Stories ───────────────────────────────────────────────────────
  type StoryMedia = { id: string; story_id: string; media_url: string; media_type: string; caption?: string; file_name?: string; sort_order: number; is_pinned?: boolean; created_at?: string; thumbnail_url?: string; };
  type PatientStory = { id: string; patient_name: string; treatment: string; description?: string; is_published: boolean; created_at: string; media?: StoryMedia[]; };
  const [stories, setStories] = useState<PatientStory[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [expandedStory, setExpandedStory] = useState<string | null>(null);
  const [showAddStory, setShowAddStory] = useState(false);
  const [addStoryName, setAddStoryName] = useState('');
  const [addStoryTreatment, setAddStoryTreatment] = useState('');
  const [addStoryDesc, setAddStoryDesc] = useState('');
  const [addStoryLoading, setAddStoryLoading] = useState(false);
  const [storyUploadingId, setStoryUploadingId] = useState<string | null>(null);

  // ── Leave Management ──────────────────────────────────────────────────────
  type LeaveRecord = {
    id: string; specialist: string; start_date: string; end_date: string;
    full_day: boolean; half_day_period?: string; time_from?: string; time_to?: string;
    reason?: string; status: string; created_at: string;
  };
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [leavesLoading, setLeavesLoading] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    specialist: '', start_date: '', end_date: '',
    full_day: true, half_day_period: 'first_half', time_from: '', time_to: '', reason: '',
  });
  const [leaveConflicts, setLeaveConflicts] = useState<any[]>([]);
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const [leaveWaSaved, setLeaveWaSaved] = useState<LeaveRecord | null>(null);
  // Approval-time leave warning
  const [approvalLeaveWarning, setApprovalLeaveWarning] = useState<{apt: any; leaveInfo: string} | null>(null);
  const [editLeaveId, setEditLeaveId] = useState<string | null>(null);

  // ── Flash News ────────────────────────────────────────────────────────────
  type FlashNews = { id: string; message: string; is_active: boolean; speed: string; theme: string; };
  const [flashNews, setFlashNews] = useState<FlashNews | null>(null);
  const [flashMsg, setFlashMsg] = useState('');
  const [flashSpeed, setFlashSpeed] = useState('normal');
  const [flashTheme, setFlashTheme] = useState('default');
  const [flashFontSize, setFlashFontSize] = useState('normal');
  const [flashFontStyle, setFlashFontStyle] = useState('inter');
  const [flashLoading, setFlashLoading] = useState(false);

  const [showUserModal, setShowUserModal] = useState(false);
  const [editUser, setEditUser] = useState<AdminUserRow | null>(null);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [replyMsg, setReplyMsg] = useState<ContactMessage | null>(null);
  const [changeCatItem, setChangeCatItem] = useState<MediaItem | null>(null);
  const [mediaUploading, setMediaUploading] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  if (!user || !userRole) { navigate('/login'); return null; }

  const isMasterAdmin = authService.isMasterAdmin();
  const isClinicAssistant = userRole === 'clinic_assistant';
  const canApprove = authService.canApproveAppointments();


  const loadStories = async () => {
    setStoriesLoading(true);
    const { data, error } = await supabase.from('patient_stories').select('*, patient_story_media(*)').order('created_at', { ascending: false });
    if (error) { toast.error('Failed to load stories: ' + error.message); setStoriesLoading(false); return; }
    if (data) setStories(data.map((s: any) => {
      const raw: StoryMedia[] = (s.patient_story_media || []).sort((a: StoryMedia, b: StoryMedia) => new Date(b.created_at||'').getTime() - new Date(a.created_at||'').getTime());
      return { ...s, media: [...raw.filter(m => m.is_pinned), ...raw.filter(m => !m.is_pinned)] };
    }));
    setStoriesLoading(false);
  };

  const addPatientStory = async () => {
    if (!addStoryName.trim() || !addStoryTreatment.trim()) { toast.error('Name and treatment required'); return; }
    setAddStoryLoading(true);
    const { data, error } = await supabase.from('patient_stories').insert([{ patient_name: addStoryName.trim(), treatment: addStoryTreatment.trim(), description: addStoryDesc.trim(), is_published: true }]).select().single();
    if (error) { toast.error('Failed: ' + error.message); setAddStoryLoading(false); return; }
    setStories(prev => [{ ...data, media: [] }, ...prev]);
    setAddStoryName(''); setAddStoryTreatment(''); setAddStoryDesc('');
    setShowAddStory(false); setExpandedStory(data.id);
    toast.success('Story created! Upload files below.'); setAddStoryLoading(false);
  };

  const deleteStory = async (id: string) => {
    if (!window.confirm('Delete this story and all its files?')) return;
    const { error } = await supabase.from('patient_stories').delete().eq('id', id);
    if (error) { toast.error('Failed to delete'); return; }
    setStories(prev => prev.filter(s => s.id !== id)); toast.success('Story deleted');
  };

  const toggleStoryPublish = async (story: PatientStory) => {
    const { error } = await supabase.from('patient_stories').update({ is_published: !story.is_published }).eq('id', story.id);
    if (!error) setStories(prev => prev.map(s => s.id === story.id ? { ...s, is_published: !s.is_published } : s));
  };

  const uploadStoryMedia = async (storyId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (!files || !files.length) return;
    setStoryUploadingId(storyId); let uploaded = 0;
    for (const file of Array.from(files)) {
      if (file.size > 209715200) { toast.error(`${file.name} exceeds 200MB`); continue; }
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `stories/${storyId}/${Date.now()}_${safeName}`;
      const { error: upErr } = await supabase.storage.from('patient-stories').upload(path, file, { upsert: false });
      if (upErr) { toast.error(`Upload failed: ${file.name} — ${upErr.message}`); continue; }
      const { data: urlData } = supabase.storage.from('patient-stories').getPublicUrl(path);
      const mediaType = file.type.startsWith('video') ? 'video' : file.type === 'application/pdf' ? 'pdf' : file.type.includes('word') ? 'doc' : 'image';
      const { data: ins, error: insErr } = await supabase.from('patient_story_media').insert([{ story_id: storyId, media_url: urlData.publicUrl, media_type: mediaType, file_name: file.name, sort_order: Math.floor(Date.now()/1000), is_pinned: false }]).select().single();
      if (insErr) { toast.error(`DB error: ${insErr.message}`); continue; }
      if (ins) { setStories(prev => prev.map(s => s.id === storyId ? { ...s, media: [ins, ...(s.media||[])] } : s)); uploaded++; }
    }
    if (uploaded > 0) toast.success(`${uploaded} file${uploaded>1?'s':''} uploaded!`);
    setStoryUploadingId(null); e.target.value = '';
  };

  const deleteStoryMedia = async (storyId: string, mediaId: string, mediaUrl: string) => {
    if (!window.confirm('Delete this file permanently?')) return;
    try {
      const urlObj = new URL(mediaUrl);
      const parts = urlObj.pathname.split('/patient-stories/');
      if (parts.length > 1) await supabase.storage.from('patient-stories').remove([decodeURIComponent(parts[1])]);
    } catch { }
    const { error } = await supabase.from('patient_story_media').delete().eq('id', mediaId);
    if (error) { toast.error('Failed to delete file'); return; }
    setStories(prev => prev.map(s => s.id === storyId ? { ...s, media: (s.media||[]).filter(m => m.id !== mediaId) } : s));
    toast.success('File deleted');
  };

  const toggleStoryMediaPin = async (storyId: string, m: StoryMedia) => {
    const newVal = !m.is_pinned;
    const { error } = await supabase.from('patient_story_media').update({ is_pinned: newVal }).eq('id', m.id);
    if (error) { toast.error('Failed to update pin'); return; }
    setStories(prev => prev.map(s => {
      if (s.id !== storyId) return s;
      const updated = (s.media||[]).map(x => x.id === m.id ? { ...x, is_pinned: newVal } : x);
      return { ...s, media: [...updated.filter(x=>x.is_pinned), ...updated.filter(x=>!x.is_pinned)] };
    }));
    toast.success(newVal ? '📌 Pinned to top' : 'Unpinned');
  };

  // ── Specialist permission map ─────────────────────────────────────────────
  const SPECIALIST_OPTIONS = [
    { value: 'doctor_aravind',  label: 'Dr. Aravindasamy M',           roles: ['master_admin','clinic_assistant','doctor_aravind'] },
    { value: 'doctor_vishali',  label: 'Dr. Vishali G',                 roles: ['master_admin','clinic_assistant','doctor_vishali'] },
    { value: 'physiotherapist', label: 'Physiotherapist Expert',        roles: ['master_admin','clinic_assistant','physiotherapist'] },
    { value: 'clinic_holiday',  label: 'Arvi Clinic Holiday (All)',     roles: ['master_admin','clinic_assistant'] },
  ];
  const SPECIALIST_DOCTOR_MAP: Record<string,string[]> = {
    'doctor_aravind':  ['dr-aravindasamy'],
    'doctor_vishali':  ['dr-vishali'],
    'physiotherapist': ['physiotherapist'],
    'clinic_holiday':  ['dr-aravindasamy','dr-vishali','physiotherapist'],
  };
  const currentUserRole = user?.role || '';
  const allowedSpecialists = SPECIALIST_OPTIONS.filter(s => s.roles.includes(currentUserRole));

  // Auto-select specialist for non-master-admin / non-CA users (doctors/physio select themselves)
  useEffect(() => {
    if (!leaveForm.specialist && currentUserRole &&
        currentUserRole !== 'master_admin' && currentUserRole !== 'clinic_assistant') {
      const selfOption = SPECIALIST_OPTIONS.find(s => s.value === currentUserRole);
      if (selfOption) setLeaveForm(p => ({ ...p, specialist: selfOption.value }));
    }
  }, [currentUserRole]);

  // ── Leave functions ────────────────────────────────────────────────────────
  const loadLeaves = async () => {
    setLeavesLoading(true);
    const { data, error } = await supabase.from('leave_management').select('*').order('start_date', { ascending: false });
    if (error) { console.error('loadLeaves error:', error.message); }
    setLeaves(data || []);
    setLeavesLoading(false);
  };

  const checkLeaveConflicts = async (): Promise<any[]> => {
    if (!leaveForm.start_date || !leaveForm.end_date || !leaveForm.specialist) return [];
    // Check both pending and approved appointments
    const { data } = await supabase.from('appointments')
      .select('*')
      .in('status', ['pending', 'approved'])
      .gte('appointment_date', leaveForm.start_date)
      .lte('appointment_date', leaveForm.end_date);
    if (!data?.length) return [];
    const keys = SPECIALIST_DOCTOR_MAP[leaveForm.specialist] || [];
    return data.filter((a: any) => keys.includes(a.doctor));
  };

  const resetLeaveForm = () => {
    setLeaveForm({ specialist:'', start_date:'', end_date:'', full_day:true, half_day_period:'first_half', time_from:'', time_to:'', reason:'' });
    setEditLeaveId(null);
  };

  const saveLeave = async (force = false) => {
    if (!leaveForm.specialist) { toast.error('Please select a specialist'); return; }
    if (!leaveForm.start_date || !leaveForm.end_date) { toast.error('Start and end dates required'); return; }
    if (leaveForm.start_date < today) { toast.error('Cannot apply leave for a past date'); return; }
    if (!force) {
      const conflicts = await checkLeaveConflicts();
      if (conflicts.length > 0) { setLeaveConflicts(conflicts); setShowLeaveWarning(true); return; }
    }
    const payload: any = {
      specialist: leaveForm.specialist,
      start_date: leaveForm.start_date,
      end_date: leaveForm.end_date,
      full_day: leaveForm.full_day,
      half_day_period: !leaveForm.full_day ? leaveForm.half_day_period : null,
      time_from: (!leaveForm.full_day && leaveForm.time_from) ? leaveForm.time_from : null,
      time_to:   (!leaveForm.full_day && leaveForm.time_to)   ? leaveForm.time_to   : null,
      reason: leaveForm.reason || null,
      status: 'active',
    };
    const { data, error } = editLeaveId
      ? await supabase.from('leave_management').update(payload).eq('id', editLeaveId).select().single()
      : await supabase.from('leave_management').insert([payload]).select().single();
    if (error) { toast.error('Failed to save leave: ' + error.message); return; }
    setShowLeaveWarning(false);
    if (leaveConflicts.length > 0 && data) setLeaveWaSaved(data);
    setLeaveConflicts([]);
    resetLeaveForm();
    toast.success(editLeaveId ? 'Leave updated' : 'Leave saved');
    await loadLeaves();
  };

  const cancelLeave = async (id: string) => {
    if (!window.confirm('Cancel this leave?')) return;
    const { error } = await supabase.from('leave_management').update({ status: 'cancelled' }).eq('id', id);
    if (error) { toast.error('Failed to cancel leave'); return; }
    setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: 'cancelled' } : l));
    toast.success('Leave cancelled');
  };

  const deleteLeave = async (id: string) => {
    if (!window.confirm('Delete this leave record permanently?')) return;
    await supabase.from('leave_management').delete().eq('id', id);
    setLeaves(prev => prev.filter(l => l.id !== id));
    toast.success('Leave deleted');
  };

  // ── Flash News functions ───────────────────────────────────────────────────
  const loadFlashNews = async () => {
    const { data, error } = await supabase
      .from('flash_news').select('*')
      .order('created_at', { ascending: false })
      .limit(1).maybeSingle();
    if (error) { console.error('loadFlashNews:', error.message); return; }
    if (data) {
      setFlashNews(data);
      if (data.message) setFlashMsg(data.message);
      setFlashSpeed(data.speed || 'normal');
      setFlashTheme(data.theme || 'default');
      setFlashFontSize(data.font_size || 'normal');
      setFlashFontStyle(data.font_style || 'inter');
    }
  };

  const saveFlashNews = async (active: boolean) => {
    if (!flashMsg.trim()) { toast.error('Please enter a flash message'); return; }
    setFlashLoading(true);
    try {
      const now = new Date().toISOString();
      const payload: Record<string,any> = {
        message: flashMsg.trim(),
        is_active: active,
        speed: flashSpeed,
        theme: flashTheme,
        font_size: flashFontSize,
        font_style: flashFontStyle,
        updated_at: now,
      };
      if (active) payload.started_at = now;
      else payload.stopped_at = now;

      let saveError: any = null;
      if (flashNews?.id) {
        const { error } = await supabase.from('flash_news').update(payload).eq('id', flashNews.id);
        saveError = error;
      } else {
        const { data, error } = await supabase.from('flash_news').insert([payload]).select().maybeSingle();
        saveError = error;
        if (data) setFlashNews(data);
      }
      if (saveError) throw saveError;
      await loadFlashNews();
      const E_MEGA = '\uD83D\uDCE2';
      toast.success(active ? `${E_MEGA} Flash news started!` : 'Flash news stopped');
    } catch (err: any) {
      toast.error('Failed to save flash news: ' + (err?.message || 'Unknown error'));
    }
    setFlashLoading(false);
  };

  const autoDeleteOldAppointments = useCallback(async () => {
    try {
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
      await supabase.from('appointments').delete().lt('appointment_date', cutoff.toISOString().split('T')[0]);
    } catch { }
  }, []);
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await autoDeleteOldAppointments();
      const [aptRes, msgRes] = await Promise.all([
        supabase.from('appointments').select('*').order('created_at', { ascending: false }),
        supabase.from('contact_messages').select('*').order('created_at', { ascending: false }),
      ]);
      let apts = aptRes.data || [];
      const filter = authService.getFilteredDoctors();
      if (filter.length > 0) apts = apts.filter((a: Appointment) => filter.includes(a.doctor));
      setAppointments(apts);
      setMessages(msgRes.data || []);

      if (isMasterAdmin) {
        const [usersRes, waRes, cfgRes] = await Promise.all([
          supabase.from('admin_users').select('id,username,role,full_name,email,is_active').order('created_at', { ascending: true }),
          supabase.from('whatsapp_logs').select('*').order('created_at', { ascending: false }).limit(100),
          supabase.from('admin_settings').select('*').eq('key', 'whatsapp_enabled').maybeSingle(),
        ]);
        setAdminUsers(usersRes.data || []);
        setWaLogs(waRes.data || []);
        if (cfgRes.data) setWaEnabled(cfgRes.data.value === 'true');
      }
    } catch { toast.error('Failed to load data'); }
    setLoading(false);
  }, [isMasterAdmin, autoDeleteOldAppointments]);

  const loadMedia = useCallback(async () => {
    if (!isMasterAdmin) return;
    setMediaLoading(true);
    try {
      const { data } = await supabase.from('gallery_items').select('*').order('created_at', { ascending: false });
      const sorted = data ? [...data.filter((m:MediaItem)=>m.is_pinned), ...data.filter((m:MediaItem)=>!m.is_pinned)] : [];
      setMediaItems(sorted);
    } catch { toast.error('Failed to load media'); }
    setMediaLoading(false);
  }, [isMasterAdmin]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { if (tab === 'media') loadMedia(); }, [tab, loadMedia]);
  useEffect(() => { if (tab === 'stories') loadStories(); }, [tab]);
  useEffect(() => { if (tab === 'leave') { loadLeaves(); } }, [tab]);
  useEffect(() => { if (tab === 'flashnews') loadFlashNews(); }, [tab]);

  // Check if an appointment falls on a leave period for its doctor
  const checkApptLeaveConflict = (apt: any): string => {
    if (!apt || !apt.appointment_date) return '';
    const d = apt.appointment_date;
    const t = apt.appointment_time || '';

    // Find doctor's specialist key
    const doctorSpecialist = Object.entries(SPECIALIST_DOCTOR_MAP)
      .find(([, keys]) => keys.includes(apt.doctor))?.[0];
    if (!doctorSpecialist) return '';

    const conflicting = leaves.filter(l => {
      if (l.status !== 'active') return false;
      if (l.start_date > d || l.end_date < d) return false;
      if (l.specialist !== 'clinic_holiday' && l.specialist !== doctorSpecialist) return false;
      return true;
    });

    if (!conflicting.length) return '';

    const leave = conflicting[0];
    const spLabel = SPECIALIST_OPTIONS.find(s => s.value === leave.specialist)?.label || leave.specialist;

    if (leave.specialist === 'clinic_holiday') {
      return `Clinic Holiday declared on ${fmtDate(d)}. The whole clinic is marked unavailable.`;
    }
    if (leave.full_day) {
      return `${spLabel} is on full-day leave on ${fmtDate(d)}.`;
    }
    // Half day — check if appointment time falls in the unavailable window
    if (leave.time_from && leave.time_to && t) {
      // Convert time strings to comparable format
      const toMins = (s: string) => {
        const [h, m] = s.replace(/[APM ]/gi,'').split(':').map(Number);
        const isPM = s.toLowerCase().includes('pm') && h !== 12;
        const isAM = s.toLowerCase().includes('am') && h === 12;
        return (isPM ? h + 12 : isAM ? 0 : h) * 60 + (m || 0);
      };
      const aptMins  = toMins(t);
      const fromMins = toMins(leave.time_from);
      const toMins2  = toMins(leave.time_to);
      if (aptMins >= fromMins && aptMins <= toMins2) {
        return `${spLabel} is unavailable from ${leave.time_from} to ${leave.time_to} on ${fmtDate(d)} (half-day leave). Appointment time ${t} falls in this window.`;
      }
    }
    const period = leave.half_day_period === 'first_half' ? 'morning (first half)' : 'afternoon (second half)';
    return `${spLabel} is on half-day leave (${period}) on ${fmtDate(d)}.`;
  };

  const performApproval = async (id: string) => {
    const { error } = await supabase.from('appointments')
      .update({ status: 'approved', updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast.error('Failed to approve'); return; }
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'approved' } : a));
    setApprovalLeaveWarning(null);
    toast.success('Appointment approved');
    if (waEnabled) {
      const apt = appointments.find(a => a.id === id);
      if (apt && !apt.whatsapp_sent) {
        const result = await sendWhatsAppMessage({ ...apt, status: 'approved' });
        if (result.success) {
          setAppointments(prev => prev.map(a => a.id === id ? { ...a, whatsapp_sent: true } : a));
        }
      }
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    // For approvals: check if this appointment falls on a leave period first
    if (newStatus === 'approved') {
      const apt = appointments.find(a => a.id === id);
      const warning = apt ? checkApptLeaveConflict(apt) : '';
      if (warning) {
        setApprovalLeaveWarning({ apt, leaveInfo: warning });
        return; // Show warning modal — user must confirm
      }
      await performApproval(id);
      return;
    }
    const { error } = await supabase.from('appointments')
      .update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast.error('Failed to update status'); return; }
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    toast.success(`Appointment ${newStatus}`);
  };

  const toggleWaEnabled = async () => {
    const v = !waEnabled; setWaEnabled(v);
    await supabase.from('admin_settings').upsert({ key: 'whatsapp_enabled', value: v.toString() });
    toast.success(`WhatsApp ${v ? 'enabled' : 'disabled'}`);
  };

  const resendWa = async (apt: Appointment) => {
    const result = await sendWhatsAppMessage(apt);
    if (result.success) toast.success('WhatsApp opened');
    else toast.error(result.error || 'Failed');
  };

  const deleteMessage = async (id: string) => {
    if (!window.confirm('Delete this message permanently?')) return;
    const { error } = await supabase.from('contact_messages').delete().eq('id', id);
    if (error) { toast.error('Failed to delete message'); return; }
    setMessages(prev => prev.filter(m => m.id !== id));
    toast.success('Message deleted');
  };
  const markRead = async (id: string) => {
    await supabase.from('contact_messages').update({ is_read: true }).eq('id', id);
    setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m));
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setMediaUploading(true);
    let uploaded = 0;
    for (const file of Array.from(files)) {
      if (file.size > 52428800) { toast.error(`${file.name} too large (max 50MB)`); continue; }
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      if (!isVideo && !isImage) { toast.error(`Unsupported: ${file.name}`); continue; }
      const ext = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
      const bucket = isVideo ? 'clinic-videos' : 'clinic-images';
      try {
        const { error: upErr } = await supabase.storage.from(bucket).upload(fileName, file, { contentType: file.type });
        if (upErr) { toast.error(`Upload failed: ${file.name} — ${upErr.message}`); continue; }
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
        const { data: inserted } = await supabase.from('gallery_items').insert([{
          title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
          category: isVideo ? 'Videos' : 'Clinic',
          media_url: urlData.publicUrl,
          media_type: isVideo ? 'video' : 'image',
          is_published: true,
        }]).select().single();
        if (inserted) { setMediaItems(prev => [inserted, ...prev]); uploaded++; }
      } catch { toast.error(`Error: ${file.name}`); }
    }
    if (uploaded > 0) toast.success(`${uploaded} file(s) uploaded`);
    setMediaUploading(false);
    if (mediaInputRef.current) mediaInputRef.current.value = '';
  };

  const deleteMedia = async (item: MediaItem) => {
    if (!window.confirm(`Delete "${item.title}"?`)) return;
    const { error } = await supabase.from('gallery_items').delete().eq('id', item.id);
    if (!error) { setMediaItems(prev => prev.filter(m => m.id !== item.id)); toast.success('Deleted'); }
    else toast.error('Delete failed');
  };

  const togglePin = async (item: MediaItem) => {
    const newVal = !item.is_pinned;
    const { error } = await supabase.from('gallery_items').update({ is_pinned: newVal }).eq('id', item.id);
    if (error) { toast.error('Failed to update pin'); return; }
    setMediaItems(prev => {
      const updated = prev.map(m => m.id === item.id ? { ...m, is_pinned: newVal } : m);
      return [...updated.filter(m=>m.is_pinned), ...updated.filter(m=>!m.is_pinned)];
    });
    toast.success(newVal ? '📌 Pinned to top' : 'Unpinned');
  };
  const togglePublish = async (item: MediaItem) => {
    const { error } = await supabase.from('gallery_items').update({ is_published: !item.is_published }).eq('id', item.id);
    if (!error) {
      setMediaItems(prev => prev.map(m => m.id === item.id ? { ...m, is_published: !m.is_published } : m));
      toast.success(item.is_published ? 'Hidden from gallery' : 'Published to gallery');
    }
  };

  const deleteUser = async (u: AdminUserRow) => {
    if (u.id === user.id) { toast.error('Cannot delete own account'); return; }
    if (!window.confirm(`Delete "${u.full_name}"?`)) return;
    const { error } = await supabase.from('admin_users').delete().eq('id', u.id);
    if (!error) { setAdminUsers(prev => prev.filter(x => x.id !== u.id)); toast.success('Deleted'); }
  };

  const toggleActive = async (u: AdminUserRow) => {
    if (u.id === user.id) { toast.error('Cannot disable own account'); return; }
    const { error } = await supabase.from('admin_users').update({ is_active: !u.is_active }).eq('id', u.id);
    if (!error) setAdminUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_active: !x.is_active } : x));
  };

  const filteredApts = appointments.filter(a => {
    const s = searchTerm.toLowerCase();
    return (!s || a.patient_name?.toLowerCase().includes(s) || a.patient_phone?.includes(s)
      || (doctorLabels[a.doctor] || '').toLowerCase().includes(s))
      && (!statusFilter || a.status === statusFilter);
  });

  const mediaCats = ['All', ...MEDIA_CATEGORIES];
  const filteredMedia = mediaCategory === 'All' ? mediaItems
    : mediaCategory === 'Videos' ? mediaItems.filter(m => m.media_type === 'video')
    : mediaItems.filter(m => m.category === mediaCategory);

  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    approved: appointments.filter(a => a.status === 'approved').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    unread: messages.filter(m => !m.is_read).length,
    unreplied: messages.filter(m => !m.admin_reply).length,
  };

  const navItems = [
    { id: 'dashboard' as Tab, label: 'Dashboard', icon: LayoutDashboard, show: true },
    { id: 'appointments' as Tab, label: 'Appointments', icon: Calendar, show: true },
    { id: 'messages' as Tab, label: 'Messages', icon: MessageSquare, show: isMasterAdmin },
    { id: 'media' as Tab, label: 'Media Manager', icon: ImageIcon, show: isMasterAdmin },
    { id: 'users' as Tab, label: 'User Management', icon: Users, show: isMasterAdmin },
    { id: 'whatsapp' as Tab, label: 'WhatsApp', icon: MessageCircle, show: isMasterAdmin },
    { id: 'stories' as Tab, label: 'Patient Stories', icon: Heart, show: isMasterAdmin },
    { id: 'leave' as Tab, label: 'Leave Management', icon: CalendarOff, show: true },
    { id: 'flashnews' as Tab, label: 'Flash News', icon: Megaphone, show: isMasterAdmin },
    { id: 'settings' as Tab, label: 'My Settings', icon: Lock, show: true },
  ].filter(n => n.show);

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0A3D62] text-white flex-shrink-0 flex flex-col min-h-screen">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img src="/images/Logo.jpg" alt="ARVI" className="w-10 h-10 rounded-lg" />
            <div><p className="font-bold text-sm">ARVI Clinic</p><p className="text-blue-300 text-xs">Admin Panel</p></div>
          </div>
        </div>
        <div className="p-4 border-b border-white/10 bg-white/5">
          <p className="text-xs text-blue-300 uppercase tracking-widest mb-1">Logged in as</p>
          <p className="font-semibold text-sm">{user.full_name}</p>
          <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-[#0F9FA8]/30 text-blue-200">{roleLabels[user.role] || user.role}</span>
          {isClinicAssistant && <p className="text-xs text-amber-300 mt-1.5">Read-only access</p>}
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${tab === id ? 'bg-[#0F9FA8] text-white' : 'text-blue-200 hover:bg-white/10 hover:text-white'}`}>
              <Icon size={18} />{label}
              {id === 'appointments' && stats.pending > 0 && <span className="ml-auto bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{stats.pending}</span>}
              {id === 'messages' && stats.unread > 0 && <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{stats.unread}</span>}
              {id === 'whatsapp' && <span className={`ml-auto text-xs rounded-full px-2 py-0.5 ${waEnabled ? 'bg-green-500/30 text-green-300' : 'bg-gray-500/30 text-gray-400'}`}>{waEnabled ? 'ON' : 'OFF'}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10 space-y-1">
          <a href="/" className="flex items-center gap-2 text-blue-300 text-sm hover:text-white px-4 py-2"><ChevronRight size={16} />Back to Website</a>
          <button onClick={async () => { await authService.logout(); navigate('/login'); }}
            className="w-full flex items-center gap-2 text-blue-300 text-sm hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg">
            <LogOut size={16} />Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-2xl font-bold text-[#0A3D62] font-heading capitalize">{tab.replace('_', ' ')}</h1>
            <p className="text-gray-400 text-sm">ARVI Ortho & Child Care</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowChangePw(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50">
              <Lock size={15} />Change Password
            </button>
            <button onClick={() => { loadData(); if (tab === 'media') loadMedia(); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />Refresh
            </button>
          </div>
        </div>

        <div className="p-8">

          {/* DASHBOARD */}
          {tab === 'dashboard' && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { label: 'Total Appointments', value: stats.total, icon: Calendar, color: 'bg-[#0F9FA8]' },
                  { label: 'Pending', value: stats.pending, icon: Clock, color: 'bg-amber-500' },
                  { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'bg-[#3CB371]' },
                  { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'bg-blue-500' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="bg-white rounded-2xl p-6 shadow-card">
                    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4`}><Icon size={20} className="text-white" /></div>
                    <p className="text-3xl font-bold text-[#0A3D62]">{value}</p>
                    <p className="text-gray-500 text-sm mt-1">{label}</p>
                  </div>
                ))}
              </div>
              {isMasterAdmin && (
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="bg-white rounded-2xl shadow-card p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#25D366]/10 flex items-center justify-center"><MessageCircle size={20} className="text-[#25D366]" /></div>
                      <div>
                        <p className="font-bold text-[#0A3D62]">WhatsApp</p>
                        <p className="text-gray-400 text-xs">{waLogs.length} messages sent</p>
                      </div>
                    </div>
                    <button onClick={toggleWaEnabled} style={{ background: waEnabled ? '#25D366' : '#e5e7eb', color: waEnabled ? 'white' : '#6b7280' }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold">
                      {waEnabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}{waEnabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                  <div className="bg-white rounded-2xl shadow-card p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><MessageSquare size={20} className="text-blue-600" /></div>
                      <div>
                        <p className="font-bold text-[#0A3D62]">Messages</p>
                        <p className="text-gray-400 text-xs">{stats.unread} unread • {stats.unreplied} unreplied</p>
                      </div>
                    </div>
                    <button onClick={() => setTab('messages')} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-semibold hover:bg-blue-100">View All</button>
                  </div>
                </div>
              )}
              <div className="bg-white rounded-2xl shadow-card overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-bold text-lg text-[#0A3D62]">Recent Appointments</h2>
                  <button onClick={() => setTab('appointments')} className="text-sm text-[#0F9FA8] font-medium hover:underline">View All</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr>
                      {['Patient', 'Doctor', 'Date & Time', 'Status', 'WA'].map(h => (
                        <th key={h} className="px-6 py-4 text-left font-semibold text-gray-700">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {appointments.slice(0, 5).map(apt => (
                        <tr key={apt.id} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-6 py-4"><p className="font-semibold text-[#0A3D62]">{apt.patient_name}</p><p className="text-gray-500 text-xs">{apt.patient_phone}</p></td>
                          <td className="px-6 py-4 text-gray-700">{doctorLabels[apt.doctor] || apt.doctor}</td>
                          <td className="px-6 py-4 text-gray-700">{fmtDate(apt.appointment_date)} {apt.appointment_time}</td>
                          <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor[apt.status] || 'bg-gray-100 text-gray-600'}`}>{apt.status}</span></td>
                          <td className="px-6 py-4">{apt.whatsapp_sent ? <span className="text-xs text-[#25D366] font-semibold">✓</span> : <span className="text-gray-300 text-xs">–</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {appointments.length === 0 && <p className="px-6 py-12 text-center text-gray-400">No appointments yet</p>}
                </div>
              </div>
            </div>
          )}

          {/* APPOINTMENTS */}
          {tab === 'appointments' && (
            <div className="space-y-6">
              {isClinicAssistant && (
                <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                  <AlertCircle size={16} />Read-only access. Status changes not permitted for your role.
                </div>
              )}
              <div className="bg-white rounded-2xl shadow-card p-5">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input type="text" placeholder="Search patient, phone or doctor..." value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#0F9FA8] outline-none text-sm" />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {['', 'pending', 'approved', 'completed', 'rejected'].map(s => (
                      <button key={s || 'all'} onClick={() => setStatusFilter(s)}
                        className={`px-4 py-2.5 rounded-xl font-semibold text-sm capitalize transition-all ${statusFilter === s ? 'bg-[#0F9FA8] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                        {s || 'All'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                {filteredApts.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-card"><Calendar size={40} className="mx-auto mb-3 opacity-30" /><p>No appointments found</p></div>
                ) : filteredApts.map(apt => (
                  <div key={apt.id} className="bg-white rounded-2xl shadow-card p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-[#0A3D62]">{apt.patient_name}</h3>
                        <p className="text-gray-500 text-sm">{apt.patient_phone}</p>
                        {apt.patient_email && <p className="text-gray-400 text-xs">{apt.patient_email}</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${statusColor[apt.status] || 'bg-gray-100 text-gray-600'}`}>{apt.status}</span>
                        {apt.whatsapp_sent && <span className="px-3 py-1 text-xs bg-[#25D366]/10 text-[#25D366] rounded-full">WA ✓</span>}
                      </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-xl">
                      <div><p className="text-xs text-gray-500 font-semibold uppercase mb-1">Doctor</p><p className="text-sm font-semibold text-[#0A3D62]">{doctorLabels[apt.doctor] || apt.doctor}</p></div>
                      <div><p className="text-xs text-gray-500 font-semibold uppercase mb-1">Date & Time</p><p className="text-sm font-semibold text-[#0A3D62]">{fmtDate(apt.appointment_date)} — {apt.appointment_time}</p></div>
                      <div><p className="text-xs text-gray-500 font-semibold uppercase mb-1">Reason</p><p className="text-sm font-semibold text-[#0A3D62]">{apt.reason || 'General Consultation'}</p></div>
                    </div>
                    {canApprove && apt.status === 'pending' && (
                      <div className="flex gap-3 flex-wrap">
                        <button onClick={() => updateStatus(apt.id, 'approved')} className="flex-1 min-w-[120px] py-2.5 bg-[#3CB371] text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                          <CheckCircle size={16} />Approve{waEnabled ? ' + WA' : ''}
                        </button>
                        <button onClick={() => updateStatus(apt.id, 'rejected')} className="flex-1 min-w-[100px] py-2.5 bg-red-500 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                          <XCircle size={16} />Reject
                        </button>
                        <button onClick={() => updateStatus(apt.id, 'completed')} className="px-5 py-2.5 bg-blue-500 text-white rounded-xl font-semibold text-sm">Complete</button>
                      </div>
                    )}
                    {canApprove && apt.status === 'approved' && (
                      <div className="flex gap-3 flex-wrap">
                        <button onClick={() => updateStatus(apt.id, 'completed')} className="px-6 py-2.5 bg-blue-500 text-white rounded-xl font-semibold text-sm">Mark Completed</button>
                        <button onClick={() => resendWa(apt)}
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm ${apt.whatsapp_sent ? 'border border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10' : 'bg-[#25D366] text-white hover:bg-[#1da851]'}`}>
                          <MessageCircle size={15} />{apt.whatsapp_sent ? 'Resend WA' : 'Send WA'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MESSAGES */}
          {tab === 'messages' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-500 text-sm">{messages.length} total • {stats.unread} unread • {stats.unreplied} awaiting reply</p>
              </div>
              {messages.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-card"><MessageSquare size={40} className="mx-auto mb-3 opacity-30" /><p>No messages yet</p></div>
              ) : messages.map(msg => (
                <div key={msg.id} className={`rounded-2xl shadow-card overflow-hidden ${!msg.is_read ? 'bg-[#0F9FA8]/5 border border-[#0F9FA8]/20' : 'bg-white'}`}>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3 flex-wrap gap-3">
                      <div>
                        <h3 className="font-bold text-lg text-[#0A3D62]">{msg.name}</h3>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          {msg.email && <a href={`mailto:${msg.email}`} className="text-blue-500 text-xs hover:underline">{msg.email}</a>}
                          {msg.phone && <a href={`tel:${msg.phone}`} className="text-gray-500 text-xs">{msg.phone}</a>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {msg.admin_reply
                          ? <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">✓ Replied</span>
                          : <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">Awaiting Reply</span>
                        }
                        {!msg.is_read && <button onClick={() => markRead(msg.id)} className="px-3 py-1 bg-[#0F9FA8] text-white rounded-xl text-xs font-semibold">Mark Read</button>}
                      </div>
                    </div>
                    {msg.subject && <p className="font-semibold text-[#0A3D62] mb-1 text-sm">{msg.subject}</p>}
                    <p className="text-gray-600 text-sm leading-relaxed">{msg.message}</p>
                    <p className="text-xs text-gray-400 mt-2">{new Date(msg.created_at!).toLocaleString('en-IN')}</p>

                    {/* Show existing reply */}
                    {msg.admin_reply && (
                      <div className="mt-3 p-3 bg-green-50 rounded-xl border border-green-200">
                        <p className="text-xs text-green-600 font-semibold mb-1">Your Reply — {msg.replied_at ? new Date(msg.replied_at).toLocaleString('en-IN') : ''}</p>
                        <p className="text-sm text-gray-700">{msg.admin_reply}</p>
                      </div>
                    )}

                    {/* Reply button */}
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <button onClick={() => setReplyMsg(msg)} className="flex items-center gap-2 px-4 py-2 bg-[#0F9FA8]/10 text-[#0F9FA8] rounded-xl text-sm font-semibold hover:bg-[#0F9FA8]/20">
                        <Reply size={15} />{msg.admin_reply ? 'Edit Reply' : 'Reply'}
                      </button>
                      <button onClick={() => deleteMessage(msg.id)} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-500 rounded-xl text-sm font-semibold hover:bg-red-100">
                        <Trash2 size={15} />Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* MEDIA MANAGER */}
          {tab === 'media' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-card p-6">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <h2 className="text-lg font-bold text-[#0A3D62]">Upload Media</h2>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setShowGoogleModal(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 text-sm font-semibold hover:bg-blue-100">
                      <Globe size={16} />Add Google Image URL
                    </button>
                    <button onClick={loadMedia}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50">
                      <RefreshCw size={15} className={mediaLoading ? 'animate-spin' : ''} />Sync All Storage
                    </button>
                  </div>
                </div>
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center cursor-pointer hover:border-[#0F9FA8] hover:bg-[#0F9FA8]/5 transition-all"
                  onClick={() => mediaInputRef.current?.click()}>
                  <input ref={mediaInputRef} type="file" accept="image/*,video/mp4,video/webm,video/quicktime" multiple onChange={handleMediaUpload} className="hidden" />
                  {mediaUploading ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-2 border-[#0F9FA8]/30 border-t-[#0F9FA8] rounded-full animate-spin" />
                      <p className="text-[#0F9FA8] font-medium">Uploading...</p>
                    </div>
                  ) : (
                    <>
                      <Upload size={40} className="text-gray-300 mx-auto mb-3" />
                      <p className="font-semibold text-[#0A3D62] mb-1">Click to upload images or videos</p>
                      <p className="text-xs text-gray-400">JPG, PNG, GIF, WebP, MP4, MOV, WebM • Max 50MB each</p>
                    </>
                  )}
                </div>
              </div>

              {/* Category filter tabs */}
              <div className="flex flex-wrap gap-2">
                {mediaCats.map(c => {
                  const count = c === 'All' ? mediaItems.length
                    : c === 'Videos' ? mediaItems.filter(m => m.media_type === 'video').length
                    : mediaItems.filter(m => m.category === c).length;
                  return (
                    <button key={c} onClick={() => setMediaCategory(c)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${mediaCategory === c ? 'bg-[#0F9FA8] text-white' : 'bg-white shadow-card text-gray-600 hover:bg-[#0F9FA8]/10'}`}>
                      {c === 'Google Images' && <Globe size={13} />}
                      {c === 'Videos' && <Film size={13} />}
                      {c} <span className="opacity-60 text-xs">({count})</span>
                    </button>
                  );
                })}
              </div>

              {mediaLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-2 border-[#0F9FA8]/30 border-t-[#0F9FA8] rounded-full animate-spin" />
                    <p className="text-gray-500 text-sm">Loading all media & syncing storage...</p>
                  </div>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredMedia.map(item => (
                    <div key={item.id} className="bg-white rounded-2xl shadow-card overflow-hidden">
                      <div className="relative aspect-video bg-gray-100">
                        {item.media_type === 'video'
                          ? <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0A3D62] to-[#0F9FA8]"><Film size={32} className="text-white/60" /></div>
                          : <img src={item.media_url} alt={item.title} className="w-full h-full object-cover" loading="lazy"
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        }
                        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                          {item.category === 'Google Images' && <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-500 text-white flex items-center gap-0.5"><Globe size={9} />G</span>}
                          {item.media_type === 'video' && <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-500 text-white">VID</span>}
                        </div>
                        <div className="absolute top-2 right-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {item.is_published ? 'Live' : 'Hidden'}
                          </span>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-semibold text-[#0A3D62] truncate">{item.title}</p>
                        <div className="flex items-center gap-1 mt-0.5 mb-3">
                          <span className="text-xs text-gray-400">{item.category}</span>
                          <button onClick={() => setChangeCatItem(item)} className="text-xs text-[#0F9FA8] hover:underline ml-1 flex items-center gap-0.5">
                            <Tag size={10} />change
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => togglePin(item)} title={item.is_pinned ? 'Unpin' : 'Pin to top'}
                className={`p-1.5 rounded-lg transition-colors ${item.is_pinned ? 'text-amber-500 bg-amber-50' : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'}`}>
                {item.is_pinned ? <Pin size={14} /> : <PinOff size={14} />}
              </button>
              <button onClick={() => togglePublish(item)}
                            className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors ${item.is_published ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-[#0F9FA8]/10 text-[#0F9FA8] hover:bg-[#0F9FA8]/20'}`}>
                            {item.is_published ? 'Hide' : 'Publish'}
                          </button>
                          <button onClick={() => deleteMedia(item)} className="px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredMedia.length === 0 && (
                    <div className="col-span-full py-16 text-center text-gray-400">
                      <FolderOpen size={40} className="mx-auto mb-3 opacity-30" />
                      <p className="mb-1">No media in this category</p>
                      {mediaCategory === 'Google Images' && (
                        <button onClick={() => setShowGoogleModal(true)} className="mt-2 text-sm text-[#0F9FA8] font-medium hover:underline">+ Add Google Image URL</button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* WHATSAPP */}
          {tab === 'whatsapp' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#25D366]/10 flex items-center justify-center"><MessageCircle size={24} className="text-[#25D366]" /></div>
                    <div>
                      <h2 className="text-lg font-bold text-[#0A3D62]">WhatsApp Confirmations</h2>
                      <p className="text-gray-500 text-sm">Auto-send on appointment approval</p>
                    </div>
                  </div>
                  <button onClick={toggleWaEnabled}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${waEnabled ? 'bg-[#25D366] text-white hover:bg-[#1da851]' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
                    {waEnabled ? <><ToggleRight size={18} />Enabled</> : <><ToggleLeft size={18} />Disabled</>}
                  </button>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-1">
                  <p>1. Click <strong>Approve</strong> on any appointment → WhatsApp opens with pre-filled message</p>
                  <p>2. Click Send in WhatsApp → patient receives confirmation instantly</p>
                  <p>3. System logs the send and marks appointment as WA Sent</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-card p-6">
                <h3 className="font-bold text-[#0A3D62] mb-4">Message Preview</h3>
                <div className="bg-[#e8f5e9] rounded-2xl p-4 max-w-sm">
                  <div className="bg-white rounded-xl p-4 text-sm text-gray-700 whitespace-pre-line shadow-sm leading-relaxed">
                    {buildWaMessage({ id: '', patient_name: '[Patient Name]', patient_phone: '', doctor: 'dr-aravindasamy', appointment_date: '2025-06-01', appointment_time: '10:00 AM', status: 'approved' })}
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-card overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2"><History size={18} className="text-gray-400" /><h3 className="font-bold text-[#0A3D62]">Delivery Log</h3></div>
                  <span className="text-sm text-gray-400">{waLogs.length} total</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr>
                      {['Patient', 'Phone', 'Status', 'Sent At'].map(h => <th key={h} className="px-6 py-3 text-left font-semibold text-gray-700">{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {waLogs.map(log => (
                        <tr key={log.id} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-[#0A3D62]">{log.patient_name}</td>
                          <td className="px-6 py-4 text-gray-600">{log.patient_phone}</td>
                          <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${log.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{log.status}</span></td>
                          <td className="px-6 py-4 text-gray-500 text-xs">{new Date(log.created_at).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {waLogs.length === 0 && <p className="px-6 py-12 text-center text-gray-400">No messages sent yet</p>}
                </div>
              </div>
            </div>
          )}

          {/* USER MANAGEMENT */}
          {tab === 'users' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-gray-500 text-sm">{adminUsers.length} user(s)</p>
                <button onClick={() => { setEditUser(null); setShowUserModal(true); }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#0F9FA8] text-white rounded-xl font-semibold text-sm hover:bg-[#0a7a82]">
                  <Plus size={16} />Add User
                </button>
              </div>
              <div className="bg-white rounded-2xl shadow-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100"><tr>
                    {['Name', 'Username', 'Role', 'Access', 'Status', 'Actions'].map(h => <th key={h} className="px-6 py-4 text-left font-semibold text-gray-700">{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {adminUsers.map(u => (
                      <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-6 py-4"><p className="font-semibold text-[#0A3D62]">{u.full_name}</p><p className="text-xs text-gray-400">{u.email}</p></td>
                        <td className="px-6 py-4 font-mono text-sm text-gray-700">{u.username}</td>
                        <td className="px-6 py-4"><span className="px-3 py-1 bg-[#0F9FA8]/10 text-[#0A3D62] rounded-full text-xs font-medium">{roleLabels[u.role] || u.role}</span></td>
                        <td className="px-6 py-4 text-xs text-gray-500">
                          {u.role === 'master_admin' && 'Full Access'}
                          {u.role === 'doctor_aravind' && 'Aravind + Physio'}
                          {u.role === 'doctor_vishali' && 'Vishali + Physio'}
                          {u.role === 'clinic_assistant' && 'Read-only all Apts'}
                          {u.role === 'physiotherapist' && 'Physio only'}
                        </td>
                        <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button onClick={() => { setEditUser(u); setShowUserModal(true); }} className="p-2 text-gray-400 hover:text-[#0F9FA8] hover:bg-[#0F9FA8]/10 rounded-lg" title="Edit"><Edit2 size={15} /></button>
                            <button onClick={() => setChangePwTarget({ id: u.id, name: u.full_name })} className="p-2 text-gray-400 hover:text-[#0A3D62] hover:bg-[#0A3D62]/10 rounded-lg" title="Change Password"><Lock size={15} /></button>
                            <button onClick={() => toggleActive(u)} className={`p-2 rounded-lg ${u.is_active ? 'text-amber-500 hover:bg-amber-50' : 'text-green-500 hover:bg-green-50'}`}>
                              {u.is_active ? <UserX size={15} /> : <UserCheck size={15} />}
                            </button>
                            <button onClick={() => deleteUser(u)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SETTINGS */}

          {/* PATIENT STORIES */}
          {tab === 'stories' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-card p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div><h2 className="text-xl font-bold text-[#0A3D62]">Patient Stories</h2><p className="text-gray-500 text-sm">{stories.length} stories</p></div>
                  <button onClick={() => setShowAddStory(true)} className="flex items-center gap-2 px-4 py-2 bg-[#0F9FA8] text-white rounded-xl text-sm font-semibold"><Plus size={16} />Add Patient Story</button>
                </div>
                {showAddStory && (
                  <div className="mb-6 p-4 rounded-2xl border-2 border-[#0F9FA8]/30 bg-[#0F9FA8]/5">
                    <h3 className="font-bold text-[#0A3D62] mb-4">New Patient Story</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Patient Name *</label><input value={addStoryName} onChange={e=>setAddStoryName(e.target.value)} placeholder="e.g. Rajesh Kumar" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F9FA8]/30" /></div>
                      <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Treatment *</label><input value={addStoryTreatment} onChange={e=>setAddStoryTreatment(e.target.value)} placeholder="e.g. Knee Replacement" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F9FA8]/30" /></div>
                    </div>
                    <div className="mb-4"><label className="text-xs font-semibold text-gray-600 mb-1 block">Description (optional)</label><textarea value={addStoryDesc} onChange={e=>setAddStoryDesc(e.target.value)} placeholder="Patient journey..." rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F9FA8]/30 resize-none" /></div>
                    <div className="flex gap-3"><button onClick={addPatientStory} disabled={addStoryLoading} className="px-5 py-2 bg-[#0F9FA8] text-white rounded-xl text-sm font-semibold disabled:opacity-50">{addStoryLoading?'Creating...':'Create Story'}</button><button onClick={()=>{setShowAddStory(false);setAddStoryName('');setAddStoryTreatment('');setAddStoryDesc('');}} className="px-5 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold">Cancel</button></div>
                  </div>
                )}
                {storiesLoading && <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-[#0F9FA8]/30 border-t-[#0F9FA8] rounded-full animate-spin" /></div>}
                {!storiesLoading && stories.length === 0 && <div className="text-center py-12 text-gray-400"><Heart size={40} className="mx-auto mb-3 opacity-20" /><p>No patient stories yet.</p></div>}
                <div className="space-y-4">
                  {stories.map(story => (
                    <div key={story.id} className="rounded-2xl border border-gray-200 overflow-hidden">
                      <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 cursor-pointer" onClick={()=>setExpandedStory(expandedStory===story.id?null:story.id)}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0F9FA8] to-[#0A3D62] flex items-center justify-center text-white font-bold flex-shrink-0">{story.patient_name.charAt(0).toUpperCase()}</div>
                          <div className="min-w-0"><p className="font-bold text-[#0A3D62] truncate">{story.patient_name}</p><span className="text-xs px-2 py-0.5 rounded-full bg-[#0F9FA8]/10 text-[#0F9FA8] font-semibold">{story.treatment}</span></div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold hidden sm:inline ${story.is_published?'bg-green-100 text-green-600':'bg-gray-200 text-gray-500'}`}>{story.is_published?'Published':'Hidden'}</span>
                          <button onClick={e=>{e.stopPropagation();toggleStoryPublish(story);}} className="p-1.5 rounded-lg text-gray-400 hover:text-[#0F9FA8]">{story.is_published?<Eye size={15}/>:<EyeOff size={15}/>}</button>
                          <button onClick={e=>{e.stopPropagation();deleteStory(story.id);}} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500"><Trash2 size={15}/></button>
                          {expandedStory===story.id?<ChevronUp size={16} className="text-gray-400"/>:<ChevronDown size={16} className="text-gray-400"/>}
                        </div>
                      </div>
                      {expandedStory === story.id && (
                        <div className="p-3 sm:p-4 border-t border-gray-200">
                          {story.description && <p className="text-gray-600 text-sm mb-4">{story.description}</p>}
                          <div className="mb-4">
                            <label className="flex items-center gap-2 px-4 py-2.5 bg-[#0A3D62]/5 border-2 border-dashed border-[#0A3D62]/20 rounded-xl cursor-pointer hover:bg-[#0A3D62]/10 w-fit">
                              <Plus size={16} className="text-[#0A3D62]" />
                              <span className="text-sm font-semibold text-[#0A3D62]">{storyUploadingId===story.id?'Uploading...':'Upload Files'}</span>
                              <input type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx" className="hidden" disabled={storyUploadingId===story.id} onChange={e=>uploadStoryMedia(story.id,e)} />
                            </label>
                            <p className="text-xs text-gray-400 mt-1">JPG, PNG, MP4, PDF, DOCX · up to 200MB</p>
                          </div>
                          {story.media && story.media.length > 0 ? (
                            <div className="space-y-2">
                              {story.media.map((m,idx) => (
                                <div key={m.id} className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white group">
                                  <span className="text-xs text-gray-400 w-5 text-center flex-shrink-0">{m.is_pinned?'📌':idx+1}</span>
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${m.media_type==='pdf'?'bg-red-50':m.media_type==='doc'?'bg-blue-50':m.media_type==='video'?'bg-purple-50':'bg-teal-50'}`}>
                                    {m.media_type==='pdf'?<FileText size={16} className="text-red-500"/>:m.media_type==='doc'?<FileText size={16} className="text-blue-500"/>:m.media_type==='video'?<Play size={16} className="text-purple-500"/>:<ImageIcon size={16} className="text-[#0F9FA8]"/>}
                                  </div>
                                  <a href={m.media_url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[#0A3D62] truncate">{m.file_name||'File'}</p>
                                    <p className="text-xs text-gray-400 uppercase">{m.media_type}</p>
                                  </a>
                                  {m.media_type==='image'&&<img src={m.media_url} alt="preview" className="w-8 h-8 rounded-lg object-cover border border-gray-200 flex-shrink-0" loading="lazy"/>}
                                  <button onClick={()=>toggleStoryMediaPin(story.id,m)} className={`p-1.5 rounded-lg flex-shrink-0 ${m.is_pinned?'text-amber-500':'text-gray-300 hover:text-amber-500 opacity-0 group-hover:opacity-100'}`}>{m.is_pinned?<Pin size={13}/>:<PinOff size={13}/>}</button>
                                  <button onClick={()=>deleteStoryMedia(story.id,m.id,m.media_url)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 flex-shrink-0"><Trash2 size={13}/></button>
                                </div>
                              ))}
                            </div>
                          ) : <p className="text-gray-400 text-sm italic">No files yet.</p>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* LEAVE MANAGEMENT */}
          {tab === 'leave' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Calendar */}
                <div>
                  <h3 className="font-bold text-[#0A3D62] mb-3">Leave Calendar</h3>
                  <LeaveCalendar
                    leaves={leaves.map(l => ({ ...l, userName: SPECIALIST_OPTIONS.find(s => s.value === l.specialist)?.label }))}
                    onDateClick={date => {
                      if (!leaveForm.start_date || (leaveForm.start_date && leaveForm.end_date)) {
                        setLeaveForm(p => ({ ...p, start_date: date, end_date: date }));
                      } else {
                        const s = date < leaveForm.start_date ? date : leaveForm.start_date;
                        const e = date >= leaveForm.start_date ? date : leaveForm.start_date;
                        setLeaveForm(p => ({ ...p, start_date: s, end_date: e }));
                      }
                    }}
                    selectedStart={leaveForm.start_date}
                    selectedEnd={leaveForm.end_date}
                  />
                  <p className="text-xs text-gray-400 mt-2">Click a date to set start, click again to set end date.</p>
                </div>

                {/* Form */}
                <div className="bg-white rounded-2xl shadow-card p-4 sm:p-5">
                  <h2 className="text-lg font-bold text-[#0A3D62] mb-4">{editLeaveId ? 'Edit Leave' : 'Apply Leave / Holiday'}</h2>
                  <div className="space-y-4">

                    {/* 1. Specialist */}
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Select Specialist *</label>
                      <select value={leaveForm.specialist}
                        onChange={e => setLeaveForm(p => ({ ...p, specialist: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F9FA8]/30">
                        <option value="">-- Select Specialist --</option>
                        {allowedSpecialists.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* 2. Dates */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1 block">Start Date *</label>
                        <input type="date" value={leaveForm.start_date}
                          min={today}
                          onChange={e => setLeaveForm(p => ({ ...p, start_date: e.target.value, end_date: p.end_date || e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F9FA8]/30" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1 block">End Date *</label>
                        <input type="date" value={leaveForm.end_date} min={leaveForm.start_date}
                          onChange={e => setLeaveForm(p => ({ ...p, end_date: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F9FA8]/30" />
                      </div>
                    </div>

                    {/* 3. Duration */}
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Duration</label>
                      <div className="flex gap-6">
                        <label className="flex items-center gap-2 cursor-pointer text-sm">
                          <input type="radio" checked={leaveForm.full_day} onChange={() => setLeaveForm(p => ({ ...p, full_day: true }))} />
                          Full Day
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-sm">
                          <input type="radio" checked={!leaveForm.full_day} onChange={() => setLeaveForm(p => ({ ...p, full_day: false }))} />
                          Half Day
                        </label>
                      </div>
                    </div>

                    {/* 4. Half day options */}
                    {!leaveForm.full_day && (
                      <div className="space-y-3 pl-3 border-l-2 border-[#0F9FA8]/30">
                        <div>
                          <label className="text-xs font-semibold text-gray-600 mb-1 block">Half Day Period</label>
                          <div className="flex gap-6">
                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                              <input type="radio" checked={leaveForm.half_day_period === 'first_half'} onChange={() => setLeaveForm(p => ({ ...p, half_day_period: 'first_half' }))} />
                              First Half (Morning)
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                              <input type="radio" checked={leaveForm.half_day_period === 'second_half'} onChange={() => setLeaveForm(p => ({ ...p, half_day_period: 'second_half' }))} />
                              Second Half (Afternoon)
                            </label>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-600 mb-1 block">Unavailability Time Range (optional)</label>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">From</label>
                              <input type="time" value={leaveForm.time_from}
                                onChange={e => setLeaveForm(p => ({ ...p, time_from: e.target.value }))}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F9FA8]/30" />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">To</label>
                              <input type="time" value={leaveForm.time_to}
                                onChange={e => setLeaveForm(p => ({ ...p, time_to: e.target.value }))}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F9FA8]/30" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 5. Reason */}
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Reason (optional)</label>
                      <input value={leaveForm.reason} onChange={e => setLeaveForm(p => ({ ...p, reason: e.target.value }))}
                        placeholder="e.g. Medical conference, Personal leave..."
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F9FA8]/30" />
                    </div>

                    <div className="flex gap-3 pt-1">
                      <button onClick={() => saveLeave(false)}
                        className="flex-1 px-5 py-2.5 bg-[#0A3D62] text-white rounded-xl text-sm font-semibold hover:bg-[#0A3D62]/90">
                        {editLeaveId ? 'Update Leave' : 'Save Leave'}
                      </button>
                      {editLeaveId && (
                        <button onClick={resetLeaveForm}
                          className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold">
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Leave Records */}
              <div className="bg-white rounded-2xl shadow-card p-4 sm:p-6">
                <h3 className="font-bold text-[#0A3D62] mb-4">Leave Records ({leaves.length})</h3>
                {leavesLoading ? (
                  <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-[#0F9FA8]/30 border-t-[#0F9FA8] rounded-full animate-spin"/></div>
                ) : leaves.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">No leave records yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] text-sm">
                      <thead><tr className="border-b border-gray-200">
                        {['Specialist','Dates','Duration','Reason','Status','Actions'].map(h => (
                          <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {leaves.map((l, i) => {
                          const spLabel = SPECIALIST_OPTIONS.find(s => s.value === l.specialist)?.label || l.specialist;
                          const isHoliday = l.specialist === 'clinic_holiday';
                          const opt = SPECIALIST_OPTIONS.find(s => s.value === l.specialist);
                          const canAct = opt ? opt.roles.includes(currentUserRole) : false;
                          return (
                            <tr key={l.id} className={i%2===0?'':'bg-gray-50/50'}>
                              <td className="py-2.5 px-3">
                                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${isHoliday?'bg-red-100 text-red-600':'bg-amber-100 text-amber-700'}`}>
                                  {spLabel}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap text-xs">
                                {l.start_date === l.end_date ? fmtDate(l.start_date) : `${fmtDate(l.start_date)} – ${fmtDate(l.end_date)}`}
                              </td>
                              <td className="py-2.5 px-3 text-gray-500 text-xs">
                                {l.full_day ? 'Full Day' : `Half (${l.half_day_period==='first_half'?'AM':'PM'})${l.time_from&&l.time_to?' '+l.time_from+'–'+l.time_to:''}`}
                              </td>
                              <td className="py-2.5 px-3 text-gray-500 text-xs max-w-[120px] truncate">{l.reason||'—'}</td>
                              <td className="py-2.5 px-3">
                                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${l.status==='active'?'bg-green-100 text-green-600':'bg-gray-100 text-gray-500'}`}>
                                  {l.status==='active'?'Active':'Cancelled'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-1">
                                  {l.status==='active' && canAct && (
                                    <button onClick={() => cancelLeave(l.id)} title="Cancel Leave"
                                      className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg">
                                      <XCircle size={14}/>
                                    </button>
                                  )}
                                  {l.status==='active' && canAct && (
                                    <button title="Edit"
                                      onClick={() => { setEditLeaveId(l.id); setLeaveForm({ specialist:l.specialist, start_date:l.start_date, end_date:l.end_date, full_day:l.full_day, half_day_period:l.half_day_period||'first_half', time_from:l.time_from||'', time_to:l.time_to||'', reason:l.reason||'' }); }}
                                      className="p-1.5 text-gray-400 hover:text-[#0F9FA8] hover:bg-[#0F9FA8]/10 rounded-lg">
                                      <Edit2 size={14}/>
                                    </button>
                                  )}
                                  {isMasterAdmin && (
                                    <button onClick={() => deleteLeave(l.id)} title="Delete"
                                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                                      <Trash2 size={14}/>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ── Approval Leave Warning Modal ──────────────────────────────────── */}
              {approvalLeaveWarning && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <AlertCircle size={24} className="text-amber-600"/>
                      </div>
                      <div>
                        <h3 className="font-bold text-[#0A3D62] text-lg">Leave Conflict Warning</h3>
                        <p className="text-xs text-gray-500">This appointment was booked during a leave period</p>
                      </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                      <p className="text-sm font-semibold text-amber-800 mb-1">
                        ⚠️ {approvalLeaveWarning.leaveInfo}
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-3 mb-5 text-sm space-y-1">
                      <p><span className="font-semibold text-gray-600">Patient:</span> {approvalLeaveWarning.apt.patient_name}</p>
                      <p><span className="font-semibold text-gray-600">Date:</span> {fmtDate(approvalLeaveWarning.apt.appointment_date)} at {approvalLeaveWarning.apt.appointment_time}</p>
                      <p><span className="font-semibold text-gray-600">Doctor:</span> {doctorLabels[approvalLeaveWarning.apt.doctor] || approvalLeaveWarning.apt.doctor}</p>
                    </div>

                    <p className="text-sm text-gray-600 mb-5">
                      Do you still want to approve this appointment? The patient will receive a WhatsApp confirmation. Consider contacting them to discuss rescheduling.
                    </p>

                    <div className="flex gap-3">
                      <button onClick={() => setApprovalLeaveWarning(null)}
                        className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200">
                        Cancel
                      </button>
                      <button onClick={() => performApproval(approvalLeaveWarning.apt.id)}
                        className="flex-1 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600">
                        Approve Anyway
                      </button>
                    </div>
                  </div>
                </div>
              )}

      {/* Conflict Warning Modal */}
              {showLeaveWarning && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <AlertCircle size={20} className="text-amber-600"/>
                      </div>
                      <div>
                        <h3 className="font-bold text-[#0A3D62]">Confirmed Appointments Found</h3>
                        <p className="text-xs text-gray-500">{leaveConflicts.length} appointment{leaveConflicts.length>1?'s':''} booked during this period</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Please notify each patient before proceeding. Use WhatsApp, Email, or Call.</p>
                    <div className="space-y-3 mb-5">
                      {leaveConflicts.map(a => {
                        const spLabel = SPECIALIST_OPTIONS.find(s => s.value === leaveForm.specialist)?.label || leaveForm.specialist;
                        const msgText = `Hello ${a.patient_name},

Your appointment with ${spLabel} on ${fmtDate(a.appointment_date)} at ${a.appointment_time} has been cancelled due to leave.

Kindly reply with your preferred new date and time to reschedule.

Contact: +91 96770 80778

Sorry for the inconvenience.
ARVI Ortho & Child Care`;
                        const waMsg = encodeURIComponent(msgText);
                        const emailSubj = encodeURIComponent('Appointment Cancellation — ' + fmtDate(a.appointment_date));
                        const emailBody = encodeURIComponent(msgText);
                        const ph = (a.patient_phone||'').replace(/\D/g,'');
                        return (
                          <div key={a.id} className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                            <p className="text-sm font-semibold text-[#0A3D62]">{a.patient_name}</p>
                            <p className="text-xs text-gray-500 mb-2">{fmtDate(a.appointment_date)} at {a.appointment_time} &bull; {a.patient_phone}</p>
                            <div className="flex flex-wrap gap-2">
                              <a href={`https://wa.me/${ph}?text=${waMsg}`} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-[#25D366] text-white rounded-lg text-xs font-semibold">
                                <MessageCircle size={12}/> WhatsApp
                              </a>
                              {a.patient_email && (
                                <a href={`mailto:${a.patient_email}?subject=${emailSubj}&body=${emailBody}`}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-semibold">
                                  <Send size={12}/> Email
                                </a>
                              )}
                              <a href={`tel:${a.patient_phone}`}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-[#0A3D62] text-white rounded-lg text-xs font-semibold">
                                <Phone size={12}/> Call
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setShowLeaveWarning(false)}
                        className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold">
                        Go Back
                      </button>
                      <button onClick={() => saveLeave(true)}
                        className="flex-1 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold">
                        Apply Leave Anyway
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {leaveWaSaved && leaveConflicts.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <p className="font-semibold text-amber-700 mb-1">Reminder: Notify Affected Patients</p>
                  <p className="text-sm text-amber-600 mb-2">Leave saved. Please ensure all {leaveConflicts.length} patient{leaveConflicts.length>1?'s have':' has'} been notified.</p>
                  <button onClick={() => { setLeaveWaSaved(null); setLeaveConflicts([]); }} className="text-xs text-amber-500 hover:underline">Dismiss</button>
                </div>
              )}
            </div>
          )}

          {/* FLASH NEWS */}
          {tab === 'flashnews' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-card p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#0F9FA8]/10 flex items-center justify-center"><Megaphone size={20} className="text-[#0F9FA8]"/></div>
                  <div><h2 className="text-xl font-bold text-[#0A3D62]">Flash News Manager</h2><p className="text-gray-500 text-sm">Broadcast announcements across the website</p></div>
                  {flashNews?.is_active && <span className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-600 rounded-full text-xs font-semibold"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>LIVE</span>}
                </div>

                {/* Current status banner */}
                {flashNews?.is_active && flashNews.message && (
                  <div className="mb-5 p-3 bg-[#0A3D62] rounded-xl text-white text-sm overflow-hidden">
                    <p className="text-xs text-white/60 mb-1">Currently displaying:</p>
                    <p className="font-medium truncate">📢 {flashNews.message}</p>
                  </div>
                )}

                {/* Message input */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-gray-600">Flash Message *</label>
                    <span className="text-xs text-gray-400">{flashMsg.length} chars</span>
                  </div>
                  <textarea value={flashMsg} onChange={e=>setFlashMsg(e.target.value)} rows={3}
                    placeholder="e.g. Appointments unavailable on Sunday due to maintenance. 📢"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F9FA8]/30 resize-none" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Scroll Speed</label>
                    <select value={flashSpeed} onChange={e=>setFlashSpeed(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F9FA8]/30">
                      <option value="slow">Slow</option>
                      <option value="normal">Normal</option>
                      <option value="fast">Fast</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Theme</label>
                    <select value={flashTheme} onChange={e=>setFlashTheme(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F9FA8]/30">
                      <option value="default">Default (Dark Blue)</option>
                      <option value="emergency">Emergency (Red)</option>
                      <option value="info">Info (Teal)</option>
                      <option value="success">Success (Green)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Font Size</label>
                    <select value={flashFontSize} onChange={e=>setFlashFontSize(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F9FA8]/30">
                      <option value="normal">Normal (14px)</option>
                      <option value="medium">Medium (16px)</option>
                      <option value="large">Large (18px)</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-5">
                  <div className="sm:col-span-4">
                    <label className="text-xs font-semibold text-gray-600 mb-2 block">Font Style</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {([
                        { value: 'inter',     label: 'Inter',     sample: 'Aa Breaking News' },
                        { value: 'poppins',   label: 'Poppins',   sample: 'Aa Breaking News' },
                        { value: 'merriweather', label: 'Merriweather', sample: 'Aa Breaking News' },
                        { value: 'roboto-mono',  label: 'Mono',    sample: 'Aa Breaking News' },
                      ] as const).map(f => (
                        <button key={f.value} type="button"
                          onClick={() => setFlashFontStyle(f.value)}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${flashFontStyle === f.value ? 'border-[#0F9FA8] bg-[#0F9FA8]/5' : 'border-gray-200 hover:border-[#0F9FA8]/40'}`}>
                          <p className="text-xs font-semibold text-gray-500 mb-1">{f.label}</p>
                          <p className="text-sm text-[#0A3D62] truncate" style={{ fontFamily: f.value === 'inter' ? 'Inter,sans-serif' : f.value === 'poppins' ? 'Poppins,sans-serif' : f.value === 'merriweather' ? 'Merriweather,serif' : 'Roboto Mono,monospace' }}>{f.sample}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Preview */}
                {flashMsg.trim() && (
                  <div className="mb-5">
                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Preview</p>
                    <div className={`rounded-xl overflow-hidden flex items-center ${flashTheme==='emergency'?'bg-red-600':flashTheme==='info'?'bg-[#0F9FA8]':flashTheme==='success'?'bg-green-600':'bg-[#0A3D62]'}`}>
                      <div className="px-3 py-2 flex items-center gap-1.5 border-r border-white/20 flex-shrink-0" style={{background:'rgba(0,0,0,0.15)'}}>
                        <Megaphone size={12} className="text-white"/><span className="text-white text-xs font-bold">Flash News</span>
                      </div>
                      <p className="text-white text-sm px-4 py-2 truncate">📢 {flashMsg}</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <button onClick={()=>saveFlashNews(true)} disabled={flashLoading||!flashMsg.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#0F9FA8] text-white rounded-xl text-sm font-semibold hover:bg-[#0F9FA8]/90 disabled:opacity-50">
                    <Zap size={16}/>{flashLoading?'Saving...':flashNews?.is_active?'Update & Broadcast':'Start Broadcasting'}
                  </button>
                  {flashNews?.is_active && (
                    <button onClick={()=>saveFlashNews(false)} disabled={flashLoading}
                      className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-500 rounded-xl text-sm font-semibold hover:bg-red-100 border border-red-200">
                      <BellOff size={16}/>Stop Broadcasting
                    </button>
                  )}
                </div>
              </div>

              {flashNews && (
                <div className="bg-white rounded-2xl shadow-card p-4 sm:p-6">
                  <h3 className="font-bold text-[#0A3D62] mb-3">Status</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'Status', value: flashNews.is_active ? 'LIVE' : 'Stopped', color: flashNews.is_active ? 'text-green-600' : 'text-gray-400' },
                      { label: 'Speed', value: flashNews.speed || 'normal', color: 'text-[#0A3D62]' },
                      { label: 'Theme', value: flashNews.theme || 'default', color: 'text-[#0A3D62]' },
                      { label: 'Last Updated', value: flashNews.updated_at ? new Date(flashNews.updated_at).toLocaleDateString('en-IN') : '-', color: 'text-gray-500' },
                    ].map(item => (
                      <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                        <p className={`text-sm font-bold capitalize ${item.color}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {tab === 'settings' && (
            <div className="max-w-xl space-y-6">
              <div className="bg-white rounded-2xl shadow-card p-6">
                <h2 className="text-lg font-bold text-[#0A3D62] mb-4">My Profile</h2>
                <div className="space-y-3">
                  {[{ label: 'Full Name', value: user.full_name }, { label: 'Username', value: user.username }, { label: 'Email', value: user.email }].map(({ label, value }) => (
                    <div key={label} className="flex justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-500 text-sm">{label}</span>
                      <span className="font-semibold text-[#0A3D62] text-sm">{value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-3">
                    <span className="text-gray-500 text-sm">Role</span>
                    <span className="px-3 py-0.5 bg-[#0F9FA8]/10 rounded-full text-[#0A3D62] text-xs font-semibold">{roleLabels[user.role]}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-card p-6">
                <h2 className="text-lg font-bold text-[#0A3D62] mb-2">Security</h2>
                <p className="text-gray-500 text-sm mb-4">Change your login password.</p>
                <button onClick={() => setShowChangePw(true)} className="flex items-center gap-2 px-5 py-2.5 bg-[#0A3D62] text-white rounded-xl font-semibold text-sm hover:bg-[#083152]">
                  <Lock size={16} />Change Password
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Modals */}
      {showChangePw && <ChangePasswordModal userId={user.id} onClose={() => setShowChangePw(false)} />}
      {changePwTarget && <ChangePasswordModal userId={changePwTarget.id} targetName={changePwTarget.name} onClose={() => setChangePwTarget(null)} />}
      {showUserModal && <UserModal user={editUser} onClose={() => { setShowUserModal(false); setEditUser(null); }} onSave={loadData} />}
      {showGoogleModal && <AddGoogleImageModal onClose={() => setShowGoogleModal(false)} onAdded={item => setMediaItems(prev => [item, ...prev])} />}
      {replyMsg && (
        <ReplyModal
          msg={replyMsg}
          onClose={() => setReplyMsg(null)}
          onReplied={(id, reply) => setMessages(prev => prev.map(m => m.id === id ? { ...m, admin_reply: reply, replied_at: new Date().toISOString(), is_read: true } : m))}
        />
      )}
      {changeCatItem && (
        <ChangeCategoryModal
          item={changeCatItem}
          onClose={() => setChangeCatItem(null)}
          onChanged={(id, cat) => setMediaItems(prev => prev.map(m => m.id === id ? { ...m, category: cat } : m))}
        />
      )}
    </div>
  );
}

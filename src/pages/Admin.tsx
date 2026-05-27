import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, MessageSquare, LogOut, RefreshCw,
  CheckCircle, XCircle, Clock, ChevronRight, Search, Upload,
  Image as ImageIcon, Film, Trash2, Users, Lock, Eye, EyeOff,
  Plus, Edit2, UserCheck, UserX, AlertCircle, X, Globe,
  MessageCircle, ToggleLeft, ToggleRight, History, Send, Reply,
  Tag, FolderOpen
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { authService } from '../lib/auth';
import { toast } from '../lib/toast';

type Tab = 'dashboard' | 'appointments' | 'messages' | 'media' | 'users' | 'settings' | 'whatsapp';

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
  media_type: string; thumbnail_url?: string; is_published?: boolean; created_at?: string;
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
  // Plain unicode string — emojis are native JS strings, no encoding issues
  return [
    `Hello ${apt.patient_name},`,
    ``,
    `✅ Your appointment has been *confirmed* successfully!`,
    ``,
    `📅 *Date:* ${dateStr}`,
    `🕐 *Time:* ${apt.appointment_time}`,
    `👨‍⚕️ *Doctor:* ${doctorName}`,
    `🏥 *Clinic:* ${CLINIC_NAME}`,
    ``,
    `Please arrive 10 minutes before your scheduled time.`,
    ``,
    `For queries, call us at ${CLINIC_PHONE}.`,
    ``,
    `Thank you for choosing ${CLINIC_NAME}. We look forward to seeing you! 🙏`,
  ].join('\n');
}

function cleanPhone(raw: string): string {
  let p = raw.replace(/\D/g, '');
  if (p.startsWith('0')) p = p.slice(1);
  if (!p.startsWith('91') && p.length === 10) p = '91' + p;
  return p;
}

// Validate no broken unicode replacement characters exist
function hasCorruptChars(str: string): boolean {
  return str.includes('\uFFFD') || /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(str);
}

async function sendWhatsAppMessage(apt: Appointment): Promise<{ success: boolean; error?: string }> {
  const message = buildWaMessage(apt);

  // Validate message integrity before sending
  if (hasCorruptChars(message)) {
    console.error('WA message contains corrupt characters — aborted');
    return { success: false, error: 'Message contains invalid characters' };
  }

  const phone = cleanPhone(apt.patient_phone);
  if (!phone || phone.length < 10) {
    return { success: false, error: 'Invalid phone number' };
  }

  // Use encodeURIComponent — handles all Unicode/emoji correctly for wa.me
  const encoded = encodeURIComponent(message);
  const waUrl = `https://wa.me/${phone}?text=${encoded}`;

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

  window.open(waUrl, '_blank', 'noopener,noreferrer');
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

  // Auto-delete appointments older than 7 days from appointment_date
  const autoDeleteOldAppointments = useCallback(async () => {
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      const cutoffStr = cutoff.toISOString().split('T')[0]; // YYYY-MM-DD
      await supabase
        .from('appointments')
        .delete()
        .lt('appointment_date', cutoffStr);
    } catch { /* non-fatal — silently ignore */ }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Run auto-delete silently before loading
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

  // ── Media load: fetch ALL gallery_items + sync storage buckets ────────────
  const loadMedia = useCallback(async () => {
    if (!isMasterAdmin) return;
    setMediaLoading(true);
    try {
      // Primary: fetch all gallery_items (no filter — show ALL including hidden)
      const { data: dbItems, error: dbErr } = await supabase
        .from('gallery_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbErr) throw new Error('DB error: ' + dbErr.message);

      const existingUrls = new Set((dbItems || []).map((i: MediaItem) => i.media_url));
      const toInsert: any[] = [];

      // Secondary: scan storage buckets for files not yet in DB
      try {
        const [imgResult, vidResult] = await Promise.all([
          supabase.storage.from('clinic-images').list('', { limit: 500, offset: 0 }),
          supabase.storage.from('clinic-videos').list('', { limit: 500, offset: 0 }),
        ]);

        for (const file of (imgResult.data || [])) {
          if (!file.name || file.name === '.emptyFolderPlaceholder') continue;
          const { data: u } = supabase.storage.from('clinic-images').getPublicUrl(file.name);
          if (u?.publicUrl && !existingUrls.has(u.publicUrl)) {
            existingUrls.add(u.publicUrl);
            toInsert.push({
              title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
              category: 'Clinic', media_url: u.publicUrl, media_type: 'image', is_published: true,
            });
          }
        }
        for (const file of (vidResult.data || [])) {
          if (!file.name || file.name === '.emptyFolderPlaceholder') continue;
          const { data: u } = supabase.storage.from('clinic-videos').getPublicUrl(file.name);
          if (u?.publicUrl && !existingUrls.has(u.publicUrl)) {
            existingUrls.add(u.publicUrl);
            toInsert.push({
              title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
              category: 'Videos', media_url: u.publicUrl, media_type: 'video', is_published: true,
            });
          }
        }
      } catch { /* storage scan is best-effort */ }

      // Insert newly discovered items into DB
      let synced: MediaItem[] = [];
      if (toInsert.length > 0) {
        const { data: ins } = await supabase.from('gallery_items').insert(toInsert).select();
        synced = ins || [];
        if (synced.length > 0) toast.info(`${synced.length} new file(s) synced from storage`);
      }

      // Final list: dedup by URL
      const allItems = [...(dbItems || []), ...synced];
      const seen = new Set<string>();
      const deduped: MediaItem[] = [];
      for (const item of allItems) {
        if (!seen.has(item.media_url)) { seen.add(item.media_url); deduped.push(item); }
      }
      setMediaItems(deduped);
    } catch (err: any) {
      toast.error('Media load failed: ' + (err.message || 'unknown error'));
    }
    setMediaLoading(false);
  }, [isMasterAdmin]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { if (tab === 'media') loadMedia(); }, [tab, loadMedia]);

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('appointments')
      .update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast.error('Failed to update status'); return; }
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    toast.success(`Appointment ${newStatus}`);

    if (newStatus === 'approved' && waEnabled) {
      const apt = appointments.find(a => a.id === id);
      if (apt && !apt.whatsapp_sent) {
        const result = await sendWhatsAppMessage({ ...apt, status: 'approved' });
        if (result.success) {
          setAppointments(prev => prev.map(a => a.id === id ? { ...a, whatsapp_sent: true } : a));
          toast.success(`WhatsApp opened for ${apt.patient_name}`);
        }
      }
    }
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
    if (!window.confirm("Are you sure you want to delete this message? This cannot be undone.")) return;
    const { error } = await supabase.from("contact_messages").delete().eq("id", id);
    if (error) { toast.error("Failed to delete message"); return; }
    setMessages(prev => prev.filter(m => m.id !== id));
    toast.success("Message deleted");
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

                    {/* Action buttons */}
                    <div className="mt-3 flex items-center gap-2">
                      <button onClick={() => setReplyMsg(msg)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#0F9FA8]/10 text-[#0F9FA8] rounded-xl text-sm font-semibold hover:bg-[#0F9FA8]/20 transition-colors">
                        <Reply size={15} />{msg.admin_reply ? 'Edit Reply' : 'Reply'}
                      </button>
                      <button onClick={() => deleteMessage(msg.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-500 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors">
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
                            <button onClick={() => { setEditUser(u); setShowUserModal(true); }} className="p-2 text-gray-400 hover:text-[#0F9FA8] hover:bg-[#0F9FA8]/10 rounded-lg"><Edit2 size={15} /></button>
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

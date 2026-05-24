import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, AlertCircle, Eye, EyeOff, Phone } from 'lucide-react';
import { authService } from '../lib/auth';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.username.trim() || !form.password) {
      setError('Please enter username and password');
      return;
    }
    setLoading(true);
    const result = await authService.login(form);
    if (result.success) {
      navigate('/admin');
    } else {
      setError(result.error || 'Login failed. Please check your credentials.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A3D62] to-[#0F9FA8] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <img src="/images/Logo.jpg" alt="ARVI" className="h-16 w-auto mx-auto mb-4 rounded-xl shadow" />
            <h1 className="text-2xl font-bold text-[#0A3D62] font-heading">Admin Portal</h1>
            <p className="text-gray-500 text-sm mt-1">ARVI Ortho & Child Care</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 mb-6" autoComplete="off">
            {error && (
              <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 border border-red-200">
                <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-[#0A3D62] mb-2">Username</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Enter username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                  disabled={loading}
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#0F9FA8] focus:ring-2 focus:ring-[#0F9FA8]/10 outline-none transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#0A3D62] mb-2">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 focus:border-[#0F9FA8] focus:ring-2 focus:ring-[#0F9FA8]/10 outline-none transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#0A3D62] to-[#0F9FA8] text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Forgot password notice */}
          <div className="mt-2 pt-5 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Forgot password?{' '}
              <span className="text-[#0F9FA8] font-semibold">Please contact IT Team</span>
            </p>
            <a
              href="tel:+919677080778"
              className="mt-3 inline-flex items-center gap-2 text-xs text-gray-400 hover:text-[#0A3D62] transition-colors"
            >
              <Phone size={12} /> +91 96770 80778
            </a>
          </div>
        </div>

        <p className="text-center text-white/60 text-xs mt-4">
          © 2025 ARVI Ortho & Child Care. Secure Portal.
        </p>
      </div>
    </div>
  );
}

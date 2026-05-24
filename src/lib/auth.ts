import { supabase } from './supabase';

export interface AdminUser {
  id: string;
  username: string;
  role: 'master_admin' | 'doctor_aravind' | 'doctor_vishali' | 'clinic_assistant' | 'physiotherapist';
  full_name: string;
  email: string;
  is_active: boolean;
}

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

export const authService = {
  async login({ username, password }: { username: string; password: string }) {
    try {
      if (!username?.trim() || !password) {
        throw new Error('Username and password are required');
      }

      // Single query — fetch user including password_hash column
      // password_hash lives directly in admin_users to avoid multi-table RLS issues
      const { data: allUsers, error: userError } = await supabase
        .from('admin_users')
        .select('*');

      if (userError) {
        throw new Error(`Database error: ${userError.message}`);
      }
      if (!allUsers || allUsers.length === 0) {
        throw new Error('No admin accounts found. Please run the SQL migration in Supabase first (see SETUP_INSTRUCTIONS.md).');
      }

      // Case-insensitive username match
      const userData = allUsers.find(
        u => u.username.toLowerCase() === username.trim().toLowerCase()
      );
      if (!userData) throw new Error('Invalid username or password');
      if (!userData.is_active) throw new Error('This account is inactive. Contact your administrator.');

      // password_hash is now a column on admin_users
      const storedHash = userData.password_hash as string | undefined;
      if (!storedHash) {
        throw new Error('No password set for this account. Please run the SQL migration again.');
      }

      // Accept plain text OR sha256 hash (plain = freshly seeded, hash = after change)
      const hashed = await sha256(password);
      const isValid = storedHash === password || storedHash === hashed;
      if (!isValid) throw new Error('Invalid username or password');

      // Strip password_hash before storing in session
      const { password_hash: _removed, ...safeUser } = userData;

      // Save session locally (non-fatal if DB session insert fails)
      const sessionToken = generateToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      try {
        await supabase.from('admin_sessions').delete().eq('user_id', safeUser.id);
        await supabase.from('admin_sessions').insert([{
          user_id: safeUser.id,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString(),
        }]);
      } catch { /* non-fatal */ }

      sessionStorage.setItem('admin_session', JSON.stringify({
        token: sessionToken,
        user: safeUser,
        expiresAt: expiresAt.toISOString(),
      }));

      return { success: true, user: safeUser };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  },

  async logout() {
    const session = this.getSession();
    if (session?.token) {
      try {
        await supabase.from('admin_sessions').delete().eq('session_token', session.token);
      } catch { /* ignore */ }
    }
    sessionStorage.removeItem('admin_session');
  },

  getSession(): { token: string; user: AdminUser; expiresAt: string } | null {
    const raw = sessionStorage.getItem('admin_session');
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (new Date(parsed.expiresAt) < new Date()) {
        sessionStorage.removeItem('admin_session');
        return null;
      }
      return parsed;
    } catch {
      sessionStorage.removeItem('admin_session');
      return null;
    }
  },

  isAuthenticated(): boolean { return this.getSession() !== null; },
  getCurrentUser(): AdminUser | null { return this.getSession()?.user || null; },
  getUserRole(): AdminUser['role'] | null { return this.getCurrentUser()?.role || null; },
  isMasterAdmin(): boolean { return this.getUserRole() === 'master_admin'; },

  canApproveAppointments(): boolean {
    const role = this.getUserRole();
    return role === 'master_admin'
      || role === 'doctor_aravind'
      || role === 'doctor_vishali'
      || role === 'physiotherapist';
    // clinic_assistant = read-only, cannot approve
  },

  getFilteredDoctors(): string[] {
    const role = this.getUserRole();
    switch (role) {
      case 'doctor_aravind':    return ['dr-aravindasamy', 'physiotherapist'];
      case 'doctor_vishali':    return ['dr-vishali', 'physiotherapist'];
      case 'physiotherapist':   return ['physiotherapist'];
      case 'clinic_assistant':  return []; // sees all, read-only
      case 'master_admin':      return []; // sees all
      default:                  return [];
    }
  },

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: row } = await supabase
        .from('admin_users')
        .select('password_hash')
        .eq('id', userId)
        .maybeSingle();

      if (!row?.password_hash) return { success: false, error: 'User not found' };

      const currentHash = await sha256(currentPassword);
      const isValid = row.password_hash === currentPassword || row.password_hash === currentHash;
      if (!isValid) return { success: false, error: 'Current password is incorrect' };
      if (newPassword.length < 6) return { success: false, error: 'New password must be at least 6 characters' };

      const newHash = await sha256(newPassword);
      const { error } = await supabase
        .from('admin_users')
        .update({ password_hash: newHash })
        .eq('id', userId);

      if (error) return { success: false, error: 'Failed to update password' };
      return { success: true };
    } catch {
      return { success: false, error: 'An unexpected error occurred' };
    }
  },
};

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { ensureProfile, type Profile } from './lib/db';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isEditor: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const Ctx = createContext<AuthState>({} as AuthState);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile() {
    try {
      const p = await ensureProfile();
      setProfile(p);
    } catch {
      setProfile(null);
    }
  }

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session) await loadProfile();
      setLoading(false);
    });
    // QUAN TRỌNG: callback này chạy khi thư viện đang giữ khoá phiên.
    // Không được await bất kỳ lệnh Supabase nào bên trong (gây treo mọi yêu cầu sau đó) —
    // đẩy việc tải profile ra ngoài bằng setTimeout.
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (!s) { setProfile(null); return; }
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        setTimeout(() => { if (mounted) loadProfile(); }, 0);
      }
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  const value: AuthState = {
    session, profile, loading,
    isEditor: profile?.role === 'admin' || profile?.role === 'editor',
    isAdmin: profile?.role === 'admin',
    signOut: async () => {
      await supabase.auth.signOut();
      // Dọn mọi cache của trang (phòng khi còn dữ liệu phiên) — an toàn cho máy dùng chung.
      try { if ('caches' in window) { const ks = await caches.keys(); await Promise.all(ks.map((k) => caches.delete(k))); } } catch { /* ignore */ }
    },
    refreshProfile: loadProfile,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

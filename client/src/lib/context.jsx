import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { getAdminProfile, getSettings, isSchemaMissing, signIn, signOut } from './data';

const SettingsCtx = createContext({ settings: {}, reload: () => {} });
const AuthCtx = createContext(null);
const ToastCtx = createContext(() => {});

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({ org_name: 'OSIS SMA Negeri 3 Rembang', period: '2026/2027', missions: [] });
  const [schemaMissing, setSchemaMissing] = useState(false);
  const reload = useCallback(
    () =>
      getSettings()
        .then((s) => {
          setSettings(s);
          setSchemaMissing(false);
        })
        .catch((e) => setSchemaMissing(isSchemaMissing(e))),
    []
  );
  useEffect(() => {
    reload();
  }, [reload]);
  return <SettingsCtx.Provider value={{ settings, reload, schemaMissing }}>{children}</SettingsCtx.Provider>;
}

/**
 * user    : user Supabase Auth yang login (atau null)
 * profile : baris tabel `admins` milik user (null bila bukan admin)
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const apply = async (session) => {
      const u = session?.user ?? null;
      let p = null;
      if (u) p = await getAdminProfile(u.id).catch(() => null);
      if (!active) return;
      setUser(u);
      setProfile(p);
      setLoading(false);
    };
    supabase.auth.getSession().then(({ data }) => apply(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      // Jalankan di luar callback agar tidak terjadi deadlock pada supabase-js
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') setTimeout(() => apply(session), 0);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const { user: u } = await signIn(email, password);
    const p = await getAdminProfile(u.id);
    if (!p) {
      await signOut();
      throw new Error('Akun ini tidak terdaftar sebagai admin OSIS');
    }
    setUser(u);
    setProfile(p);
  };
  const logout = async () => {
    await signOut();
    setUser(null);
    setProfile(null);
  };

  const admin = user && profile ? { id: user.id, email: user.email, name: profile.name, role: profile.role } : null;
  return <AuthCtx.Provider value={{ user: admin, authUser: user, loading, login, logout }}>{children}</AuthCtx.Provider>;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, type = 'success') => {
    const id = Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 top-3 z-[100] flex flex-col items-center gap-2 sm:inset-x-auto sm:top-auto sm:right-6 sm:bottom-6 sm:items-end" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.type === 'error' ? 'alert' : 'status'}
            className={`fade-in pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-full py-2.5 pr-5 pl-2.5 text-sm font-semibold shadow-[0_12px_32px_-8px_rgba(21,20,18,.45)] ${
              t.type === 'error' ? 'bg-red-600 text-white' : 'bg-ink-900 text-white'
            }`}
          >
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${t.type === 'error' ? 'bg-white/20' : 'bg-sun-400 text-ink-950'}`}>
              {t.type === 'error' ? '!' : '✓'}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useSettings = () => useContext(SettingsCtx);
export const useAuth = () => useContext(AuthCtx);
export const useToast = () => useContext(ToastCtx);

/**
 * Hook sederhana untuk mengambil data async.
 * @param {() => Promise<any>} fetcher fungsi pengambil data
 * @param {any[]} deps dependensi yang memicu pengambilan ulang
 */
export function useQuery(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    setLoading(true);
    return fetcher()
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => {
    load();
  }, [load]);
  return { data, error, loading, reload: load, setData };
}

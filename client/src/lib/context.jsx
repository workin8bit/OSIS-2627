import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { supabase } from './supabase';
import { getAdminPermissions, getAdminProfile, getSettings, isSchemaMissing, signIn, signOut } from './data';

const SettingsCtx = createContext({ settings: {}, reload: () => {} });
const AuthCtx = createContext(null);
const ToastCtx = createContext(() => {});
const EMPTY_CAN = () => false;
/**
 * Nilai khusus: tabel `admin_permissions` belum tersedia (migrasi hak akses
 * belum dijalankan di Supabase). Selama itu belum terpasang, semua admin
 * memakai akses penuh seperti perilaku awal agar tidak terkunci.
 */
const UNRESTRICTED = null;

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
 * user      : user Supabase Auth yang login (atau null)
 * profile   : baris tabel `admins` milik user (null bila bukan admin)
 * permissions: { module: 'read' | 'write' } dari tabel `admin_permissions`
 * can()     : cek hak akses modul; superadmin selalu true
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [permissions, setPermissions] = useState(UNRESTRICTED); // null = fitur hak akses belum terpasang di database
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const apply = async (session) => {
      const u = session?.user ?? null;
      let p = null;
      let perms = UNRESTRICTED;
      if (u) {
        p = await getAdminProfile(u.id).catch(() => null);
        if (p) perms = await getAdminPermissions(u.id).catch(() => null);
      }
      if (!active) return;
      setUser(u);
      setProfile(p);
      setPermissions(perms);
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
    const perms = await getAdminPermissions(u.id).catch(() => UNRESTRICTED);
    setUser(u);
    setProfile(p);
    setPermissions(perms);
  };
  const logout = async () => {
    await signOut();
    setUser(null);
    setProfile(null);
    setPermissions(UNRESTRICTED);
  };

  const admin = user && profile
    ? { id: user.id, email: user.email, name: profile.name, role: profile.role, member: profile.member }
    : null;
  const isSuper = profile?.role === 'superadmin';
  const can = useCallback(
    (module, need = 'read') => {
      if (!profile) return false;
      if (profile.role === 'superadmin') return true;
      if (permissions === UNRESTRICTED) return true; // migrasi hak akses belum dijalankan
      const access = permissions[module];
      if (!access) return false;
      return need === 'read' ? true : access === 'write';
    },
    [profile, permissions]
  );

  return (
    <AuthCtx.Provider value={{ user: admin, authUser: user, loading, login, logout, permissions, isSuper, can }}>
      {children}
    </AuthCtx.Provider>
  );
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
      <div className="toast-container">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast ${t.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'} animate-fade-in`}
          >
            {t.type === 'error' ? <X className="h-5 w-5 text-white" /> : <CheckCircle2 className="h-5 w-5 text-gold-400" />}
            <span className="text-sm font-medium">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useSettings = () => useContext(SettingsCtx);
export const useAuth = () => useContext(AuthCtx) || { user: null, loading: true, can: EMPTY_CAN };
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

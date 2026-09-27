import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from './api';

const SettingsCtx = createContext({ settings: {}, reload: () => {} });
const AuthCtx = createContext(null);
const ToastCtx = createContext(() => {});

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({ org_name: 'OSIS SMA Negeri 3 Rembang', period: '2026/2027', missions: [] });
  const reload = useCallback(() => api('/settings').then(setSettings).catch(() => {}), []);
  useEffect(() => {
    reload();
  }, [reload]);
  return <SettingsCtx.Provider value={{ settings, reload }}>{children}</SettingsCtx.Provider>;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!getToken());

  useEffect(() => {
    if (!getToken()) return;
    api('/auth/me')
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    const { token, user } = await api('/auth/login', { method: 'POST', body: { username, password } });
    setToken(token);
    setUser(user);
  };
  const logout = () => {
    setToken(null);
    setUser(null);
  };
  return <AuthCtx.Provider value={{ user, loading, login, logout }}>{children}</AuthCtx.Provider>;
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
      <div className="pointer-events-none fixed right-4 bottom-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`fade-in pointer-events-auto rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${
              t.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
            }`}
          >
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

/** Hook sederhana untuk mengambil data dari API. */
export function useFetch(path, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    setLoading(true);
    return api(path)
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps]);
  useEffect(() => {
    load();
  }, [load]);
  return { data, error, loading, reload: load, setData };
}

const TOKEN_KEY = 'osis_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

export async function api(path, { method = 'GET', body, auth = false } = {}) {
  const headers = {};
  const isForm = body instanceof FormData;
  if (body && !isForm) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token && (auth || path.startsWith('/admin') || path.startsWith('/auth'))) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* no body */
  }
  if (!res.ok) {
    if (res.status === 401 && path.startsWith('/admin')) {
      setToken(null);
      if (!location.pathname.startsWith('/admin/login')) location.href = '/admin/login';
    }
    throw new Error(data?.error || `Terjadi kesalahan (${res.status})`);
  }
  return data;
}

export async function uploadFile(file) {
  const fd = new FormData();
  fd.append('file', file);
  const { url } = await api('/admin/upload', { method: 'POST', body: fd });
  return url;
}

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Link2, ShieldCheck, Trash2, UserPlus, Wand2 } from 'lucide-react';
import {
  ADMIN_MODULES,
  applyDivisionTemplate,
  createAdmin,
  deleteAdmin,
  getDivisions,
  getPermissionsOf,
  getStructure,
  linkAdminMember,
  listAdmins,
  listDivisionPermissions,
  setAdminPermissions,
  setDivisionPermissions,
} from '../../lib/data';
import { useAuth, useQuery, useToast } from '../../lib/context';
import { Empty, Spinner } from '../../components/ui';

const ACCESS_OPTIONS = [
  { value: '', label: 'Tanpa akses' },
  { value: 'read', label: 'Lihat saja' },
  { value: 'write', label: 'Kelola penuh' },
];

const toRows = (map) =>
  Object.entries(map)
    .filter((entry) => entry[1])
    .map((entry) => ({ module: entry[0], access: entry[1] }));

const AccessSelect = ({ value, onChange, disabled }) => (
  <select
    className="input py-1.5 text-xs"
    value={value || ''}
    disabled={disabled}
    onChange={(e) => onChange(e.target.value)}
  >
    {ACCESS_OPTIONS.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
);

/**
 * Halaman "Hak Akses": menambah pengurus yang punya akun panel, menautkannya
 * ke data Pengurus (sehingga hak aksesnya bisa mengikuti seksi bidang), dan
 * menentukan modul mana yang boleh dibuka/diubah tiap pengurus.
 */
export default function AksesAdmin() {
  const { user, can, isSuper } = useAuth();
  const toast = useToast();
  const mayManage = can('akun', 'write');

  const { data: admins, loading, reload } = useQuery(listAdmins, []);
  const { data: divisions } = useQuery(getDivisions, []);
  const { data: structure } = useQuery(getStructure, []);

  // hak akses tiap admin: { [user_id]: { module: access } }
  const [grants, setGrants] = useState({});
  const [templates, setTemplates] = useState({});
  const [tab, setTab] = useState('');
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState(null);
  const [form, setForm] = useState({ member_id: '', email: '', password: '' });

  useEffect(() => {
    if (!admins) return;
    let active = true;
    Promise.all(admins.filter((a) => a.user_id !== user?.id).map((a) => getPermissionsOf(a.user_id).then((p) => [a.user_id, p])))
      .then((pairs) => {
        if (!active) return;
        setGrants(Object.fromEntries(pairs));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [admins, user?.id]);

  useEffect(() => {
    if (!divisions) return;
    listDivisionPermissions()
      .then(setTemplates)
      .catch(() => setTemplates({}));
  }, [divisions]);

  const members = useMemo(() => {
    if (!structure) return [];
    const core = structure.core.map((m) => ({ ...m, division: null, divisionName: 'Pengurus Inti' }));
    const secs = structure.divisions.flatMap((d) => d.members.map((m) => ({ ...m, division: d.id, divisionName: d.short || d.name })));
    return [...core, ...secs];
  }, [structure]);

  const linkedIds = new Set((admins || []).map((a) => a.member_id).filter(Boolean));
  const available = members.filter((m) => !linkedIds.has(m.id));

  const pickMember = members.find((m) => String(m.id) === String(form.member_id));

  const saveGrants = async (adminId, map) => {
    setBusy(adminId);
    setGrants((g) => ({ ...g, [adminId]: map }));
    try {
      await setAdminPermissions(adminId, toRows(map));
      toast('Hak akses berhasil disimpan');
    } catch (err) {
      setGrants((g) => ({ ...g, [adminId]: grants[adminId] || {} }));
      toast(err.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  const applyTemplate = async (admin) => {
    if (!admin.member_id) return toast('Tautkan anggota pengurus terlebih dahulu', 'error');
    setBusy(admin.user_id);
    try {
      const n = await applyDivisionTemplate(admin.user_id);
      const refreshed = await getPermissionsOf(admin.user_id);
      setGrants((g) => ({ ...g, [admin.user_id]: refreshed }));
      toast(n ? `Template seksi bidang diterapkan (${n} modul)` : 'Template seksi bidang masih kosong');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  const changeMember = async (admin, memberId) => {
    setBusy(admin.user_id);
    try {
      await linkAdminMember(admin.user_id, memberId ? Number(memberId) : null);
      toast(memberId ? 'Anggota pengurus ditautkan' : 'Tautan dilepas');
      reload();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  const saveTemplate = async (divisionId, map) => {
    setBusy(`div-${divisionId}`);
    setTemplates((t) => ({ ...t, [divisionId]: map }));
    try {
      await setDivisionPermissions(divisionId, map);
      toast('Template seksi bidang disimpan');
    } catch (err) {
      setTemplates((t) => ({ ...t, [divisionId]: templates[divisionId] || {} }));
      toast(err.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  const addAccount = async (e) => {
    e.preventDefault();
    if (!pickMember) return toast('Pilih anggota pengurus terlebih dahulu', 'error');
    setBusy('create');
    try {
      const created = await createAdmin({
        email: form.email.trim(),
        password: form.password,
        name: pickMember.name,
        role: 'admin',
        member_id: pickMember.id,
      });
      setForm({ member_id: '', email: '', password: '' });
      reload();

      const n = created?.user_id ? await applyDivisionTemplate(created.user_id).catch(() => 0) : 0;
      if (n) {
        setNotice(null);
        toast(`Akun ${pickMember.name} dibuat · ${n} modul mengikuti template ${pickMember.divisionName}`);
      } else {
        // Edge Function versi lama tidak mengirim member_id -> akses belum terikat sekbid
        setNotice({
          title: 'Akun dibuat, tetapi belum tertaut ke seksi bidang',
          body: 'Edge Function yang ter-deploy masih versi lama sehingga anggota pengurus tidak ikut tersimpan. Deploy ulang Edge Function, lalu klik tombol Template pada baris akun tersebut.',
        });
        toast('Akun dibuat, tautan ke seksi bidang belum tersimpan', 'error');
      }
    } catch (err) {
      toast(err.message, 'error');
      if (/belum di-deploy|not found|404|Failed to send/i.test(err.message)) {
        setNotice({ title: 'Edge Function admin-users belum bisa dipakai', body: null });
      }
    } finally {
      setBusy(null);
    }
  };

  const removeAccount = async (admin) => {
    if (!confirm(`Hapus akun ${admin.email || admin.name}? Akun loginnya juga dihapus.`)) return;
    setBusy(admin.user_id);
    try {
      await deleteAdmin(admin.user_id);
      toast('Akun dihapus');
      reload();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <Spinner />;

  if (!mayManage) {
    return (
      <Empty
        icon="Shield"
        title="Anda belum boleh mengelola hak akses"
        desc="Hanya superadmin atau admin yang diberi izin 'Kelola penuh' pada modul Akun & Hak Akses yang dapat membuka halaman ini."
      />
    );
  }

  const others = (admins || []).filter((a) => a.user_id !== user?.id);
  const activeDivision = tab || divisions?.[0]?.id;

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-bold text-slate-900">Tambah Pengurus Punya Akses</h2>
            <p className="text-sm text-slate-500">
              Akun diambil dari data Pengurus, lalu hak aksesnya mengikuti seksi bidang. Superadmin: {isSuper ? 'ya' : 'tidak'}.
            </p>
          </div>
        </div>

        <form onSubmit={addAccount} className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block lg:col-span-2">
            <span className="label">Anggota Pengurus</span>
            <select className="input" required value={form.member_id} onChange={(e) => setForm({ ...form, member_id: e.target.value })}>
              <option value="">— pilih anggota —</option>
              {available.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} · {m.position} · {m.divisionName}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">Email login</span>
            <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="block">
            <span className="label">Password (min. 6)</span>
            <input
              className="input"
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>
          <div className="flex flex-wrap items-center gap-3 lg:col-span-4">
            <button className="btn-primary" disabled={busy === 'create'}>
              <UserPlus className="h-4 w-4" /> Buat akun &amp; terapkan template seksi bidang
            </button>
            <p className="text-xs text-slate-500">
              Pembuatan akun memakai Edge Function <code>admin-users</code> di server Supabase (service role tidak pernah
              ada di browser).
            </p>
          </div>
        </form>

        {notice && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">{notice.title}</p>
            {notice.body && <p className="mt-1 text-amber-800">{notice.body}</p>}
            <pre className="mt-3 overflow-x-auto rounded-lg bg-white/70 p-3 text-xs text-ink-800">
              npx supabase login{'\n'}npx supabase functions deploy admin-users --project-ref fawwphybcnxwvwimoqwp
            </pre>
            <p className="mt-2 text-xs text-amber-800">
              Tanpa deploy, akun tetap bisa dibuat manual: buat user di Dashboard → Authentication → Users (centang{' '}
              <em>Auto Confirm User</em>), lalu jalankan di SQL Editor:
            </p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-white/70 p-3 text-xs text-ink-800">
              {`insert into public.admins (user_id, name, email, role, member_id)
select u.id, m.name, u.email, 'admin', m.id
from auth.users u
join public.members m on m.name = 'NAMA LENGKAP'
where u.email = 'email@sekolah.id';
select public.apply_division_template((select user_id from public.admins where email = 'email@sekolah.id'));`}
            </pre>
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-bold text-slate-900">Hak Akses per Pengurus</h2>
          <p className="text-sm text-slate-500">"Lihat saja" = boleh membuka halaman, "Kelola penuh" = bisa menambah, mengubah, dan menghapus.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs tracking-wide text-slate-500 uppercase">
                <th className="px-4 py-3 font-semibold">Pengurus</th>
                {ADMIN_MODULES.map((m) => (
                  <th key={m.key} className="px-2 py-3 text-center font-semibold">
                    {m.label}
                  </th>
                ))}
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {others.map((a) => (
                <tr key={a.user_id} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{a.name}</p>
                    <p className="text-xs text-slate-500">{a.email}</p>
                    {isSuper && a.role === 'superadmin' && (
                      <span className="badge-gold mt-1 inline-block text-[10px]">Superadmin</span>
                    )}
                    <div className="mt-2 flex flex-col gap-1.5">
                      <select
                        className="input py-1 text-xs"
                        value={a.member_id || ''}
                        onChange={(e) => changeMember(a, e.target.value)}
                      >
                        <option value="">— belum ditautkan —</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.id} disabled={linkedIds.has(m.id) && m.id !== a.member_id}>
                            {m.name} · {m.divisionName}
                          </option>
                        ))}
                      </select>
                      {a.member_id && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                          <Link2 className="h-3 w-3" /> {a.member?.division?.short || 'Pengurus inti'}
                        </span>
                      )}
                    </div>
                  </td>
                  {ADMIN_MODULES.map((m) => (
                    <td key={m.key} className="px-2 py-3">
                      <AccessSelect
                        value={grants[a.user_id]?.[m.key] || ''}
                        disabled={busy === a.user_id}
                        onChange={(v) => saveGrants(a.user_id, { ...(grants[a.user_id] || {}), [m.key]: v })}
                      />
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1.5">
                      <button
                        className="btn-secondary px-2 py-1.5 text-xs"
                        onClick={() => applyTemplate(a)}
                        disabled={!a.member_id || busy === a.user_id}
                        title="Salin template hak akses seksi bidang ke akun ini"
                      >
                        <Wand2 className="h-3.5 w-3.5" /> Template
                      </button>
                      <button
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                        onClick={() => removeAccount(a)}
                        aria-label="Hapus akun"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {others.length === 0 && (
                <tr>
                  <td colSpan={ADMIN_MODULES.length + 2} className="px-4 py-8 text-center text-sm text-slate-500">
                    Belum ada pengurus lain dengan akses panel.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-100 px-6 py-3 text-xs text-slate-500">
          Perubahan disimpan otomatis. Superadmin selalu memiliki akses penuh dan tidak dapat diedit dari sini. tautan ke{' '}
          <Link to="/admin/pengurus" className="font-semibold text-brand-700 underline">
            data Pengurus
          </Link>{' '}
          untuk menautkan atau melepas keanggotaan seksi bidang.
        </p>
      </div>

      <div className="card p-6">
        <h2 className="font-bold text-slate-900">Template Hak Akses per Seksi Bidang</h2>
        <p className="text-sm text-slate-500">
          Sekali klik tombol <strong>Template</strong> pada tabel di atas untuk menyalinnya ke akun pengurus.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {(divisions || []).map((d) => (
            <button
              key={d.id}
              onClick={() => setTab(String(d.id))}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                String(activeDivision) === String(d.id) ? 'bg-ink-950 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {d.short || d.name}
            </button>
          ))}
        </div>

        {activeDivision && (
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {ADMIN_MODULES.map((m) => (
              <label key={m.key} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2">
                <span className="text-sm text-slate-700">{m.label}</span>
                <AccessSelect
                  value={templates[activeDivision]?.[m.key] || ''}
                  disabled={busy === `div-${activeDivision}`}
                  onChange={(v) => saveTemplate(Number(activeDivision), { ...(templates[activeDivision] || {}), [m.key]: v })}
                />
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { lazy, Suspense } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { AuthProvider, SettingsProvider, ToastProvider, useSettings } from './lib/context';
import { isSupabaseConfigured } from './lib/supabase';
import SetupNotice, { DatabaseSetupNotice } from './components/SetupNotice';
import PublicLayout from './components/Layout';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Structure from './pages/Structure';
import Programs from './pages/Programs';
import { PostDetail, PostList } from './pages/Posts';
import Events from './pages/Events';
import Gallery from './pages/Gallery';
import Aspiration from './pages/Aspiration';
import { Spinner } from './components/ui';

// Panel admin dimuat terpisah agar pengunjung publik (umumnya di HP) tidak mengunduh kodenya.
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const Login = lazy(() => import('./pages/admin/Login'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const AspirationsAdmin = lazy(() => import('./pages/admin/AspirationsAdmin'));
const SettingsAdmin = lazy(() => import('./pages/admin/SettingsAdmin'));
const AccountAdmin = lazy(() => import('./pages/admin/AccountAdmin'));
const res = (name) => lazy(() => import('./pages/admin/Resources').then((m) => ({ default: m[name] })));
const PostsAdmin = res('PostsAdmin');
const EventsAdmin = res('EventsAdmin');
const ProgramsAdmin = res('ProgramsAdmin');
const MembersAdmin = res('MembersAdmin');
const DivisionsAdmin = res('DivisionsAdmin');
const GalleryAdmin = res('GalleryAdmin');

function NotFound() {
  return (
    <div className="container-x flex min-h-[65dvh] flex-col items-center justify-center py-12 text-center">
      <p className="text-[6rem] leading-none font-extrabold tracking-tighter text-ink-950">
        4<span className="mark">0</span>4
      </p>
      <p className="mt-4 text-lg font-bold text-ink-800">Halaman tidak ditemukan</p>
      <p className="mt-1 text-sm text-ink-500">Tautannya mungkin salah atau halamannya sudah dipindah.</p>
      <Link to="/" className="btn-primary mt-6">
        Kembali ke Beranda
      </Link>
    </div>
  );
}

/** Tampilkan panduan setup bila tabel Supabase belum dibuat. */
function SchemaGate({ children }) {
  const { schemaMissing, reload } = useSettings();
  return schemaMissing ? <DatabaseSetupNotice onRetry={reload} /> : children;
}

export default function App() {
  if (!isSupabaseConfigured) return <SetupNotice />;
  return (
    <BrowserRouter>
      <ToastProvider>
        <SettingsProvider>
          <SchemaGate>
          <AuthProvider>
            <Suspense fallback={<Spinner className="min-h-dvh" />}>
            <Routes>
              <Route element={<PublicLayout />}>
                <Route index element={<Home />} />
                <Route path="profil" element={<Profile />} />
                <Route path="struktur" element={<Structure />} />
                <Route path="program" element={<Programs />} />
                <Route path="berita" element={<PostList />} />
                <Route path="berita/:slug" element={<PostDetail />} />
                <Route path="agenda" element={<Events />} />
                <Route path="galeri" element={<Gallery />} />
                <Route path="aspirasi" element={<Aspiration />} />
                <Route path="*" element={<NotFound />} />
              </Route>
              <Route path="admin/login" element={<Login />} />
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="aspirasi" element={<AspirationsAdmin />} />
                <Route path="berita" element={<PostsAdmin />} />
                <Route path="agenda" element={<EventsAdmin />} />
                <Route path="program" element={<ProgramsAdmin />} />
                <Route path="pengurus" element={<MembersAdmin />} />
                <Route path="sekbid" element={<DivisionsAdmin />} />
                <Route path="galeri" element={<GalleryAdmin />} />
                <Route path="pengaturan" element={<SettingsAdmin />} />
                <Route path="akun" element={<AccountAdmin />} />
              </Route>
            </Routes>
            </Suspense>
          </AuthProvider>
          </SchemaGate>
        </SettingsProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

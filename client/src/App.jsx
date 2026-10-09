import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { AuthProvider, SettingsProvider, ToastProvider, useSettings } from './lib/context';
import { isSupabaseConfigured } from './lib/supabase';
import SetupNotice, { DatabaseSetupNotice } from './components/SetupNotice';
import PublicLayout from './components/Layout';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Structure from './pages/Structure';
import MemberProfile from './pages/MemberProfile';
import Programs from './pages/Programs';
import { PostDetail, PostList } from './pages/Posts';
import Events, { EventDetail } from './pages/Events';
import Gallery from './pages/Gallery';
import Aspiration from './pages/Aspiration';
import AdminLayout from './pages/admin/AdminLayout';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import { DivisionsAdmin, EventsAdmin, GalleryAdmin, MembersAdmin, PostsAdmin, ProgramsAdmin } from './pages/admin/Resources';
import AspirationsAdmin from './pages/admin/AspirationsAdmin';
import SettingsAdmin from './pages/admin/SettingsAdmin';
import AccountAdmin from './pages/admin/AccountAdmin';
import StudentViewAdmin from './pages/admin/StudentViewAdmin';
import AksesAdmin from './pages/admin/AksesAdmin';

function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-ink-950 px-4 pt-20 text-center">
      <p className="text-7xl font-extrabold text-sun-400">404</p>
      <p className="mt-2 text-lg font-semibold text-ink-200">Halaman tidak ditemukan</p>
      <Link to="/" className="btn-gold mt-6">
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
            <Routes>
              <Route element={<PublicLayout />}>
                <Route index element={<Home />} />
                <Route path="profil" element={<Profile />} />
                <Route path="struktur" element={<Structure />} />
                <Route path="pengurus/:id" element={<MemberProfile />} />
                <Route path="program" element={<Programs />} />
                <Route path="berita" element={<PostList />} />
                <Route path="berita/:slug" element={<PostDetail />} />
                <Route path="agenda" element={<Events />} />
                <Route path="agenda/:id" element={<EventDetail />} />
                <Route path="galeri" element={<Gallery />} />
                <Route path="aspirasi" element={<Aspiration />} />
                <Route path="*" element={<NotFound />} />
              </Route>
              <Route path="admin/login" element={<Login />} />
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="tampilan-siswa" element={<StudentViewAdmin />} />
                <Route path="aspirasi" element={<AspirationsAdmin />} />
                <Route path="berita" element={<PostsAdmin />} />
                <Route path="agenda" element={<EventsAdmin />} />
                <Route path="program" element={<ProgramsAdmin />} />
                <Route path="pengurus" element={<MembersAdmin />} />
                <Route path="sekbid" element={<DivisionsAdmin />} />
                <Route path="galeri" element={<GalleryAdmin />} />
                <Route path="pengaturan" element={<SettingsAdmin />} />
                <Route path="akun" element={<AccountAdmin />} />
                <Route path="akses" element={<AksesAdmin />} />
              </Route>
            </Routes>
          </AuthProvider>
          </SchemaGate>
        </SettingsProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { AuthProvider, SettingsProvider, ToastProvider } from './lib/context';
import PublicLayout from './components/Layout';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Structure from './pages/Structure';
import Programs from './pages/Programs';
import { PostDetail, PostList } from './pages/Posts';
import Events from './pages/Events';
import Gallery from './pages/Gallery';
import Aspiration from './pages/Aspiration';
import AdminLayout from './pages/admin/AdminLayout';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import { DivisionsAdmin, EventsAdmin, GalleryAdmin, MembersAdmin, PostsAdmin, ProgramsAdmin } from './pages/admin/Resources';
import AspirationsAdmin from './pages/admin/AspirationsAdmin';
import SettingsAdmin from './pages/admin/SettingsAdmin';
import AccountAdmin from './pages/admin/AccountAdmin';

function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-slate-50 px-4 pt-20 text-center">
      <p className="text-7xl font-extrabold text-brand-700">404</p>
      <p className="mt-2 text-lg font-semibold text-slate-700">Halaman tidak ditemukan</p>
      <Link to="/" className="btn-primary mt-6">
        Kembali ke Beranda
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <SettingsProvider>
          <AuthProvider>
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
          </AuthProvider>
        </SettingsProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

import { useState } from 'react';
import { NavLink, Outlet, useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LayoutDashboard, Users, LogOut, Sparkles, Bell, Mail, PlusCircle, AlertTriangle} from 'lucide-react';
import { CalendarDays } from 'lucide-react';
import logoImage from '../assets/logo.png';

export const MainLayout = () => {
  const { session } = useOutletContext<{ session: any }>();
  const navigate = useNavigate();

  // State untuk mengontrol modal konfirmasi logout kustom
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [loadingLogout, setLoadingLogout] = useState(false);

  const handleSignOut = async () => {
    setLoadingLogout(true);
    await supabase.auth.signOut();
    setLoadingLogout(false);
    setIsLogoutModalOpen(false);
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/children', label: 'Data Anak', icon: Users },
    { to: '/input-aktivitas', label: 'Aktivitas Hari Ini', icon: PlusCircle },
    { to: '/jadwal', label: 'Agenda', icon: CalendarDays },
    { to: '/ai-konsultasi', label: 'AI Konsul', icon: Sparkles }
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col md:flex-row text-slate-800 font-sans pb-20 md:pb-0">
      
      {/* 1. MOBILE NAVBAR HEADER ATAS */}
      <div className="md:hidden bg-white border-b border-slate-100 p-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-2.5">
          <img src={logoImage} alt="Journstep Logo" className="h-8 w-auto object-contain" />
        </div>
        <button
          onClick={() => setIsLogoutModalOpen(true)}
          title="Keluar"
          className="p-2 text-slate-400 hover:text-red-500 rounded-xl transition"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* 2. SIDEBAR DESKTOP */}
      <aside className="hidden md:flex fixed md:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-100 flex-col justify-between">
        <div>
          <div className="p-6 flex items-center gap-3">
            <img src={logoImage} alt="Journstep Logo" className="h-9 w-auto object-contain" />
          </div>

          <div className="px-4 py-2">
            <p className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-2">Menu Utama</p>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-semibold transition ${
                        isActive
                          ? 'bg-teal-50 text-[#01acbf] font-bold'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center justify-between p-2 rounded-2xl bg-[#FAF9F6]">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-teal-50 text-[#01acbf] flex items-center justify-center font-bold text-xs shrink-0">
                {session?.user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-700 truncate">{session?.user?.email}</p>
                <p className="text-[10px] text-slate-400">Orang Tua</p>
              </div>
            </div>
            <button
              onClick={() => setIsLogoutModalOpen(true)}
              title="Keluar"
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-xl transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 3. BOTTOM NAVIGATION BAR MOBILE */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-100 px-2 py-2 flex items-center justify-around z-50 shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition ${
                  isActive
                    ? 'text-[#01acbf] font-bold'
                    : 'text-slate-400 hover:text-slate-600'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* 4. KONTEN UTAMA */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="hidden md:flex items-center justify-between px-8 py-5 bg-[#FAF9F6]">
          <div className="flex items-center gap-3 ml-auto">
            <button className="w-9 h-9 rounded-full bg-white border border-slate-200/60 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition">
              <Mail className="w-4 h-4" />
            </button>
            <button className="w-9 h-9 rounded-full bg-white border border-slate-200/60 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition">
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 md:px-8 py-6">
          <Outlet context={{ session }} />
        </main>
      </div>

      {/* 5. MODAL KONFIRMASI KELUAR (CUSTOM KELUAR APLIKASI) */}
      {isLogoutModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsLogoutModalOpen(false)}
        >
          <div
            className="relative max-w-sm w-full bg-white p-6 rounded-3xl shadow-2xl space-y-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 text-base">Perhatian</h3>
              <p className="text-xs text-slate-500">
                Apakah Anda yakin ingin keluar dari akun Anda?
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={loadingLogout}
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl text-xs transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={loadingLogout}
                onClick={handleSignOut}
                className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-2xl text-xs transition shadow-md shadow-rose-100 flex items-center justify-center gap-1.5"
              >
                {loadingLogout ? 'Keluar...' : 'Ya, Keluar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
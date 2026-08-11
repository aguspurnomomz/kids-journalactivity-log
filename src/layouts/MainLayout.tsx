import { NavLink, Outlet, useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LayoutDashboard, Users, LogOut, Sparkles, Search, Bell, Mail, PlusCircle } from 'lucide-react';
import logoImage from '../assets/logo.png';

export const MainLayout = () => {
  const { session } = useOutletContext<{ session: any }>();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const confirmLogout = window.confirm('Apakah Anda yakin akan keluar?');
    
    if (confirmLogout) {
      await supabase.auth.signOut();
      navigate('/login');
    }
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/children', label: 'Data Anak', icon: Users },
    { to: '/input-aktivitas', label: 'Catat Aktivitas', icon: PlusCircle },
    { to: '/ai-konsultasi', label: 'AI Konsul', icon: Sparkles },
    { to: '/pengingat', label: 'Pengingat', icon: Bell } 
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col md:flex-row text-slate-800 font-sans pb-20 md:pb-0">
      
      {/* 1. MOBILE NAVBAR HEADER ATAS */}
      <div className="md:hidden bg-white border-b border-slate-100 p-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-2.5">
          <img src={logoImage} alt="Journstep Logo" className="h-8 w-auto object-contain" />
        </div>
        <button
          onClick={handleSignOut}
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
            <p className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-2">Overview</p>
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
              onClick={handleSignOut}
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
          <div className="relative w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari aktivitas atau catatan latihan..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/60 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-[#01acbf]/20 shadow-xs"
            />
          </div>

          <div className="flex items-center gap-3">
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
    </div>
  );
};
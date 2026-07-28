import { useState } from 'react';
import { NavLink, Outlet, useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LayoutDashboard, Users, LogOut, Sparkles, Menu, X, Search, Bell, Mail, PlusCircle } from 'lucide-react';
import logoImage from '../assets/logo.png'; // <-- 1. Impor logo dari folder assets (sesuaikan nama file jika .svg atau .png)

export const MainLayout = () => {
  const { session } = useOutletContext<{ session: any }>();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/children', label: 'Data Anak', icon: Users },
    { to: '/input-aktivitas', label: 'Input Aktivitas', icon: PlusCircle },
    { to: '/ai-konsultasi', label: 'Konsultasi dengan AI', icon: Sparkles },
    { to: '/pengingat', label: 'Pengingat', icon: Bell } 
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row text-slate-800 font-sans">
      {/* Mobile Navbar Header */}
      <div className="md:hidden bg-white border-b border-slate-100 p-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          {/* 2. Ganti Kotak Ungu + Teks dengan Logo Asset */}
          <img src={logoImage} alt="Journstep Logo" className="h-8 w-auto object-contain" />
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Desktop */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-100 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Logo Brand di Sidebar */}
          <div className="p-6 flex items-center gap-3">
            {/* 3. Ganti juga logo di sidebar */}
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
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-semibold transition ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-600 font-bold'
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
          <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-50">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
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

      <div className="flex-1 flex flex-col min-w-0">
        <header className="hidden md:flex items-center justify-between px-8 py-5 bg-[#f8fafc]">
          <div className="relative w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari aktivitas atau catatan latihan..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/60 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
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

        <main className="flex-1 px-4 md:px-8 pb-8">
          <Outlet context={{ session }} />
        </main>
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff, Activity, Heart, Award } from 'lucide-react';
import logoImage from '../assets/logo.png'; // <-- 1. Impor logo dari folder assets (sesuaikan jika .svg atau .ico)

export const Auth = () => {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullname, setFullname] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (authError) throw authError;

        if (authData.user) {
          const { error: profileError } = await supabase.from('users').insert([
            {
              id: authData.user.id,
              username,
              fullname,
              email,
            },
          ]);

          if (profileError) {
            await supabase.auth.signOut();
            if (profileError.code === '23505') {
              throw new Error('Username sudah digunakan. Silakan gunakan username lain.');
            }
            throw profileError;
          }
        }

        navigate('/');
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (loginError) throw loginError;

        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan, silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 lg:p-8 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl shadow-indigo-100/50 border border-slate-100 max-w-5xl w-full min-h-[640px] flex flex-col lg:flex-row overflow-hidden p-3 lg:p-4 gap-4">
        
        <div className="w-full lg:w-1/2 p-6 lg:p-10 flex flex-col justify-between">
          <div className="flex items-center gap-2.5">
            {/* 2. Ganti Kotak Ungu + Teks Journstep dengan Logo dari Asset */}
            <img src={logoImage} alt="Journstep Logo" className="h-9 w-auto object-contain" />
          </div>

          <div className="my-auto py-6">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
              {isRegister ? 'Buat Akun Baru' : 'Halo Ayah Bunda'}
            </h1>
            <p className="text-slate-400 text-xs mb-8 leading-relaxed max-w-xs">
              {isRegister
                ? 'Daftar sekarang untuk mulai mencatat dan memantau tumbuh kembang motorik anak.'
                : 'Catat dan pantau aktivitas perkembangan motorik dan aktivitas pembelajaran harian buah hati dengan mudah.'}
            </p>

            {error && (
              <div className="p-3.5 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              {isRegister && (
                <>
                  <div>
                    <input
                      type="text"
                      required
                      value={fullname}
                      onChange={(e) => setFullname(e.target.value)}
                      placeholder="Nama Lengkap"
                      className="w-full px-5 py-3.5 border border-slate-200/90 rounded-full focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none text-xs transition placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username"
                      className="w-full px-5 py-3.5 border border-slate-200/90 rounded-full focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none text-xs transition placeholder:text-slate-400"
                    />
                  </div>
                </>
              )}

              <div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full px-5 py-3.5 border border-slate-200/90 rounded-full focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none text-xs transition placeholder:text-slate-400"
                />
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-5 py-3.5 pr-12 border border-slate-200/90 rounded-full focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none text-xs transition placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {!isRegister && (
                <div className="text-right">
                  <a href="#forgot" onClick={(e) => e.preventDefault()} className="text-[11px] font-semibold text-slate-400 hover:text-indigo-600 transition">
                    Forgot Password?
                  </a>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded-full text-xs transition shadow-lg shadow-slate-200/80 disabled:opacity-50 mt-2"
              >
                {loading ? 'Memproses...' : isRegister ? 'Register Now' : 'Login'}
              </button>
            </form>
          </div>

          <div className="text-center text-xs text-slate-400">
            {isRegister ? 'Already a member?' : 'Not a member?'}{' '}
            <button
              type="button"
              onClick={toggleMode}
              className="text-indigo-600 font-bold hover:underline ml-1"
            >
              {isRegister ? 'Login now' : 'Register now'}
            </button>
          </div>
        </div>

        <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-indigo-50/80 via-purple-50/50 to-indigo-100/60 rounded-[2.5rem] p-8 flex-col justify-between relative overflow-hidden border border-indigo-100/40">
          <div className="relative z-10 flex justify-between items-start">
            <div className="bg-white/80 backdrop-blur-md p-3.5 rounded-2xl border border-white/60 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Perkembangan</p>
                <p className="font-bold text-slate-800 text-xs">Aktivitas Belajar</p>
              </div>
            </div>

            <div className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-indigo-600 border border-white/60 shadow-xs">
              <Heart className="w-5 h-5 fill-indigo-100" />
            </div>
          </div>

          <div className="relative z-10 text-center my-auto py-8">
            <div className="relative inline-block mb-6">
              <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-1 shadow-xl shadow-indigo-200/80">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-4xl">
                  👶
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-white px-3 py-1.5 rounded-full border border-indigo-100 shadow-sm flex items-center gap-1.5 text-[10px] font-bold text-indigo-600">
                <Award className="w-3.5 h-3.5" /> 84% Focus Score
              </div>
            </div>

            <h3 className="text-xl font-bold text-slate-800 max-w-xs mx-auto leading-snug">
              Pantau Milestone Anak dengan Mudah & Terstruktur
            </h3>
            <p className="text-slate-400 text-xs mt-2 max-w-xs mx-auto">
              Simpan catatan latihan harian dan dapatkan rekomendasi AI untuk mendukung stimulasi motoriknya.
            </p>
          </div>

          <div className="relative z-10 flex items-center justify-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-indigo-200"></div>
            <div className="w-6 h-2 rounded-full bg-indigo-600"></div>
            <div className="w-2 h-2 rounded-full bg-indigo-200"></div>
          </div>
          <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-indigo-300/20 rounded-full blur-2xl pointer-events-none" />
        </div>
      </div>
    </div>
  );
};
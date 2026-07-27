import React, { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ChildModal } from '../components/ChildModal';
import { type Child, type ActivityLog } from '../types/database';
import { Calendar, Plus, Sparkles, Clock, Award, Star, Baby, PlusCircle } from 'lucide-react';
import { AnalyticsCharts } from '../components/AnalyticsCharts';

export const DashboardPage = () => {
  const { session } = useOutletContext<{ session: any }>();
  const navigate = useNavigate();

  const [children, setChildren] = useState<Child[]>([]);
  const [activeChild, setActiveChild] = useState<Child | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);

  const fetchChildrenAndLogs = async () => {
    if (!session?.user) return;

    const { data: childrenData } = await supabase
      .from('children')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true });

    if (childrenData && childrenData.length > 0) {
      setChildren(childrenData);
      
      const currentActive = activeChild
        ? childrenData.find((c) => c.id === activeChild.id) || childrenData[0]
        : childrenData[0];

      setActiveChild(currentActive);

      const { data: logsData } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('child_id', currentActive.id)
        .order('logged_at', { ascending: false });

      setLogs(logsData || []);
    } else {
      setChildren([]);
      setActiveChild(null);
      setLogs([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchChildrenAndLogs();
  }, [session, activeChild?.id]);

  if (loading) {
    return <div className="text-slate-400 font-medium py-12 text-center text-xs">Memuat dashboard...</div>;
  }

  const totalMinutes = logs.reduce((acc, item) => acc + item.duration_minutes, 0);
  const avgFocus = logs.length > 0 ? (logs.reduce((acc, item) => acc + item.focus_score, 0) / logs.length).toFixed(1) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 text-white p-7 rounded-3xl shadow-lg shadow-indigo-200/50 relative overflow-hidden flex flex-col justify-between min-h-[180px]">
          <Sparkles className="w-32 h-32 absolute -right-6 -bottom-6 text-indigo-400/30" />
          <Sparkles className="w-16 h-16 absolute right-32 top-2 text-indigo-300/20" />

          <div className="relative z-10 max-w-md">
            <span className="text-[10px] font-bold tracking-widest uppercase bg-white/20 px-3 py-1 rounded-full text-indigo-100 backdrop-blur-md">
              Jurnal Latihan Motorik
            </span>
            <h1 className="text-2xl font-bold mt-3 leading-snug">
              Pantau & Optimalkan Perkembangan Motorik Buah Hati
            </h1>
          </div>

          <div className="relative z-10 mt-5 flex items-center gap-3">
            <button
              onClick={() => navigate('/input-aktivitas')}
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-5 py-3 rounded-full transition shadow-md flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-indigo-400" /> Input Aktivitas Baru
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center gap-3 shadow-xs">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Total Waktu</p>
              <p className="font-bold text-slate-800 text-sm mt-0.5">{totalMinutes} Mins</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center gap-3 shadow-xs">
            <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-600">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Sesi Latihan</p>
              <p className="font-bold text-slate-800 text-sm mt-0.5">{logs.length} Sesi</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center gap-3 shadow-xs">
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600">
              <Star className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Rata2 Fokus</p>
              <p className="font-bold text-slate-800 text-sm mt-0.5">{avgFocus} / 5</p>
            </div>
          </div>
        </div>

        <AnalyticsCharts logs={logs} />

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" /> Catatan Aktivitas Terbaru
            </h3>
            {logs.length > 0 && (
              <button
                onClick={() => navigate('/input-aktivitas')}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                + Tambah Log
              </button>
            )}
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 text-xs space-y-3">
              <p>Belum ada catatan latihan untuk anak ini.</p>
              <button
                onClick={() => navigate('/input-aktivitas')}
                className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-600 font-semibold px-4 py-2 rounded-2xl hover:bg-indigo-100 transition"
              >
                <Plus className="w-4 h-4" /> Catat Latihan Pertama
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-white p-5 rounded-3xl border border-slate-100 hover:border-indigo-100 transition shadow-xs flex flex-col md:flex-row justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full">
                        {log.activity_category}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {log.logged_at ? new Date(log.logged_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm">{log.activity_name}</h4>
                    {log.notes && (
                      <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-100/60 mt-1">
                        {log.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex md:flex-col justify-between items-end text-xs text-slate-500 border-t md:border-t-0 md:border-l border-slate-100 pt-2 md:pt-0 md:pl-4 min-w-[120px]">
                    <div>Durasi: <strong className="text-slate-700">{log.duration_minutes}m</strong></div>
                    <div>Bantuan: <strong className="text-slate-700">{log.assistance_level}</strong></div>
                    <div>Fokus: <strong className="text-indigo-600 font-bold">{log.focus_score}/5</strong></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-base">Profil Anak</h3>
            <button
              onClick={() => setIsAddChildModalOpen(true)}
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              + Tambah
            </button>
          </div>

          {children.length > 0 ? (
            <div className="space-y-5">
              {/* Selector jika > 1 anak */}
              {children.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => setActiveChild(child)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                        activeChild?.id === child.id
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {child.name}
                    </button>
                  ))}
                </div>
              )}

              {activeChild && (
                <div className="text-center space-y-4">
                  <div className="relative inline-block">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-100 to-purple-100 border-4 border-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-2xl mx-auto shadow-sm">
                      {activeChild.name.charAt(0)}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-800 text-lg">
                      {activeChild.name} {activeChild.gender === 'L' ? '👦' : '👧'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Lahir: {new Date(activeChild.birth_date).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                    </p>
                  </div>

                  {/* Info Fisik */}
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                    <div className="bg-slate-50 p-3 rounded-2xl">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Tinggi Badan</p>
                      <p className="font-bold text-slate-800 text-xs mt-0.5">
                        {activeChild.height_cm ? `${activeChild.height_cm} cm` : '-'}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Berat Badan</p>
                      <p className="font-bold text-slate-800 text-xs mt-0.5">
                        {activeChild.weight_kg ? `${activeChild.weight_kg} kg` : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Baby className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-400">Belum ada profil anak terhubung.</p>
              <button
                onClick={() => setIsAddChildModalOpen(true)}
                className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold text-xs py-2.5 rounded-2xl transition"
              >
                + Tambah Profil Anak
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Tambah Data Anak */}
     {session?.user && (
        <ChildModal
            isOpen={isAddChildModalOpen}
            onClose={() => setIsAddChildModalOpen(false)}
            onSuccess={fetchChildrenAndLogs}
            userId={session.user.id}
        />
        )}
    </div>
  );
};
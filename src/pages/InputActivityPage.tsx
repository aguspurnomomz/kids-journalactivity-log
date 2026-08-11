import { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ActivityForm } from '../components/ActivityForm';
import { type Child, type ActivityLog } from '../types/database';
import { Plus, Baby, Sparkles, Calendar, ArrowRight, X, Images } from 'lucide-react';
import { ChildModal } from '../components/ChildModal';

export const InputActivityPage = () => {
  const { session } = useOutletContext<{ session: any }>();
  const navigate = useNavigate();

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  const fetchChildren = async () => {
    if (!session?.user) return;

    const { data } = await supabase
      .from('children')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true });

    if (data && data.length > 0) {
      setChildren(data);
      if (!selectedChildId) {
        setSelectedChildId(data[0].id);
      }
    } else {
      setChildren([]);
    }
    setLoading(false);
  };

  const fetchLogs = async (childId: string) => {
    if (!childId) return;
    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('child_id', childId)
      .order('logged_at', { ascending: false });

    setLogs(data || []);
  };

  useEffect(() => {
    fetchChildren();
  }, [session]);

  useEffect(() => {
    if (selectedChildId) {
      fetchLogs(selectedChildId);
    }
  }, [selectedChildId]);

  const handleSaved = () => {
    if (selectedChildId) {
      fetchLogs(selectedChildId); 
    }
  };

  if (loading) {
    return <div className="text-slate-400 font-medium py-12 text-center text-xs">Memuat data...</div>;
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Banner tanpa gradien, warna solid toska ceria */}
      <div className="bg-[#01acbf] text-white p-7 rounded-3xl shadow-lg shadow-teal-100/50 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Sparkles className="w-32 h-32 absolute -right-6 -bottom-6 text-white/10" />
        <Sparkles className="w-16 h-16 absolute right-32 top-2 text-white/10" />

        <div className="relative z-10 max-w-md">
          <span className="text-[10px] font-bold tracking-widest uppercase bg-white/20 px-3 py-1 rounded-full text-white backdrop-blur-md">
            Input Aktivitas Harian
          </span>
          <h2 className="text-2xl font-bold mt-2 leading-snug">
            Jurnal Aktivitas Hari Ini
          </h2>
          <p className="text-xs text-teal-50 mt-1">
            Pilih profil anak dan isi detail jurnal aktivitas harian secara teratur.
          </p>
        </div>

        {children.length > 0 && (
          <button
            onClick={() => setIsAddChildModalOpen(true)}
            className="relative z-10 flex items-center justify-center gap-2 bg-white text-[#01acbf] hover:bg-teal-50 px-5 py-3 rounded-full text-xs font-semibold transition shadow-md shrink-0"
          >
            <Plus className="w-4 h-4" /> Tambah Data Anak
          </button>
        )}
      </div>

      {children.length > 0 ? (
        <div className="space-y-6">
          {/* Selector Anak */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-2">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChildId(child.id)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-semibold transition flex items-center gap-2 border shrink-0 ${
                    selectedChildId === child.id
                      ? 'bg-[#01acbf] text-white border-[#01acbf] shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200/60 hover:bg-slate-100'
                  }`}
                >
                  <span>{child.name}</span>
                  <span className="opacity-80">({child.gender === 'L' ? '👦' : '👧'})</span>
                </button>
              ))}
            </div>
          </div>

          {selectedChildId && (
            <ActivityForm childId={selectedChildId} onSave={handleSaved} />
          )}

          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#01acbf]" /> Riwayat Aktivitas
              </h3>
              <button
                onClick={() => navigate('/log-aktivitas')}
                className="text-xs font-bold text-[#01acbf] hover:underline flex items-center gap-1"
              >
                Lihat Semua Aktivitas <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {logs.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 text-xs">
                Belum ada catatan aktivitas untuk anak ini.
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log: any) => {
                  const photos: string[] = 
                    Array.isArray(log.image_urls) && log.image_urls.length > 0
                      ? log.image_urls
                      : log.image_url || log.photo_url
                      ? [log.image_url || log.photo_url]
                      : [];

                  return (
                    <div
                      key={log.id}
                      className="bg-white p-5 rounded-3xl border border-slate-100 hover:border-teal-100 transition shadow-xs space-y-3"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-50 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold bg-teal-50 text-[#01acbf] px-2.5 py-0.5 rounded-full">
                            {log.activity_category}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {log.logged_at ? new Date(log.logged_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <div>Durasi: <strong className="text-slate-700">{log.duration_minutes}m</strong></div>
                          <span className="text-slate-200">•</span>
                          <div>Bantuan: <strong className="text-slate-700">{log.assistance_level}</strong></div>
                          <span className="text-slate-200">•</span>
                          <div>Fokus: <strong className="text-[#01acbf] font-bold">{log.focus_score}/5</strong></div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{log.activity_name}</h4>
                        {log.notes && (
                          <p className="text-xs text-slate-600 bg-[#FAF9F6] p-3 rounded-2xl border border-slate-100/60 mt-2">
                            {log.notes}
                          </p>
                        )}
                      </div>

                      {photos.length > 0 && (
                        <div className="pt-2">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 mb-2">
                            <Images className="w-3.5 h-3.5 text-[#01acbf]" /> Foto Dokumentasi ({photos.length})
                          </div>
                          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
                            {photos.map((photoUrl, idx) => (
                              <div
                                key={idx}
                                onClick={() => setSelectedImageUrl(photoUrl)}
                                className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-slate-100 shrink-0 cursor-pointer hover:opacity-90 transition group shadow-2xs"
                              >
                                <img
                                  src={photoUrl}
                                  alt={`${log.activity_name} ${idx + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#01acbf] flex items-center justify-center mx-auto">
            <Baby className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Belum ada profil anak terhubung. Tambahkan profil anak terlebih dahulu sebelum mengisi jurnal.
          </p>
          <button
            onClick={() => setIsAddChildModalOpen(true)}
            className="inline-flex items-center gap-2 bg-[#01acbf] hover:bg-[#0198a8] text-white font-semibold text-xs px-5 py-2.5 rounded-2xl transition shadow-md shadow-teal-100"
          >
            <Plus className="w-4 h-4" /> Tambah Data Anak
          </button>
        </div>
      )}

      {selectedImageUrl && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedImageUrl(null)}
        >
          <div className="relative max-w-2xl w-full bg-white p-2 rounded-3xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedImageUrl(null)}
              className="absolute top-4 right-4 p-2 bg-slate-900/60 hover:bg-slate-900 text-white rounded-full transition z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={selectedImageUrl} alt="Preview Foto" className="w-full max-h-[80vh] object-contain rounded-2xl" />
          </div>
        </div>
      )}

      {session?.user && (
        <ChildModal
          isOpen={isAddChildModalOpen}
          onClose={() => setIsAddChildModalOpen(false)}
          onSuccess={fetchChildren}
          userId={session.user.id}
        />
      )}
    </div>
  );
};
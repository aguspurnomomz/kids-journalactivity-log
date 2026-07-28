import { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { type Child, type ActivityLog } from '../types/database';
import { Sparkles, ArrowLeft, Filter, Calendar, RefreshCw, X, Images } from 'lucide-react';

export const ActivityLogsPage = () => {
  const { session } = useOutletContext<{ session: any }>();
  const navigate = useNavigate();

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    const fetchChildren = async () => {
      if (!session?.user) return;

      const { data } = await supabase
        .from('children')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true });

      if (data && data.length > 0) {
        setChildren(data);
        setSelectedChildId(data[0].id);
      }
      setLoading(false);
    };

    fetchChildren();
  }, [session]);

  const fetchLogs = async () => {
    if (!selectedChildId) return;

    let query = supabase
      .from('activity_logs')
      .select('*')
      .eq('child_id', selectedChildId)
      .order('logged_at', { ascending: false });

    if (filterCategory !== 'all') {
      query = query.eq('activity_category', filterCategory);
    }

    if (startDate) {
      query = query.gte('logged_at', `${startDate}T00:00:00`);
    }

    if (endDate) {
      query = query.lte('logged_at', `${endDate}T23:59:59`);
    }

    const { data } = await query;
    setLogs(data || []);
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedChildId, filterCategory, startDate, endDate]);

  const handleResetFilter = () => {
    setFilterCategory('all');
    setStartDate('');
    setEndDate('');
  };

  if (loading) {
    return <div className="text-slate-400 font-medium py-12 text-center text-xs">Memuat log aktivitas...</div>;
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 text-white p-7 rounded-3xl shadow-lg shadow-indigo-200/50 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Sparkles className="w-32 h-32 absolute -right-6 -bottom-6 text-indigo-400/30" />
        <Sparkles className="w-16 h-16 absolute right-32 top-2 text-indigo-300/20" />

        <div className="relative z-10 max-w-md">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md mb-3 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali
          </button>
          <h2 className="text-2xl font-bold leading-snug">Riwayat Semua Aktivitas</h2>
          <p className="text-xs text-indigo-100 mt-1">
            Filter dan pantau seluruh aktivitas harian anak anda.
          </p>
        </div>
      </div>

      {children.length > 0 ? (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-5">
            <div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => setSelectedChildId(child.id)}
                    className={`px-4 py-2 rounded-2xl text-xs font-semibold transition flex items-center gap-2 border shrink-0 ${
                      selectedChildId === child.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200/60 hover:bg-slate-100'
                    }`}
                  >
                    <span>{child.name}</span>
                    <span className="opacity-80">({child.gender === 'L' ? '👦' : '👧'})</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-indigo-600" /> Kategori Kegiatan
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full p-2.5 border border-slate-200/80 rounded-2xl text-xs bg-white focus:outline-none"
                >
                  <option value="all">Semua Kategori</option>
                  <option value="Motorik Halus (Menulis, Mencepit, Memotong)">Motorik Halus</option>
                  <option value="Motorik Kasar (Melompat, Berlari, Lempar Bola)">Motorik Kasar</option>
                  <option value="Koordinasi & Keseimbangan">Koordinasi & Keseimbangan</option>
                  <option value="Sensori / Permainan Tekstur">Sensori</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Dari Tanggal
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-200/80 rounded-2xl text-xs bg-white focus:outline-none"
                />
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Sampai Tanggal
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200/80 rounded-2xl text-xs bg-white focus:outline-none"
                  />
                </div>

                {(filterCategory !== 'all' || startDate || endDate) && (
                  <button
                    onClick={handleResetFilter}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition flex items-center justify-center shrink-0"
                    title="Reset Filter"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-500">
                Menampilkan {logs.length} catatan aktivitas
              </span>
            </div>

            {logs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 text-xs">
                Tidak ada riwayat aktivitas yang sesuai dengan filter.
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log: any) => {
                  // Ekstrak array foto dari image_urls (JSONB) atau fallback ke image_url/photo_url lama
                  const photos: string[] = 
                    Array.isArray(log.image_urls) && log.image_urls.length > 0
                      ? log.image_urls
                      : log.image_url || log.photo_url
                      ? [log.image_url || log.photo_url]
                      : [];

                  return (
                    <div
                      key={log.id}
                      className="bg-white p-5 rounded-3xl border border-slate-100 hover:border-indigo-100 transition shadow-xs space-y-3"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-50 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full">
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
                          <div>Fokus: <strong className="text-indigo-600 font-bold">{log.focus_score}/5</strong></div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{log.activity_name}</h4>
                        {log.notes && (
                          <p className="text-xs text-slate-600 bg-slate-50/70 p-3 rounded-2xl border border-slate-100/60 mt-2">
                            {log.notes}
                          </p>
                        )}
                      </div>

                      {photos.length > 0 && (
                        <div className="pt-2">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 mb-2">
                            <Images className="w-3.5 h-3.5 text-indigo-600" /> Foto Dokumentasi ({photos.length})
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
        <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 text-xs">
          Belum ada profil anak terhubung.
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
    </div>
  );
};
import { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ActivityForm } from '../components/ActivityForm';
import { type Child, type ActivityLog } from '../types/database';
import { Plus, Baby, Sparkles, Calendar, ArrowRight, X, CalendarCheck, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { ChildModal } from '../components/ChildModal';

interface ScheduleItem {
  id: string;
  child_id: string;
  day_of_week: string;
  time_slot: string;
  category: string;
  activity_title: string;
}

export const InputActivityPage = () => {
  const { session } = useOutletContext<{ session: any }>();
  const navigate = useNavigate();

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [todaysSchedules, setTodaysSchedules] = useState<ScheduleItem[]>([]);
  
  // State untuk pagination (5 data per halaman)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  // State untuk pre-fill form jika user klik dari jadwal
  const [prefilledCategory, setPrefilledCategory] = useState<string>('');
  const [prefilledName, setPrefilledName] = useState<string>('');

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

  const fetchLogsAndSchedules = async (childId: string) => {
    if (!childId) return;

    const { data: logsData } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('child_id', childId)
      .order('logged_at', { ascending: false });

    setLogs(logsData || []);
    setCurrentPage(1); 

    const daysName = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const currentDayName = daysName[new Date().getDay()];

    const { data: scheduleData } = await supabase
      .from('activity_schedules')
      .select('*')
      .eq('child_id', childId)
      .eq('day_of_week', currentDayName)
      .order('time_slot', { ascending: true });

    setTodaysSchedules(scheduleData || []);
  };

  useEffect(() => {
    fetchChildren();
  }, [session]);

  useEffect(() => {
    if (selectedChildId) {
      fetchLogsAndSchedules(selectedChildId);
    }
  }, [selectedChildId]);

  const handleSaved = () => {
    if (selectedChildId) {
      fetchLogsAndSchedules(selectedChildId); 
      setPrefilledCategory('');
      setPrefilledName('');
    }
  };

  const handleSelectScheduleToLog = (schedule: ScheduleItem) => {
    setPrefilledCategory(schedule.category);
    setPrefilledName(schedule.activity_title);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const totalPages = Math.ceil(logs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentLogs = logs.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return <div className="text-slate-400 font-medium py-12 text-center text-xs">Memuat data...</div>;
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12">
      {/* Banner */}
      <div className="bg-[#01acbf] text-white p-6 sm:p-7 rounded-3xl shadow-lg shadow-teal-100/50 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Sparkles className="w-32 h-32 absolute -right-6 -bottom-6 text-white/10" />
        <Sparkles className="w-16 h-16 absolute right-32 top-2 text-white/10" />

        <div className="relative z-10 max-w-md">
          <span className="text-[10px] font-bold tracking-widest uppercase bg-white/20 px-3 py-1 rounded-full text-white backdrop-blur-md">
            Input Aktivitas Harian
          </span>
          <h2 className="text-xl sm:text-2xl font-bold mt-2 leading-snug">
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

          {/* WIDGET AGENDA JADWAL HARI INI */}
          {todaysSchedules.length > 0 && (
            <div className="bg-teal-50/60 p-5 rounded-3xl border border-teal-100 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#01acbf] flex items-center gap-1.5">
                  <CalendarCheck className="w-4 h-4" /> Agenda Jadwal Rutin Hari Ini
                </h3>
                <span className="text-[10px] font-semibold text-teal-700 bg-white px-2.5 py-0.5 rounded-full border border-teal-100">
                  {todaysSchedules.length} Agenda
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {todaysSchedules.map((sch) => (
                  <div key={sch.id} className="bg-white p-3.5 rounded-2xl border border-teal-100/80 flex items-center justify-between gap-3 shadow-2xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#01acbf]">
                        <Clock className="w-3 h-3" /> {sch.time_slot} WIB
                      </div>
                      <h4 className="font-bold text-slate-800 text-xs">{sch.activity_title}</h4>
                      <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{sch.category}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectScheduleToLog(sch)}
                      className="px-3 py-1.5 bg-[#01acbf] hover:bg-[#0198a8] text-white text-[11px] font-semibold rounded-xl transition shadow-xs shrink-0"
                    >
                      Mulai Sesi
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form Input Aktivitas (bisa menerima prefill dari jadwal) */}
          {selectedChildId && (
            <ActivityForm 
              childId={selectedChildId} 
              onSave={handleSaved} 
              initialCategory={prefilledCategory}
              initialActivityName={prefilledName}
            />
          )}

          {/* Riwayat Aktivitas */}
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
              <div className="space-y-3">
                <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto scrollbar-thin">
                    <table className="w-full min-w-[780px] text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-teal-50/60 text-slate-600 font-bold border-b border-slate-100">
                          <th className="p-3.5 w-36">Tanggal & Waktu</th>
                          <th className="p-3.5 w-64">Kategori & Aktivitas</th>
                          <th className="p-3.5 w-20">Durasi</th>
                          <th className="p-3.5 w-32">Bantuan</th>
                          <th className="p-3.5 w-20">Fokus</th>
                          <th className="p-3.5">Catatan & Foto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {currentLogs.map((log: any) => {
                          const photos: string[] = 
                            Array.isArray(log.image_urls) && log.image_urls.length > 0
                              ? log.image_urls
                              : log.image_url || log.photo_url
                              ? [log.image_url || log.photo_url]
                              : [];

                          return (
                            <tr key={log.id} className="hover:bg-slate-50/50 transition align-top">
                              <td className="p-3.5 text-slate-500 whitespace-nowrap">
                                {log.logged_at ? new Date(log.logged_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                              </td>
                              <td className="p-3.5 space-y-1.5">
                                <span className="inline-block text-[10px] font-bold bg-teal-50 text-[#01acbf] px-2.5 py-1 rounded-xl whitespace-normal leading-tight">
                                  {log.activity_category}
                                </span>
                                <div className="font-bold text-slate-800 text-xs">{log.activity_name}</div>
                              </td>
                              <td className="p-3.5 whitespace-nowrap">
                                <strong className="text-slate-700">{log.duration_minutes}m</strong>
                              </td>
                              <td className="p-3.5 whitespace-nowrap">
                                <strong className="text-slate-700">{log.assistance_level}</strong>
                              </td>
                              <td className="p-3.5 whitespace-nowrap">
                                <strong className="text-[#01acbf] font-bold">{log.focus_score}/5</strong>
                              </td>
                              <td className="p-3.5 space-y-2 min-w-[220px]">
                                {log.notes && (
                                  <p className="text-slate-600 bg-[#FAF9F6] p-2.5 rounded-xl border border-slate-100/60 text-[11px] leading-relaxed">
                                    {log.notes}
                                  </p>
                                )}
                                {photos.length > 0 && (
                                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                                    {photos.map((photoUrl, idx) => (
                                      <div
                                        key={idx}
                                        onClick={() => setSelectedImageUrl(photoUrl)}
                                        className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 shrink-0 cursor-pointer hover:opacity-90 transition shadow-2xs"
                                      >
                                        <img
                                          src={photoUrl}
                                          alt={`${log.activity_name} ${idx + 1}`}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Kontrol Pagination (5 data per halaman) */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-2 pt-2">
                    <span className="text-[11px] text-slate-500">
                      Halaman {currentPage} dari {totalPages} (Total {logs.length} data)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      
                      <span className="text-xs font-bold px-3 py-1 bg-teal-50 text-[#01acbf] rounded-xl border border-teal-100">
                        {currentPage} / {totalPages}
                      </span>

                      <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
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
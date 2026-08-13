import { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { type Child } from '../types/database';
import { CalendarDays, Clock, Plus, Trash2, Sparkles, BookOpen, ChevronLeft, ChevronRight, X, Activity, Play, ArrowRight } from 'lucide-react';
import { ActivityForm } from '../components/ActivityForm';

interface ScheduleItem {
  id: string;
  child_id: string;
  schedule_date: string; 
  time_slot: string;     
  category: string;
  activity_title: string;
  children?: { name: string };
}

const DEFAULT_CATEGORIES = [
  'Motorik Halus (Menulis, Mencepit, Memotong)',
  'Motorik Kasar (Melompat, Berlari, Lempar Bola)',
  'Koordinasi & Keseimbangan',
  'Sensori / Permainan Tekstur',
];

export const SchedulesPage = () => {
  const { session } = useOutletContext<{ session: any }>();
  const navigate = useNavigate(); 
  
  const [children, setChildren] = useState<Child[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  
  const todayStr = new Date().toISOString().split('T')[0];

  const [scheduleDate, setScheduleDate] = useState(todayStr);
  const [timeSlot, setTimeSlot] = useState('09:00');
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [activityTitle, setActivityTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const [dateSchedulesModal, setDateSchedulesModal] = useState<ScheduleItem[] | null>(null);
  const [activeScheduleForLog, setActiveScheduleForLog] = useState<ScheduleItem | null>(null);

  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  const fetchData = async () => {
    if (!session?.user) return;

    const { data: childrenData } = await supabase
      .from('children')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true });

    if (childrenData && childrenData.length > 0) {
      setChildren(childrenData);
      if (!selectedChildId) setSelectedChildId(childrenData[0].id);
    }

    const { data: scheduleData } = await supabase
      .from('activity_schedules')
      .select('*, children(name)')
      .eq('user_id', session.user.id)
      .order('schedule_date', { ascending: true });

    setSchedules(scheduleData || []);
  };

  useEffect(() => {
    fetchData();
  }, [session]);

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId || !activityTitle.trim() || !scheduleDate) {
      alert('Pilih anak, tanggal, dan isi nama kegiatan terlebih dahulu!');
      return;
    }

    if (scheduleDate < todayStr) {
      alert('Tidak dapat membuat jadwal di tanggal yang sudah lewat!');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('activity_schedules').insert({
      user_id: session.user.id,
      child_id: selectedChildId,
      schedule_date: scheduleDate,
      time_slot: timeSlot,
      category,
      activity_title: activityTitle.trim(),
    });

    setLoading(false);

    if (error) {
      alert('Gagal menyimpan jadwal: ' + error.message);
    } else {
      setActivityTitle('');
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus jadwal ini?')) return;
    await supabase.from('activity_schedules').delete().eq('id', id);
    fetchData();
    setDateSchedulesModal(null);
  };

  const handleDateCellClick = (dateString: string, daySchedules: ScheduleItem[]) => {
    if (daySchedules.length > 0) {
      setDateSchedulesModal(daySchedules);
    } else {
      if (dateString < todayStr) {
        alert('Tanggal tersebut sudah lewat dan tidak dapat diisi jadwal.');
        return;
      }
      setScheduleDate(dateString);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStartSchedule = (targetSchedule: ScheduleItem) => {
    const scheduledDateTime = new Date(`${targetSchedule.schedule_date}T${targetSchedule.time_slot}:00`);
    const now = new Date();

    if (now < scheduledDateTime) {
      alert(`Sesi latihan ini baru bisa dimulai pada pukul ${targetSchedule.time_slot} WIB.`);
      return;
    }

    setDateSchedulesModal(null);
    setActiveScheduleForLog(targetSchedule);
  };

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const blankDaysCount = firstDayOfMonth; 
  const totalSlots = Array.from({ length: blankDaysCount + daysInMonth });

  const handlePrevMonth = () => setCurrentMonthDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentMonthDate(new Date(year, month + 1, 1));

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 px-3 sm:px-0 pb-12">
      <div className="bg-[#01acbf] text-white p-5 sm:p-7 rounded-3xl shadow-lg shadow-teal-100/50 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Sparkles className="w-24 h-24 sm:w-32 sm:h-32 absolute -right-6 -bottom-6 text-white/10" />
        <div className="relative z-10 max-w-md">
          <span className="text-[10px] font-bold tracking-widest uppercase bg-white/20 px-3 py-1 rounded-full text-white backdrop-blur-md">
            Agenda Kegiatan
          </span>
          <h1 className="text-lg sm:text-2xl font-bold mt-2 leading-snug">
            Buat agenda kegiatan berdasarkan kalender 
          </h1>
          <p className="text-xs text-teal-50 mt-1">
            Klik tanggal beragenda untuk memilih dan memulai sesi latihan sesuai waktunya.
          </p>
        </div>

        <button
          onClick={() => navigate('/log-aktivitas')}
          className="relative z-10 flex items-center justify-center gap-2 bg-white text-[#01acbf] hover:bg-teal-50 px-5 py-3 rounded-full text-xs font-semibold transition shadow-md shrink-0"
        >
          Lihat Semua Aktivitas <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Form Tambah Jadwal */}
      <form onSubmit={handleAddSchedule} className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-[#01acbf]" /> Tambah Jadwal Baru
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Pilih Anak</label>
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="w-full p-2.5 border border-slate-200/80 rounded-2xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#01acbf]/20"
            >
              {children.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5 text-[#01acbf]" /> Pilih Tanggal (Minimal Hari Ini)
            </label>
            <input
              type="date"
              required
              min={todayStr}
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="w-full p-2.5 border border-slate-200/80 rounded-2xl text-xs bg-teal-50/50 border-teal-200 text-[#01acbf] font-bold focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#01acbf]" /> Jam / Waktu
            </label>
            <input
              type="time"
              required
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="w-full p-2.5 border border-slate-200/80 rounded-2xl text-xs bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Kategori Latihan</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2.5 border border-slate-200/80 rounded-2xl text-xs bg-white focus:outline-none"
            >
              {DEFAULT_CATEGORIES.map((cat, idx) => (
                <option key={idx} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Nama / Topik Kegiatan</label>
            <input
              type="text"
              required
              placeholder="e.g. Latihan Menulis Huruf A"
              value={activityTitle}
              onChange={(e) => setActivityTitle(e.target.value)}
              className="w-full p-2.5 border border-slate-200/80 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-[#01acbf]/20"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto bg-[#01acbf] hover:bg-[#0198a8] text-white font-semibold px-5 py-2.5 rounded-2xl text-xs transition shadow-md shadow-teal-100 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> {loading ? 'Menyimpan...' : 'Simpan Jadwal'}
        </button>
      </form>


      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#01acbf]" /> Kalender Kegiatan
          </h3>
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 bg-[#FAF9F6] px-3 py-1.5 rounded-2xl border border-slate-100">
            <span className="text-xs font-bold text-slate-700">
              {monthNames[month]} {year}
            </span>
            <div className="flex gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 rounded-xl transition shadow-2xs"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 rounded-xl transition shadow-2xs"
                title="Bulan Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto pb-2 scrollbar-thin">
          <div className="min-w-[500px] space-y-2">
            {/* Header Hari (Min - Sab) */}
            <div className="grid grid-cols-7 gap-1.5 text-center font-bold text-[11px] text-slate-400 pb-2 border-b border-slate-100">
              <div>Min</div>
              <div>Sen</div>
              <div>Sel</div>
              <div>Rab</div>
              <div>Kam</div>
              <div>Jum</div>
              <div>Sab</div>
            </div>

            {/* Grid Kalender 7 Kolom */}
            <div className="grid grid-cols-7 gap-1.5">
              {totalSlots.map((_, index) => {
                if (index < blankDaysCount) {
                  return <div key={`blank-${index}`} className="min-h-[95px] bg-slate-50/30 rounded-2xl opacity-30"></div>;
                }

                const dayNumber = index - blankDaysCount + 1;
                const formattedMonth = String(month + 1).padStart(2, '0');
                const formattedDay = String(dayNumber).padStart(2, '0');
                const dateString = `${year}-${formattedMonth}-${formattedDay}`;

                const daySchedules = schedules.filter((s) => s.schedule_date === dateString);
                const isToday = todayStr === dateString;
                const isPast = dateString < todayStr;
                const hasSchedule = daySchedules.length > 0;

                return (
                  <div
                    key={`day-${dayNumber}`}
                    onClick={() => handleDateCellClick(dateString, daySchedules)}
                    className={`min-h-[105px] p-2 rounded-2xl border flex flex-col justify-start gap-1 transition ${
                      isPast 
                        ? 'bg-slate-50/60 border-slate-100 opacity-60 cursor-not-allowed' 
                        : hasSchedule
                        ? 'border-teal-200 bg-teal-50/30 ring-1 ring-teal-100 cursor-pointer hover:border-[#01acbf]'
                        : isToday 
                        ? 'border-teal-300 bg-teal-50/20 cursor-pointer hover:border-[#01acbf]' 
                        : 'border-slate-100 bg-[#FAF9F6] cursor-pointer hover:border-[#01acbf]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isToday ? 'bg-[#01acbf] text-white w-5 h-5 rounded-full flex items-center justify-center' : 'text-slate-700'}`}>
                        {dayNumber}
                      </span>
                    </div>

                    <div className="space-y-1 overflow-hidden">
                      {daySchedules.slice(0, 2).map((item) => (
                        <div
                          key={item.id}
                          className="bg-white p-1 rounded-lg border border-teal-100 text-[10px] truncate shadow-2xs"
                        >
                          <span className="font-bold text-[#01acbf]">{item.time_slot}</span>
                        </div>
                      ))}
                      {daySchedules.length > 2 && (
                        <span className="text-[9px] text-[#01acbf] font-bold block text-center">
                          +{daySchedules.length - 2} agenda
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {dateSchedulesModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setDateSchedulesModal(null)}
        >
          <div
            className="relative max-w-md w-full bg-white p-5 sm:p-6 rounded-3xl shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#01acbf] uppercase tracking-wider">Daftar Agenda</span>
                <h3 className="font-bold text-slate-800 text-xs sm:text-sm">
                  {new Date(dateSchedulesModal[0].schedule_date).toLocaleDateString('id-ID', { dateStyle: 'full' })}
                </h3>
              </div>
              <button
                onClick={() => setDateSchedulesModal(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {dateSchedulesModal.map((sch) => {
                const scheduledDateTime = new Date(`${sch.schedule_date}T${sch.time_slot}:00`);
                const isReady = new Date() >= scheduledDateTime;

                return (
                  <div key={sch.id} className="p-3.5 sm:p-4 rounded-2xl border border-teal-100 bg-teal-50/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold bg-[#01acbf] text-white px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {sch.time_slot} WIB
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isReady ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {isReady ? '✔ Waktu Tiba' : '⏳ Belum berlangsung '}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-800 text-xs sm:text-sm">{sch.activity_title}</h4>
                      <p className="text-[11px] text-slate-500">{sch.category}</p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-teal-100/60">
                      <button
                        type="button"
                        onClick={() => handleDelete(sch.id)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold rounded-xl text-xs transition flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartSchedule(sch)}
                        className={`px-4 py-1.5 font-semibold rounded-xl text-xs transition shadow-sm flex items-center gap-1 ${
                          isReady 
                            ? 'bg-[#01acbf] hover:bg-[#0198a8] text-white' 
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5" /> Mulai Sesi
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeScheduleForLog && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => setActiveScheduleForLog(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-white p-4 sm:p-6 rounded-3xl shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-50 text-[#01acbf] rounded-xl">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-xs sm:text-sm">Catat Aktivitas Agenda</h3>
                  <p className="text-[11px] text-slate-400">
                    {new Date(activeScheduleForLog.schedule_date).toLocaleDateString('id-ID', { dateStyle: 'medium' })} • Pukul {activeScheduleForLog.time_slot} WIB
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveScheduleForLog(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ActivityForm
              childId={activeScheduleForLog.child_id}
              initialCategory={activeScheduleForLog.category}
              initialActivityName={activeScheduleForLog.activity_title}
              onSave={() => {
                alert('Aktivitas berhasil dicatat!');
                setActiveScheduleForLog(null);
                fetchData();
              }}
            />

            <div className="flex items-center justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveScheduleForLog(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { type Child } from '../types/database';
import { Calendar as CalendarIcon, Plus, Trash2, Bell, Clock, Phone, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ScheduledReminder {
  id: string;
  title: string;
  scheduled_time: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  whatsapp_number: string;
  child_id: string;
  children?: { name: string };
}

export const RemindersPage = () => {
  const { session } = useOutletContext<{ session: any }>();
  const [children, setChildren] = useState<Child[]>([]);
  const [reminders, setReminders] = useState<ScheduledReminder[]>([]);
  
  // Form State
  const [selectedChildId, setSelectedChildId] = useState('');
  const [title, setTitle] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!session?.user) return;

    // Fetch Anak
    const { data: childrenData } = await supabase
      .from('children')
      .select('*')
      .eq('user_id', session.user.id);
      
    if (childrenData && childrenData.length > 0) {
      setChildren(childrenData);
      setSelectedChildId(childrenData[0].id);
    }

    // Fetch Jadwal Pengingat
    const { data: remindersData } = await supabase
      .from('scheduled_reminders')
      .select('*, children(name)')
      .eq('user_id', session.user.id)
      .order('scheduled_time', { ascending: true });

    setReminders(remindersData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [session]);

  const handleSaveReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !scheduledTime || !whatsappNumber || !selectedChildId) {
      alert('Harap lengkapi semua field!');
      return;
    }

    if (new Date(scheduledTime) <= new Date()) {
      alert('Waktu pelaksanaan harus di masa depan!');
      return;
    }

    setIsSaving(true);

    try {
      // Format Nomor HP
      let formattedPhone = whatsappNumber.trim();
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '62' + formattedPhone.slice(1);
      }

      // 1. Insert ke scheduled_reminders
      const { data: reminderData, error: reminderError } = await supabase
        .from('scheduled_reminders')
        .insert({
          user_id: session.user.id,
          child_id: selectedChildId,
          title: title.trim(),
          scheduled_time: new Date(scheduledTime).toISOString(),
          whatsapp_number: formattedPhone,
          status: 'pending',
        })
        .select()
        .single();

      if (reminderError) throw reminderError;

      // 2. Generate Personal Message & Insert ke scheduled_reminder_tasks
      const childObj = children.find((c) => c.id === selectedChildId);
      const messageContent = `*PENGINGAT LATIHAN MOTORIK* 🔔\n\nHalo Ayah/Bunda! Saatnya dampingi *${childObj?.name || 'Anak'}* untuk latihan motorik.\n\n📌 *Agenda:* ${title.trim()}\n⏰ *Jadwal:* ${new Date(scheduledTime).toLocaleString('id-ID')}\n\nMari catat perkembangannya di aplikasi! 💪🏼`;

      const { error: taskError } = await supabase.from('scheduled_reminder_tasks').insert({
        reminder_id: reminderData.id,
        whatsapp_number: formattedPhone,
        message_content: messageContent,
        status: 'pending',
      });

      if (taskError) throw taskError;

      // Reset
      setTitle('');
      setScheduledTime('');
      setWhatsappNumber('');
      fetchData();
      alert('Jadwal pengingat WhatsApp berhasil disimpan!');
    } catch (err: any) {
      alert('Gagal menyimpan jadwal: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus pengingat ini?')) return;
    await supabase.from('scheduled_reminders').delete().eq('id', id);
    fetchData();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">Menunggu</span>;
      case 'completed':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">Terkirim</span>;
      case 'failed':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100">Gagal</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">Proses</span>;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Bell className="w-5 h-5 text-indigo-600" /> Pengingat Latihan via WhatsApp
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Atur jadwal pengingat otomatis yang akan dikirim langsung ke WhatsApp Ayah/Bunda via Fonnte.
        </p>
      </div>

      {/* Form Tambah Pengingat */}
      <form onSubmit={handleSaveReminder} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800">Buat Jadwal Pengingat Baru</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Pilih Anak</label>
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="w-full p-2.5 border border-slate-200/80 rounded-2xl text-xs bg-white focus:outline-none"
            >
              {children.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Agenda / Topik Latihan</label>
            <input
              type="text"
              required
              placeholder="e.g. Latihan Mencepit Pinset & Lempar Bola"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 border border-slate-200/80 rounded-2xl text-xs focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Waktu Pelaksanaan
            </label>
            <input
              type="datetime-local"
              required
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full p-2.5 border border-slate-200/80 rounded-2xl text-xs bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" /> Nomor WhatsApp Tujuan
            </label>
            <input
              type="tel"
              required
              placeholder="e.g. 081234567890"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="w-full p-2.5 border border-slate-200/80 rounded-2xl text-xs focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-2xl text-xs transition shadow-md shadow-indigo-100 flex items-center gap-2 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {isSaving ? 'Memproses...' : 'Simpan Jadwal Pengingat'}
        </button>
      </form>

      {/* List Daftar Pengingat */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800">Daftar Jadwal Pengingat</h3>

        {loading ? (
          <div className="text-center py-8 text-xs text-slate-400">Memuat data pengingat...</div>
        ) : reminders.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-200 rounded-3xl text-slate-400 text-xs">
            Belum ada jadwal pengingat yang dibuat.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="pb-3 font-semibold">Anak</th>
                  <th className="pb-3 font-semibold">Agenda</th>
                  <th className="pb-3 font-semibold">Waktu Kirim</th>
                  <th className="pb-3 font-semibold">No. WhatsApp</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {reminders.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 font-bold text-slate-800">{r.children?.name || '-'}</td>
                    <td className="py-3.5 text-slate-600">{r.title}</td>
                    <td className="py-3.5 text-slate-500">
                      {new Date(r.scheduled_time).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="py-3.5 text-slate-500">{r.whatsapp_number}</td>
                    <td className="py-3.5">{getStatusBadge(r.status)}</td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-xl transition"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
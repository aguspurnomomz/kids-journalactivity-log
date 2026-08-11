import { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { type Child, type ActivityLog } from '../types/database';
import { Sparkles, ArrowLeft, Filter, Calendar, RefreshCw, X, Images, Edit3, Camera, Loader2, Check } from 'lucide-react';

export const ActivityLogsPage = () => {
  const { session } = useOutletContext<{ session: any }>();
  const navigate = useNavigate();

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  // Filter States
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Edit Modal / State (Diubah ke string agar saat dihapus tidak meninggalkan angka 0)
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editDuration, setEditDuration] = useState<string>('15');
  const [editAssistance, setEditAssistance] = useState<string>('');
  const [editFocusScore, setEditFocusScore] = useState<string>('4');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editPhotos, setEditPhotos] = useState<string[]>([]); // URL foto yang ada
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

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

  // Handler Buka Form Edit
  const handleStartEdit = (log: any) => {
    setEditingLogId(log.id);
    setEditDuration(log.duration_minutes ? String(log.duration_minutes) : '15');
    setEditAssistance(log.assistance_level || 'Partial Support');
    setEditFocusScore(log.focus_score ? String(log.focus_score) : '4');
    setEditNotes(log.notes || '');
    
    const existingPhotos = 
      Array.isArray(log.image_urls) && log.image_urls.length > 0
        ? log.image_urls
        : log.image_url || log.photo_url
        ? [log.image_url || log.photo_url]
        : [];
    setEditPhotos(existingPhotos);
  };

  // Handler Tambah Foto saat Edit
  const handleAddPhotosToEdit = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (editPhotos.length + files.length > 5) {
      alert('Maksimal foto yang dapat diunggah adalah 5 foto per aktivitas!');
      return;
    }

    setUploadingPhoto(true);
    const newUploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `activities/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('activity-photos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('activity-photos')
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          newUploadedUrls.push(publicUrlData.publicUrl);
        }
      }

      setEditPhotos((prev) => [...prev, ...newUploadedUrls]);
    } catch (err: any) {
      alert('Gagal mengunggah foto: ' + err.message);
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleRemovePhotoFromEdit = (indexToRemove: number) => {
    setEditPhotos((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Simpan Perubahan Edit ke Database (Konversi kembali ke angka saat dikirim)
  const handleSaveEdit = async (logId: string) => {
    setSavingEdit(true);

    try {
      const { error } = await supabase
        .from('activity_logs')
        .update({
          duration_minutes: editDuration ? Number(editDuration) : 0,
          assistance_level: editAssistance,
          focus_score: editFocusScore ? Number(editFocusScore) : 1,
          notes: editNotes.trim(),
          image_urls: editPhotos,
          image_url: editPhotos[0] || null,
        })
        .eq('id', logId);

      if (error) throw error;

      setEditingLogId(null);
      fetchLogs();
    } catch (err: any) {
      alert('Gagal memperbarui aktivitas: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) {
    return <div className="text-slate-400 font-medium py-12 text-center text-xs">Memuat log aktivitas...</div>;
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Banner tanpa gradien, warna solid toska ceria */}
      <div className="bg-[#01acbf] text-white p-7 rounded-3xl shadow-lg shadow-teal-100/50 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Sparkles className="w-32 h-32 absolute -right-6 -bottom-6 text-white/10" />
        <Sparkles className="w-16 h-16 absolute right-32 top-2 text-white/10" />

        <div className="relative z-10 max-w-md">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md mb-3 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali
          </button>
          <h2 className="text-2xl font-bold leading-snug">Riwayat Semua Aktivitas</h2>
          <p className="text-xs text-teal-50 mt-1">
            Filter dan pantau seluruh aktivitas harian anak anda.
          </p>
        </div>
      </div>

      {children.length > 0 ? (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-5">
            <div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => setSelectedChildId(child.id)}
                    className={`px-4 py-2 rounded-2xl text-xs font-semibold transition flex items-center gap-2 border shrink-0 ${
                      selectedChildId === child.id
                        ? 'bg-[#01acbf] text-white border-[#01acbf] shadow-xs'
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
                  <Filter className="w-3.5 h-3.5 text-[#01acbf]" /> Kategori Kegiatan
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full p-2.5 border border-slate-200/80 rounded-2xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#01acbf]/20"
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
                  <Calendar className="w-3.5 h-3.5 text-[#01acbf]" /> Dari Tanggal
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-200/80 rounded-2xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#01acbf]/20"
                />
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#01acbf]" /> Sampai Tanggal
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200/80 rounded-2xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#01acbf]/20"
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
                  const isEditing = editingLogId === log.id;

                  // Ambil foto
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
                      {/* HEADER CARD */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-50 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold bg-teal-50 text-[#01acbf] px-2.5 py-0.5 rounded-full">
                            {log.activity_category}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {log.logged_at ? new Date(log.logged_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                          </span>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-3 text-xs text-slate-500">
                          {!isEditing && (
                            <>
                              <div>Durasi: <strong className="text-slate-700">{log.duration_minutes}m</strong></div>
                              <span className="text-slate-200">•</span>
                              <div>Bantuan: <strong className="text-slate-700">{log.assistance_level}</strong></div>
                              <span className="text-slate-200">•</span>
                              <div>Fokus: <strong className="text-[#01acbf] font-bold">{log.focus_score}/5</strong></div>
                              <button
                                onClick={() => handleStartEdit(log)}
                                className="ml-2 px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-[#01acbf] font-semibold rounded-xl transition flex items-center gap-1 text-[11px]"
                              >
                                <Edit3 className="w-3.5 h-3.5" /> Edit
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* NAMA AKTIVITAS */}
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{log.activity_name}</h4>
                      </div>

                      {/* JIKA DALAM MODE EDIT */}
                      {isEditing ? (
                        <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-teal-100 space-y-4 mt-2">
                          <h5 className="text-xs font-bold text-[#01acbf] flex items-center gap-1.5">
                            <Edit3 className="w-3.5 h-3.5" /> Edit Catatan & Detail Latihan
                          </h5>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">Durasi (Menit)</label>
                              <input
                                type="number"
                                min="1"
                                placeholder="e.g. 15"
                                value={editDuration}
                                onChange={(e) => setEditDuration(e.target.value)}
                                className="w-full p-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#01acbf]/20"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">Tingkat Bantuan</label>
                              <select
                                value={editAssistance}
                                onChange={(e) => setEditAssistance(e.target.value)}
                                className="w-full p-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
                              >
                                <option value="Independent">Mandiri (Independent)</option>
                                <option value="Partial Support">Bantuan Parsial</option>
                                <option value="Full Support">Bantuan Penuh</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">Skor Fokus (1-5)</label>
                              <input
                                type="number"
                                min="1"
                                max="5"
                                placeholder="e.g. 4"
                                value={editFocusScore}
                                onChange={(e) => setEditFocusScore(e.target.value)}
                                className="w-full p-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#01acbf]/20"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Catatan Observasi Orang Tua</label>
                            <textarea
                              rows={2}
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              placeholder="Tulis catatan di sini..."
                              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#01acbf]/20"
                            />
                          </div>

                          {/* EDIT / TAMBAH FOTO */}
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="block text-[10px] font-bold text-slate-500">
                                Foto Dokumentasi (Maks. 5 Foto)
                              </label>
                              <span className="text-[10px] font-semibold text-slate-400">
                                {editPhotos.length} / 5 Foto
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-2 items-center">
                              {editPhotos.map((photoUrl, pIdx) => (
                                <div key={pIdx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                                  <img src={photoUrl} alt={`Edit foto ${pIdx + 1}`} className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePhotoFromEdit(pIdx)}
                                    className="absolute top-0.5 right-0.5 p-1 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}

                              {editPhotos.length < 5 && (
                                <label className="w-16 h-16 rounded-xl border-2 border-dashed border-teal-200 hover:bg-teal-50/50 flex flex-col items-center justify-center text-[#01acbf] cursor-pointer transition">
                                  {uploadingPhoto ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Camera className="w-4 h-4 mb-0.5" />
                                      <span className="text-[8px] font-bold">+ Foto</span>
                                    </>
                                  )}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    disabled={uploadingPhoto}
                                    onChange={handleAddPhotosToEdit}
                                    className="hidden"
                                  />
                                </label>
                              )}
                            </div>
                          </div>

                          {/* TOMBOL AKSI EDIT */}
                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-teal-100">
                            <button
                              type="button"
                              onClick={() => setEditingLogId(null)}
                              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              disabled={savingEdit || uploadingPhoto}
                              onClick={() => handleSaveEdit(log.id)}
                              className="px-4 py-1.5 bg-[#01acbf] hover:bg-[#0198a8] text-white font-semibold rounded-xl text-xs transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                            >
                              {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                              {savingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* TAMPILAN NORMAL (BUKAN EDIT) */}
                          {log.notes && (
                            <p className="text-xs text-slate-600 bg-[#FAF9F6] p-3 rounded-2xl border border-slate-100/60 mt-2">
                              {log.notes}
                            </p>
                          )}

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
                        </>
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

      {/* Modal Preview Zoom Gambar */}
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
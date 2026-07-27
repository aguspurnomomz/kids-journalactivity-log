import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { type ActivityLog } from '../types/database';
import { Activity, Clock, Award, Star, Plus, Check, X, Image as ImageIcon, Camera, FileImage } from 'lucide-react';

const DEFAULT_CATEGORIES = [
  'Motorik Halus (Menulis, Mencepit, Memotong)',
  'Motorik Kasar (Melompat, Berlari, Lempar Bola)',
  'Koordinasi & Keseimbangan',
  'Sensori / Permainan Tekstur',
];

export const ActivityForm = ({ childId, onSave }: { childId: string; onSave: () => void }) => {
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_CATEGORIES[0]);

  // State Mode Tambah Kategori
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  // State Form Utama
  const [activityName, setActivityName] = useState('');
  const [duration, setDuration] = useState(15);
  const [assistance, setAssistance] = useState<'Independent' | 'Partial Support' | 'Full Support'>('Partial Support');
  const [focusScore, setFocusScore] = useState(4);
  const [notes, setNotes] = useState('');

  // State Foto Kegiatan
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  // Ref untuk mentrigger klik input tersembunyi
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Fetch Kategori Kustom
  useEffect(() => {
    const fetchCustomCategories = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data } = await supabase
        .from('activity_categories')
        .select('name')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true });

      if (data && data.length > 0) {
        setCategories([...DEFAULT_CATEGORIES, ...data.map((item) => item.name)]);
      }
    };
    fetchCustomCategories();
  }, []);

  // Handler Request Perizinan Kamera & Trigger Input Kamera
  const handleTriggerCamera = async () => {
    try {
      // Minta/Cek perizinan kamera secara langsung ke browser/HP jika didukung
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Matikan stream sementara (hanya untuk pengujian perizinan)
        stream.getTracks().forEach((track) => track.stop());
      }
      // Buka kamera via input file
      cameraInputRef.current?.click();
    } catch (err) {
      alert('Akses kamera ditolak atau tidak tersedia. Harap izinkan akses kamera pada pengaturan browser HP Anda.');
    }
  };

  // Handler Trigger Galeri / Dokumen
  const handleTriggerGallery = () => {
    galleryInputRef.current?.click();
  };

  // Handler Pilih File Foto / Kamera
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Handler Simpan Kategori Baru
  const handleSaveCategoryToDB = async () => {
    if (!newCategoryName.trim()) return;
    setSavingCategory(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { error } = await supabase.from('activity_categories').insert([
      { user_id: session.user.id, name: newCategoryName.trim() },
    ]);

    setSavingCategory(false);

    if (!error) {
      const addedName = newCategoryName.trim();
      setCategories((prev) => [...prev, addedName]);
      setSelectedCategory(addedName);
      setNewCategoryName('');
      setIsAddingNewCategory(false);
    } else {
      alert('Gagal menyimpan kategori: ' + error.message);
    }
  };

  // Submit Jurnal + Upload Foto ke Supabase Storage
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let uploadedImageUrl: string | undefined = undefined;

    // 1. Upload Foto jika ada file yang dipilih
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `activities/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('activity-photos')
        .upload(filePath, imageFile);

      if (uploadError) {
        alert('Gagal mengunggah foto: ' + uploadError.message);
        setLoading(false);
        return;
      }

      // Ambil Public URL foto
      const { data: urlData } = supabase.storage
        .from('activity-photos')
        .getPublicUrl(filePath);

      uploadedImageUrl = urlData.publicUrl;
    }

    // 2. Simpan Data Jurnal ke Database
    const newLog: ActivityLog = {
      child_id: childId,
      activity_category: selectedCategory,
      activity_name: activityName,
      duration_minutes: Number(duration),
      assistance_level: assistance,
      focus_score: focusScore,
      notes,
      image_url: uploadedImageUrl,
    };

    const { error } = await supabase.from('activity_logs').insert([newLog]);

    setLoading(false);
    if (!error) {
      setActivityName('');
      setNotes('');
      setImageFile(null);
      setImagePreview(null);
      onSave();
    } else {
      alert('Gagal menyimpan aktivitas: ' + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
        <Activity className="w-4 h-4 text-indigo-600" /> Catat Aktivitas Latihan
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Kategori */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-bold text-slate-500">Kategori Latihan</label>
            {!isAddingNewCategory && (
              <button
                type="button"
                onClick={() => setIsAddingNewCategory(true)}
                className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Tambah Kategori
              </button>
            )}
          </div>

          {!isAddingNewCategory ? (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2.5 border border-slate-200/80 rounded-2xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {categories.map((cat, idx) => (
                <option key={idx} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="Kategori kustom baru..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full p-2.5 border border-slate-200/80 rounded-2xl text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSaveCategoryToDB}
                disabled={savingCategory}
                className="p-2.5 bg-indigo-600 text-white rounded-2xl shrink-0"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsAddingNewCategory(false)}
                className="p-2.5 bg-slate-100 text-slate-500 rounded-2xl shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Nama Aktivitas */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1">Nama Aktivitas</label>
          <input
            type="text"
            required
            placeholder="e.g. Mencepit manik-manik dengan pinset"
            value={activityName}
            onChange={(e) => setActivityName(e.target.value)}
            className="w-full p-2.5 border border-slate-200/80 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Durasi (Menit)
          </label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full p-2.5 border border-slate-200/80 rounded-2xl text-xs focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
            <Award className="w-3.5 h-3.5" /> Tingkat Bantuan
          </label>
          <select
            value={assistance}
            onChange={(e) => setAssistance(e.target.value as any)}
            className="w-full p-2.5 border border-slate-200/80 rounded-2xl text-xs bg-white focus:outline-none"
          >
            <option value="Independent">Mandiri (Independent)</option>
            <option value="Partial Support">Bantuan Parsial</option>
            <option value="Full Support">Bantuan Penuh</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-500" /> Skor Fokus (1 - 5)
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={focusScore}
            onChange={(e) => setFocusScore(Number(e.target.value))}
            className="w-full mt-2 accent-indigo-600"
          />
          <div className="text-right text-xs text-indigo-600 font-bold">{focusScore} / 5</div>
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-bold text-slate-500 mb-1">Catatan Observasi Orang Tua</label>
        <textarea
          rows={2}
          placeholder="Catat respons anak, genggaman jarinya, atau kendala saat latihan..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full p-2.5 border border-slate-200/80 rounded-2xl text-xs focus:outline-none"
        />
      </div>

      {/* Pilihan Foto Kegiatan: Kamera & Galeri */}
      <div>
        <label className="block text-[11px] font-bold text-slate-500 mb-2 flex items-center gap-1">
          <ImageIcon className="w-3.5 h-3.5 text-indigo-600" /> Foto Kegiatan (Opsional)
        </label>

        {/* Hidden Inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageChange}
          className="hidden"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Tombol Ambil dari Kamera */}
          <button
            type="button"
            onClick={handleTriggerCamera}
            className="flex-1 flex items-center justify-center gap-2 p-3.5 border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/60 text-indigo-700 rounded-2xl transition font-semibold text-xs shadow-2xs"
          >
            <Camera className="w-4 h-4" /> Ambil dari Kamera
          </button>

          {/* Tombol Pilih dari Galeri/Dokumen */}
          <button
            type="button"
            onClick={handleTriggerGallery}
            className="flex-1 flex items-center justify-center gap-2 p-3.5 border border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700 rounded-2xl transition font-semibold text-xs shadow-2xs"
          >
            <FileImage className="w-4 h-4 text-slate-500" /> Pilih dari Galeri / File
          </button>

          {/* Preview Foto Jika Terpilih */}
          {imagePreview && (
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 shrink-0 shadow-xs self-center">
              <img src={imagePreview} alt="Preview Foto" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setImageFile(null);
                  setImagePreview(null);
                }}
                className="absolute top-1 right-1 p-1 bg-slate-900/60 hover:bg-slate-900 text-white rounded-full transition"
                title="Hapus foto"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-2xl text-xs transition shadow-md shadow-indigo-100 disabled:opacity-50"
      >
        {loading ? 'Menyimpan & Mengunggah...' : 'Simpan Log Jurnal'}
      </button>
    </form>
  );
};
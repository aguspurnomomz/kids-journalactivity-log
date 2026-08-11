import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Activity, Clock, Award, Star, Plus, Check, X, Image as ImageIcon, Camera, FileImage, Loader2 } from 'lucide-react';

const DEFAULT_CATEGORIES = [
  'Motorik Halus (Menulis, Mencepit, Memotong)',
  'Motorik Kasar (Melompat, Berlari, Lempar Bola)',
  'Koordinasi & Keseimbangan',
  'Sensori / Permainan Tekstur',
];

interface ImageItem {
  file: File;
  previewUrl: string;
}

// 1. Tambahkan initialCategory dan initialActivityName di sini
interface ActivityFormProps {
  childId: string;
  onSave: () => void;
  initialCategory?: string;
  initialActivityName?: string;
}

export const ActivityForm = ({ childId, onSave, initialCategory, initialActivityName }: ActivityFormProps) => {
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_CATEGORIES[0]);

  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  const [activityName, setActivityName] = useState('');
  const [duration, setDuration] = useState(15);
  const [assistance, setAssistance] = useState<'Independent' | 'Partial Support' | 'Full Support'>('Partial Support');
  const [focusScore, setFocusScore] = useState(4);
  const [notes, setNotes] = useState('');

  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // 2. Set nilai otomatis jika user memilih dari menu jadwal kegiatan
  useEffect(() => {
    if (initialCategory && categories.includes(initialCategory)) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory, categories]);

  useEffect(() => {
    if (initialActivityName) {
      setActivityName(initialActivityName);
    }
  }, [initialActivityName]);

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

  const handleTriggerCamera = async () => {
    if (imageItems.length >= 5) {
      alert('Maksimal foto yang dapat diunggah adalah 5 foto per aktivitas!');
      return;
    }
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((track) => track.stop());
      }
      cameraInputRef.current?.click();
    } catch (err) {
      alert('Akses kamera ditolak atau tidak tersedia. Harap izinkan akses kamera pada pengaturan browser HP Anda.');
    }
  };

  const handleTriggerGallery = () => {
    if (imageItems.length >= 5) {
      alert('Maksimal foto yang dapat diunggah adalah 5 foto per aktivitas!');
      return;
    }
    galleryInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    
    if (imageItems.length + files.length > 5) {
      alert('Maksimal foto yang dapat diunggah adalah 5 foto per aktivitas!');
      return;
    }

    const newItems: ImageItem[] = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setImageItems((prev) => [...prev, ...newItems]);
    e.target.value = '';
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImageItems((prev) => {
      const target = prev[indexToRemove];
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const uploadedUrls: string[] = [];
    for (const item of imageItems) {
      const fileExt = item.file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `activities/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('activity-photos')
        .upload(filePath, item.file);

      if (uploadError) {
        alert('Gagal mengunggah beberapa foto: ' + uploadError.message);
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('activity-photos')
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        uploadedUrls.push(urlData.publicUrl);
      }
    }

    const newLog = {
      child_id: childId,
      activity_category: selectedCategory,
      activity_name: activityName.trim(),
      duration_minutes: Number(duration),
      assistance_level: assistance,
      focus_score: focusScore,
      notes: notes.trim(),
      image_urls: uploadedUrls, 
      image_url: uploadedUrls[0] || null, 
      logged_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('activity_logs').insert([newLog]);

    setLoading(false);

    if (!error) {
      setActivityName('');
      setNotes('');
      imageItems.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      setImageItems([]);
      onSave();
    } else {
      alert('Gagal menyimpan aktivitas: ' + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
        <Activity className="w-4 h-4 text-[#01acbf]" /> Catat Aktivitas Hari Ini
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-bold text-slate-500">Kategori Latihan</label>
            {!isAddingNewCategory && (
              <button
                type="button"
                onClick={() => setIsAddingNewCategory(true)}
                className="text-[11px] font-bold text-[#01acbf] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Tambah Kategori
              </button>
            )}
          </div>

          {!isAddingNewCategory ? (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2.5 border border-slate-200/80 rounded-2xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#01acbf]/20"
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
                className="p-2.5 bg-[#01acbf] text-white rounded-2xl shrink-0"
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

        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1">Nama Aktivitas</label>
          <input
            type="text"
            required
            placeholder="e.g. Mencepit manik-manik dengan pinset"
            value={activityName}
            onChange={(e) => setActivityName(e.target.value)}
            className="w-full p-2.5 border border-slate-200/80 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-[#01acbf]/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#01acbf]" /> Durasi (Menit)
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
            <Award className="w-3.5 h-3.5 text-[#f47946]" /> Tingkat Bantuan
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
            className="w-full mt-2 accent-[#01acbf]"
          />
          <div className="text-right text-xs text-[#01acbf] font-bold">{focusScore} / 5</div>
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

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-[11px] font-bold text-slate-500 flex items-center gap-1">
            <ImageIcon className="w-3.5 h-3.5 text-[#01acbf]" /> Foto Kegiatan (Maks. 5 Foto)
          </label>
          <span className="text-[10px] font-semibold text-slate-400">
            {imageItems.length} / 5 Terpilih
          </span>
        </div>

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
          multiple
          onChange={handleImageChange}
          className="hidden"
        />

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={handleTriggerCamera}
              disabled={imageItems.length >= 5}
              className="flex-1 flex items-center justify-center gap-2 p-3 border border-teal-200 bg-teal-50/50 hover:bg-teal-100/60 text-[#01acbf] rounded-2xl transition font-semibold text-xs shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera className="w-4 h-4" /> Ambil Kamera
            </button>

            <button
              type="button"
              onClick={handleTriggerGallery}
              disabled={imageItems.length >= 5}
              className="flex-1 flex items-center justify-center gap-2 p-3 border border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700 rounded-2xl transition font-semibold text-xs shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileImage className="w-4 h-4 text-slate-500" /> Pilih Galeri / File
            </button>
          </div>

          {imageItems.length > 0 && (
            <div className="flex flex-wrap gap-2.5 pt-1">
              {imageItems.map((item, index) => (
                <div key={index} className="relative w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 shrink-0 shadow-xs group">
                  <img src={item.previewUrl} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 p-1 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full transition"
                    title="Hapus Foto"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <span className="absolute bottom-1 left-1 bg-slate-900/60 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-md">
                    #{index + 1}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-[#01acbf] hover:bg-[#0198a8] text-white font-semibold px-5 py-2.5 rounded-2xl text-xs transition shadow-md shadow-teal-100 disabled:opacity-50 flex items-center gap-2"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? 'Menyimpan & Mengunggah Foto...' : 'Simpan Aktivitas'}
      </button>
    </form>
  );
};
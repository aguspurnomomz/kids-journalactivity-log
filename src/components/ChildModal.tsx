import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { type Child } from '../types/database';
import { X, Baby, Edit3 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  childToEdit?: Child | null; 
}

export const ChildModal = ({ isOpen, onClose, onSuccess, userId, childToEdit }: Props) => {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!childToEdit;

  useEffect(() => {
    if (childToEdit) {
      setName(childToEdit.name);
      setBirthDate(childToEdit.birth_date);
      setGender(childToEdit.gender);
      setHeight(childToEdit.height_cm ? String(childToEdit.height_cm) : '');
      setWeight(childToEdit.weight_kg ? String(childToEdit.weight_kg) : '');
    } else {
      setName('');
      setBirthDate('');
      setGender('L');
      setHeight('');
      setWeight('');
    }
  }, [childToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      user_id: userId,
      name,
      birth_date: birthDate,
      gender,
      height_cm: height ? parseFloat(height) : null,
      weight_kg: weight ? parseFloat(weight) : null,
    };

    let response;

    if (isEditMode && childToEdit) {
      response = await supabase
        .from('children')
        .update(payload)
        .eq('id', childToEdit.id);
    } else {
      response = await supabase.from('children').insert([payload]);
    }

    setLoading(false);

    if (response.error) {
      setError(response.error.message);
    } else {
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
              {isEditMode ? <Edit3 className="w-5 h-5" /> : <Baby className="w-5 h-5" />}
            </div>
            <h3 className="font-bold text-slate-800 text-sm">
              {isEditMode ? 'Edit Data Profil Anak' : 'Tambah Data Anak'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 p-3 bg-red-50 text-red-600 rounded-2xl text-xs border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Nama Lengkap Anak *</label>
            <input
              type="text"
              required
              placeholder="nama anak"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200/80 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Tanggal Lahir *</label>
              <input
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200/80 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Jenis Kelamin *</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'L' | 'P')}
                className="w-full px-3 py-2.5 border border-slate-200/80 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none text-xs bg-white"
              >
                <option value="L">Laki-Laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Tinggi Badan (cm)</label>
              <input
                type="number"
                step="0.1"
                placeholder="100"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200/80 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Berat Badan (kg)</label>
              <input
                type="number"
                step="0.1"
                placeholder="15"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200/80 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none text-xs"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-2xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl transition shadow-md shadow-indigo-100 disabled:opacity-50"
            >
              {loading ? 'Memproses...' : isEditMode ? 'Simpan Perubahan' : 'Simpan Data'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
import React, { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ActivityForm } from '../components/ActivityForm';
import { type Child } from '../types/database';
import { Plus, Baby } from 'lucide-react';
import { ChildModal } from '../components/ChildModal';

export const InputActivityPage = () => {
  const { session } = useOutletContext<{ session: any }>();
  const navigate = useNavigate();

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);

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
    } else {
      setChildren([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchChildren();
  }, [session]);

  const handleSaved = () => {
    navigate('/');
  };

  if (loading) {
    return <div className="text-slate-400 font-medium py-12 text-center text-xs">Memuat data...</div>;
  }

  return (
    // Diubah dari max-w-3xl menjadi w-full max-w-5xl agar memenuhi area layout secara proporsional
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Catat Aktivitas Latihan</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Pilih profil anak dan isi detail jurnal aktivitas harian.
          </p>
        </div>

        {children.length > 0 && (
          <button
            onClick={() => setIsAddChildModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2.5 rounded-2xl text-xs font-semibold transition"
          >
            <Plus className="w-4 h-4" /> Tambah Profil Anak
          </button>
        )}
      </div>

      {children.length > 0 ? (
        <div className="space-y-6">
          {/* Selector Anak jika > 1 */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-2">
            <label className="block text-[11px] font-bold text-slate-500">Pilih Anak yang Berlatih</label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChildId(child.id)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-semibold transition flex items-center gap-2 border ${
                    selectedChildId === child.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200/60 hover:bg-slate-100'
                  }`}
                >
                  <span>{child.name}</span>
                  <span className="opacity-80">({child.gender === 'L' ? '👦' : '👧'})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Form Input Aktivitas */}
          {selectedChildId && (
            <ActivityForm childId={selectedChildId} onSave={handleSaved} />
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Baby className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Belum ada profil anak terhubung. Tambahkan profil anak terlebih dahulu sebelum mengisi jurnal.
          </p>
          <button
            onClick={() => setIsAddChildModalOpen(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-2xl transition shadow-md shadow-indigo-100"
          >
            <Plus className="w-4 h-4" /> Tambah Profil Anak Sekarang
          </button>
        </div>
      )}

      {/* Modal Tambah Data Anak */}
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
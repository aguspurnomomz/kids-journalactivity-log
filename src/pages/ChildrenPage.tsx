import { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ChildModal } from '../components/ChildModal';
import { type Child } from '../types/database';
import { Plus, ChevronRight, User, Trash2, Pencil, Sparkles } from 'lucide-react';

export const ChildrenPage = () => {
  const { session } = useOutletContext<{ session: any }>();
  const navigate = useNavigate();

  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  // State Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedChildForEdit, setSelectedChildForEdit] = useState<Child | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchChildren = async () => {
    if (!session?.user) return;

    const { data } = await supabase
      .from('children')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true });

    setChildren(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchChildren();
  }, [session]);

  const handleOpenAddModal = () => {
    setSelectedChildForEdit(null); 
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (child: Child) => {
    setSelectedChildForEdit(child); 
    setIsModalOpen(true);
  };

  const handleDeleteChild = async (childId: string, childName: string) => {
    const confirmed = window.confirm(
      `Apakah kamu yakin ingin menghapus data profil "${childName}"?\n\nSemua riwayat latihan motorik anak ini juga akan ikut terhapus.`
    );

    if (!confirmed) return;

    setDeletingId(childId);
    const { error } = await supabase.from('children').delete().eq('id', childId);
    setDeletingId(null);

    if (error) {
      alert('Gagal menghapus data anak: ' + error.message);
    } else {
      fetchChildren();
    }
  };

  if (loading) {
    return <div className="text-slate-400 font-medium py-12 text-center text-xs">Memuat data anak...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 text-white p-7 rounded-3xl shadow-lg shadow-indigo-200/50 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Sparkles className="w-32 h-32 absolute -right-6 -bottom-6 text-indigo-400/30" />
        <Sparkles className="w-16 h-16 absolute right-32 top-2 text-indigo-300/20" />
        <div className="relative z-10 max-w-md">
          <span className="text-[10px] font-bold tracking-widest uppercase bg-white/20 px-3 py-1 rounded-full text-indigo-100 backdrop-blur-md">
            Kelola Profil Anak
          </span>
          <h2 className="text-2xl font-bold mt-2 leading-snug">
            Data Profil Anak
          </h2>
          <p className="text-xs text-indigo-100 mt-1">
            Kelola profil anak anda, dengan memasukan data anak ke system kami melalui form di bawah ini. 
          </p>
        </div>
        {/* <button
          onClick={handleOpenAddModal}
          className="relative z-10 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-full text-xs font-semibold transition shadow-md shrink-0"
        >
          <Plus className="w-4 h-4 text-indigo-400" /> Tambah Data Anak
        </button> */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children.map((child) => (
          <div
            key={child.id}
            className="bg-white p-5 rounded-3xl border border-slate-100 hover:border-indigo-100 transition shadow-xs flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3.5 overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm border border-indigo-100/50 shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 truncate">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800 text-sm truncate">{child.name}</h3>
                  <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full shrink-0">
                    {child.gender === 'L' ? 'Laki-Laki' : 'Perempuan'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Lahir: {new Date(child.birth_date).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  TB: {child.height_cm ? `${child.height_cm} cm` : '-'} | BB: {child.weight_kg ? `${child.weight_kg} kg` : '-'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => navigate('/')}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition flex items-center gap-1 text-xs font-semibold"
                title="Lihat Log Aktivitas"
              >
                Log <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleOpenEditModal(child)}
                className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition"
                title="Edit Profil Anak"
              >
                <Pencil className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleDeleteChild(child.id, child.name)}
                disabled={deletingId === child.id}
                className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition disabled:opacity-50"
                title="Hapus Profil Anak"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={handleOpenAddModal}
          className="p-5 rounded-3xl border-2 border-dashed border-slate-200 hover:border-indigo-400/50 hover:bg-indigo-50/20 text-slate-400 hover:text-indigo-600 transition flex flex-col items-center justify-center gap-2 min-h-[110px]"
        >
          <Plus className="w-6 h-6" />
          <span className="text-xs font-semibold">Tambah Data Anak</span>
        </button>
      </div>

      {session?.user && (
        <ChildModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchChildren}
          userId={session.user.id}
          childToEdit={selectedChildForEdit}
        />
      )}
    </div>
  );
};
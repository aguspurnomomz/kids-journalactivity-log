import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { generateWeeklySummary, askAIConsultation } from '../lib/gemini';
import { Sparkles, Send, Bot, User, RefreshCw, Activity } from 'lucide-react';
import { type Child, type ActivityLog } from '../types/database';

export const AIConsultPage = () => {
  const { session } = useOutletContext<{ session: any }>();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  // State AI Summary
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // State Chat Konsultasi
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: 'Halo Ayah/Bunda! Ada yang ingin dikonsultasikan seputar tumbuh kembang atau stimulasi motorik buah hati?' },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);

  // 1. Fetch Data Anak & Log
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user) return;
      const { data: childrenData } = await supabase
        .from('children')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true });

      if (childrenData && childrenData.length > 0) {
        setChildren(childrenData);
        setSelectedChild(childrenData[0]);
      }
    };
    fetchData();
  }, [session]);

  useEffect(() => {
    if (!selectedChild) return;
    const fetchLogs = async () => {
      const { data } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('child_id', selectedChild.id)
        .order('logged_at', { ascending: false });

      setLogs(data || []);
    };
    fetchLogs();
  }, [selectedChild]);

  // Handler Generate Rangkuman Mingguan
  const handleGenerateSummary = async () => {
    if (!selectedChild) return;
    setLoadingSummary(true);
    try {
      const result = await generateWeeklySummary(selectedChild.name, logs);
      setSummary(result || 'Tidak ada rangkuman yang dihasilkan.');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingSummary(false);
    }
  };

  // Handler Kirim Pesan Konsultasi AI
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || loadingChat) return;

    const userText = inputMessage;
    setInputMessage('');
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setLoadingChat(true);

    try {
      const aiReply = await askAIConsultation(selectedChild?.name || 'Anak', messages, userText);
      setMessages((prev) => [...prev, { role: 'ai', text: aiReply || 'Maaf, saya tidak dapat memproses jawaban saat ini.' }]);
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: 'ai', text: 'Terjadi kesalahan koneksi dengan layanan AI.' }]);
    } finally {
      setLoadingChat(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 text-white p-7 rounded-3xl shadow-lg shadow-indigo-200/50 relative overflow-hidden flex flex-col justify-between">
        <Sparkles className="w-32 h-32 absolute -right-6 -bottom-6 text-indigo-400/30" />
        <div className="relative z-10">
          <span className="text-[10px] font-bold tracking-widest uppercase bg-white/20 px-3 py-1 rounded-full text-indigo-100 backdrop-blur-md">
            Asisten AI Pintar
          </span>
          <h1 className="text-2xl font-bold mt-3 leading-snug">
            Konsultasi & Rangkuman Perkembangan Anak
          </h1>
          <p className="text-xs text-indigo-100 mt-1 max-w-lg">
            Dapatkan analisis mingguan otomatis berdasarkan jurnal latihan serta konsultasi langsung seputar stimulasi motorik bersama AI.
          </p>
        </div>
      </div>

      {/* Selector Anak */}
      {children.length > 0 && (
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500">Pilih Anak:</span>
          <div className="flex gap-2">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => setSelectedChild(child)}
                className={`px-4 py-2 rounded-2xl text-xs font-semibold transition border ${
                  selectedChild?.id === child.id
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200/60 hover:bg-slate-100'
                }`}
              >
                {child.name} ({child.gender === 'L' ? '👦' : '👧'})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid Konten: Kiri (Rangkuman AI), Kanan (Chat Konsultasi) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Kolom 1: Rangkuman Mingguan Otomatis */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" /> Rangkuman Jurnal Otomatis
              </h3>
              <button
                onClick={handleGenerateSummary}
                disabled={loadingSummary || !selectedChild}
                className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3.5 py-2 rounded-2xl text-xs font-semibold transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingSummary ? 'animate-spin' : ''}`} />
                {loadingSummary ? 'Menganalisis...' : 'Analisis AI'}
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 min-h-[260px] max-h-[360px] overflow-y-auto text-xs text-slate-600 leading-relaxed space-y-2">
              {summary ? (
                <div className="whitespace-pre-line">{summary}</div>
              ) : (
                <div className="text-center py-16 text-slate-400 space-y-2">
                  <Sparkles className="w-8 h-8 text-indigo-300 mx-auto animate-pulse" />
                  <p>Klik tombol <strong>"Analisis AI"</strong> di atas untuk membuat laporan mingguan berdasarkan catatan latihan {selectedChild?.name || 'anak'}.</p>
                </div>
              )}
            </div>
          </div>

          <p className="text-[10px] text-slate-400 text-center">
            * Analisis dihasilkan oleh Google Gemini AI berdasarkan data jurnal riwayat latihan.
          </p>
        </div>

        {/* Kolom 2: Chat Konsultasi AI */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between h-[450px]">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-xs">Tanya Pakar Motorik AI</h3>
              <p className="text-[10px] text-slate-400">Konsultasikan stimulasi & tumbuh kembang</p>
            </div>
          </div>

          {/* Area Pesan Chat */}
          <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'ai' && (
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl text-xs max-w-[80%] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-slate-100 text-slate-700 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 mt-1">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}
            {loadingChat && (
              <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                <Bot className="w-4 h-4 animate-bounce text-indigo-600" /> AI sedang merespons...
              </div>
            )}
          </div>

          {/* Input Form Chat */}
          <form onSubmit={handleSendMessage} className="flex gap-2 pt-3 border-t border-slate-100">
            <input
              type="text"
              placeholder="Tulis pertanyaan konsultasi..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200/80 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <button
              type="submit"
              disabled={loadingChat}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl transition disabled:opacity-50 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
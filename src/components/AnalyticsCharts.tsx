import { type ActivityLog } from '../types/database';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
} from 'recharts';

interface Props {
  logs: ActivityLog[];
}

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

export const AnalyticsCharts = ({ logs }: Props) => {
  if (logs.length === 0) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-slate-100 text-center text-slate-400 text-xs">
        Belum ada data aktivitas yang cukup untuk menampilkan grafik analitik.
      </div>
    );
  }

  // 1. Format Data Tren Skor Fokus & Durasi (Diurutkan dari tanggal tertua ke terbaru)
  const chartData = [...logs]
    .reverse()
    .map((log) => ({
      date: log.logged_at
        ? new Date(log.logged_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
        : '',
      focus: log.focus_score,
      duration: log.duration_minutes,
      activity: log.activity_name,
    }));

  // 2. Agregasi Data per Kategori (Untuk Donut Chart)
  const categoryMap: { [key: string]: number } = {};
  logs.forEach((log) => {
    categoryMap[log.activity_category] = (categoryMap[log.activity_category] || 0) + 1;
  });

  const categoryData = Object.keys(categoryMap).map((cat) => ({
    name: cat,
    value: categoryMap[cat],
  }));

  return (
    <div className="space-y-6">
      {/* Grid Grafik 2 Kolom */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Tren Skor Fokus */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Tren Skor Fokus Anak</h4>
            <p className="text-[11px] text-slate-400">Skor fokus harian dalam skala 1 - 5</p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis domain={[1, 5]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '1rem',
                    border: '1px solid #f1f5f9',
                    fontSize: '11px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="focus"
                  name="Skor Fokus"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#6366f1' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Distribusi Kategori Latihan (Donut Chart) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Distribusi Kategori Latihan</h4>
            <p className="text-[11px] text-slate-400">Keseimbangan variasi modul stimulasi</p>
          </div>
          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '1rem',
                    border: '1px solid #f1f5f9',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend Custom */}
          <div className="flex flex-wrap gap-2 justify-center pt-2">
            {categoryData.map((entry, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                {entry.name} ({entry.value})
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart 3: Durasi Latihan Per Sesi (Bar Chart) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        <div>
          <h4 className="font-bold text-slate-800 text-sm">Durasi Latihan (Menit)</h4>
          <p className="text-[11px] text-slate-400">Total durasi waktu stimulasi per sesi latihan</p>
        </div>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '1rem',
                  border: '1px solid #f1f5f9',
                  fontSize: '11px',
                }}
              />
              <Bar dataKey="duration" name="Durasi (Menit)" fill="#818cf8" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

/**
 * Helper internal untuk melakukan request dengan penanganan Error 429
 */
async function callGeminiAPI(prompt: string) {
  if (!GEMINI_API_KEY) {
    throw new Error('API Key Gemini belum dipasang di file .env');
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    if (res.status === 429) {
      throw new Error(
        'Kuota request sedang penuh (Rate Limit). Silakan tunggu lalu coba kembali.'
      );
    }
    throw new Error(data.error?.message || 'Gagal memanggil layanan Gemini AI');
  }

  return data.candidates[0].content.parts[0].text;
}

/**
 * Rangkuman Mingguan Otomatis
 */
export async function generateWeeklySummary(childName: string, logs: any[]) {
  const logsSummary =
    logs && logs.length > 0
      ? logs
          .map(
            (l) =>
              `- Tanggal: ${new Date(l.logged_at).toLocaleDateString('id-ID')}, Kategori: ${l.activity_category}, Aktivitas: ${l.activity_name}, Durasi: ${l.duration_minutes}m, Bantuan: ${l.assistance_level}, Skor Fokus: ${l.focus_score}/5, Catatan: ${l.notes || '-'}`
          )
          .join('\n')
      : 'Belum ada catatan aktivitas.';

  const prompt = `Anda adalah ahli tumbuh kembang anak dan terapis okupasi pediatrik. Berikut data jurnal motorik anak "${childName}":\n${logsSummary}\n\nBuatkan evaluasi mingguan yang singkat, ramah, dan memotivasi dalam bahasa Indonesia dengan format Markdown.`;

  return await callGeminiAPI(prompt);
}

/**
 * Tanya-Jawab Konsultasi AI
 */
export async function askAIConsultation(childName: string, _messages: { role: "user" | "ai"; text: string; }[], userQuestion: string) {
  const prompt = `[INSTRUKSI SISTEM: Anda adalah asisten AI ahli tumbuh kembang anak yang mendampingi orang tua dari anak bernama "${childName}". Berikan saran stimulasi motorik yang praktis, aman, edukatif, dan bernada empati].\n\nPertanyaan Orang Tua: ${userQuestion}`;

  return await callGeminiAPI(prompt);
}
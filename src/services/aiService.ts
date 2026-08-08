import OpenAI from 'openai';
import { prisma } from '../server';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return null;
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

export function isAiGloballyEnabled(): boolean {
  const masterSwitch = process.env.AI_ENABLED;
  if (masterSwitch === 'false' || masterSwitch === '0') {
    return false;
  }
  return !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== '';
}

/**
 * Get or create UserSettings for a given user ID
 */
export async function getOrCreateUserSettings(userId: string) {
  let settings = await prisma.userSettings.findUnique({
    where: { userId },
  });

  if (!settings) {
    settings = await prisma.userSettings.create({
      data: {
        userId,
        aiEnabled: true,
        aiGoalBreakdown: true,
        aiDailyCoach: true,
        aiSmartSummary: true,
        aiMonthlyQuota: 50,
        aiUsageThisMonth: 0,
      },
    });
  }

  return settings;
}

/**
 * Get comprehensive AI availability status and quota info for the current user
 */
export async function getAiStatus(userId?: string) {
  const aiAvailable = isAiGloballyEnabled();

  if (!userId) {
    return {
      success: true,
      aiAvailable,
      features: {
        goalBreakdown: aiAvailable,
        dailyCoach: aiAvailable,
        smartSummary: aiAvailable,
      },
      quota: {
        used: 0,
        limit: 50,
        remaining: 50,
      },
    };
  }

  try {
    const settings = await getOrCreateUserSettings(userId);

    const userCanGoalBreakdown = aiAvailable && settings.aiEnabled && settings.aiGoalBreakdown;
    const userCanDailyCoach = aiAvailable && settings.aiEnabled && settings.aiDailyCoach;
    const userCanSmartSummary = aiAvailable && settings.aiEnabled && settings.aiSmartSummary;

    const remaining = Math.max(0, settings.aiMonthlyQuota - settings.aiUsageThisMonth);

    return {
      success: true,
      aiAvailable,
      features: {
        goalBreakdown: userCanGoalBreakdown && remaining > 0,
        dailyCoach: userCanDailyCoach && remaining > 0,
        smartSummary: userCanSmartSummary && remaining > 0,
      },
      quota: {
        used: settings.aiUsageThisMonth,
        limit: settings.aiMonthlyQuota,
        remaining,
      },
    };
  } catch (error) {
    console.error('Error fetching user AI status:', error);
    return {
      success: true,
      aiAvailable,
      features: {
        goalBreakdown: aiAvailable,
        dailyCoach: aiAvailable,
        smartSummary: aiAvailable,
      },
      quota: {
        used: 0,
        limit: 50,
        remaining: 50,
      },
    };
  }
}

export interface TaskSuggestion {
  title: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedDays?: number;
}

export interface AiGoalBreakdownResult {
  tasks: TaskSuggestion[];
  advice: string;
  quotaRemaining: number;
}

/**
 * Generate actionable sub-tasks breakdown for a Goal using OpenAI gpt-4o-mini
 */
export async function generateGoalBreakdown(
  userId: string,
  goalTitle: string,
  goalDescription?: string
): Promise<{ success: boolean; data?: AiGoalBreakdownResult; message?: string }> {
  if (!isAiGloballyEnabled()) {
    return {
      success: false,
      message: 'Layanan AI belum diaktifkan atau OPENAI_API_KEY tidak dikonfigurasi pada server.',
    };
  }

  const settings = await getOrCreateUserSettings(userId);

  if (!settings.aiEnabled || !settings.aiGoalBreakdown) {
    return {
      success: false,
      message: 'Fitur AI Goal Breakdown dinonaktifkan di pengaturan akun Anda.',
    };
  }

  if (settings.aiUsageThisMonth >= settings.aiMonthlyQuota) {
    return {
      success: false,
      message: `Batas penggunaan kuota AI bulanan Anda (${settings.aiMonthlyQuota} panggil) telah habis.`,
    };
  }

  const client = getOpenAIClient();
  if (!client) {
    return {
      success: false,
      message: 'Koneksi ke OpenAI API client gagal.',
    };
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const systemPrompt = `Anda adalah seorang AI Executive Life Coach dan Productivity Expert yang handal. 
Tugas Anda adalah memecahkan (breakdown) sebuah Goal / Mimpi Besar menjadi 4 hingga 7 langkah kerja (sub-tasks) yang sangat konkret, spesifik, terukur, dan langsung dapat dieksekusi.

Setiap task harus berupa kalimat perintah singkat (action-oriented) yang jelas.

Anda HARUS mengembalikan response dalam format JSON valid dengan struktur berikut:
{
  "tasks": [
    {
      "title": "Judul langkah konkret...",
      "priority": "HIGH" | "MEDIUM" | "LOW",
      "estimatedDays": 2
    }
  ],
  "advice": "Saran atau dorongan motivasi singkat 1-2 kalimat dari AI Coach untuk membantu pencapaian goal ini."
}
Gunakan Bahasa Indonesia yang alami, menyemangati, dan profesional.`;

  const userPrompt = `Tolong breakdown goal berikut:
Judul Goal: "${goalTitle}"
${goalDescription ? `Deskripsi / Detail: "${goalDescription}"` : 'Deskripsi: (Tidak ada)'}`;

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: 800,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Respons dari OpenAI kosong.');
    }

    const parsed = JSON.parse(content);
    const tasks: TaskSuggestion[] = Array.isArray(parsed.tasks)
      ? parsed.tasks.map((t: any) => ({
          title: String(t.title || '').trim(),
          priority: ['URGENT', 'HIGH', 'MEDIUM', 'LOW'].includes(t.priority?.toUpperCase())
            ? (t.priority.toUpperCase() as any)
            : 'MEDIUM',
          estimatedDays: typeof t.estimatedDays === 'number' ? t.estimatedDays : undefined,
        }))
      : [];

    const advice = String(parsed.advice || 'Tetap fokus dan selesaikan satu langkah setiap hari!').trim();

    // Increment usage quota
    const updatedSettings = await prisma.userSettings.update({
      where: { userId },
      data: {
        aiUsageThisMonth: { increment: 1 },
      },
    });

    const quotaRemaining = Math.max(0, updatedSettings.aiMonthlyQuota - updatedSettings.aiUsageThisMonth);

    return {
      success: true,
      data: {
        tasks,
        advice,
        quotaRemaining,
      },
    };
  } catch (error: any) {
    console.error('Error in generateGoalBreakdown AI service:', error);
    return {
      success: false,
      message: error.message || 'Gagal memproses AI Goal Breakdown.',
    };
  }
}

export interface AiDailyCoachResult {
  insight: string;
  pattern: string;
  recommendation: string;
  quotaRemaining: number;
}

/**
 * Feature 2: Generate Daily Coach Insight based on journal entry, mood history & habits
 */
export async function generateDailyCoachInsight(
  userId: string,
  journalEntry?: string,
  mood?: number,
  energy?: number
): Promise<{ success: boolean; data?: AiDailyCoachResult; message?: string }> {
  if (!isAiGloballyEnabled()) {
    return {
      success: false,
      message: 'Layanan AI belum diaktifkan atau OPENAI_API_KEY tidak dikonfigurasi.',
    };
  }

  const settings = await getOrCreateUserSettings(userId);
  if (!settings.aiEnabled || !settings.aiDailyCoach) {
    return {
      success: false,
      message: 'Fitur AI Daily Coach dinonaktifkan di pengaturan akun Anda.',
    };
  }

  if (settings.aiUsageThisMonth >= settings.aiMonthlyQuota) {
    return {
      success: false,
      message: `Batas kuota AI bulanan Anda (${settings.aiMonthlyQuota}) telah habis.`,
    };
  }

  const client = getOpenAIClient();
  if (!client) {
    return { success: false, message: 'Koneksi ke OpenAI API client gagal.' };
  }

  // Gather historical context (recent 5 daily logs)
  const recentLogs = await prisma.dailyLog.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: 5,
  });

  const habits = await prisma.habit.findMany({
    where: { userId, isArchived: false },
    take: 5,
  });

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const systemPrompt = `Anda adalah seorang AI Personal Daily Coach dan Empathetic Mentor.
Tugas Anda adalah membaca jurnal harian, tingkat mood, dan tingkat energi user, lalu memberikan analisis berempati, pola yang terdeteksi, dan saran konkret.

Respon HARUS dalam format JSON valid berikut:
{
  "insight": "Rangkuman observasi empati 2-3 kalimat mengenai kondisi psikologis & produktivitas user hari ini.",
  "pattern": "Analisis pola dari tren mood/energi beberapa hari terakhir.",
  "recommendation": "1-2 langkah micro-action konkret yang relevan untuk memperbaiki atau mempertahankan kondisi positif hari ini."
}
Gunakan Bahasa Indonesia yang ramah, santun, hangat, dan solutif.`;

  const historyStr = recentLogs
    .map(
      (l) =>
        `- ${l.date.toISOString().split('T')[0]}: Mood ${l.mood}/5, Energi ${l.energy}/5, Catatan: "${l.journal || ''}"`
    )
    .join('\n');

  const habitsStr = habits.map((h) => `- ${h.name}`).join('\n');

  const userPrompt = `Data Hari Ini:
- Mood: ${mood ?? 'Belum diisi'}/5
- Energi: ${energy ?? 'Belum diisi'}/5
- Jurnal / Catatan Refleksi: "${journalEntry || 'User tidak menuliskan jurnal detail.'}"

Riwayat 5 Hari Terakhir:
${historyStr || 'Belum ada data historis sebelumnya.'}

Habits Utama:
${habitsStr || 'Belum ada habit.'}`;

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
      max_tokens: 600,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Respons dari OpenAI kosong.');

    const parsed = JSON.parse(content);

    const updatedSettings = await prisma.userSettings.update({
      where: { userId },
      data: { aiUsageThisMonth: { increment: 1 } },
    });

    const quotaRemaining = Math.max(0, updatedSettings.aiMonthlyQuota - updatedSettings.aiUsageThisMonth);

    return {
      success: true,
      data: {
        insight: String(parsed.insight || '').trim(),
        pattern: String(parsed.pattern || '').trim(),
        recommendation: String(parsed.recommendation || '').trim(),
        quotaRemaining,
      },
    };
  } catch (error: any) {
    console.error('Error in generateDailyCoachInsight:', error);
    return { success: false, message: error.message || 'Gagal memproses AI Daily Coach.' };
  }
}

export interface AiWeeklySummaryResult {
  highlights: string[];
  improvements: string[];
  summary: string;
  advice: string;
  quotaRemaining: number;
}

/**
 * Feature 3: Generate Weekly Smart Summary analyzing completed tasks, habits, and goals
 */
export async function generateWeeklySummary(
  userId: string
): Promise<{ success: boolean; data?: AiWeeklySummaryResult; message?: string }> {
  if (!isAiGloballyEnabled()) {
    return {
      success: false,
      message: 'Layanan AI belum diaktifkan atau OPENAI_API_KEY tidak dikonfigurasi.',
    };
  }

  const settings = await getOrCreateUserSettings(userId);
  if (!settings.aiEnabled || !settings.aiSmartSummary) {
    return {
      success: false,
      message: 'Fitur AI Smart Summary dinonaktifkan di pengaturan akun Anda.',
    };
  }

  if (settings.aiUsageThisMonth >= settings.aiMonthlyQuota) {
    return {
      success: false,
      message: `Batas kuota AI bulanan Anda (${settings.aiMonthlyQuota}) telah habis.`,
    };
  }

  const client = getOpenAIClient();
  if (!client) {
    return { success: false, message: 'Koneksi ke OpenAI API client gagal.' };
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [completedTasks, habits, goals, recentLogs] = await Promise.all([
    prisma.task.findMany({
      where: { userId, status: 'DONE', completedAt: { gte: sevenDaysAgo } },
      select: { title: true, priority: true },
    }),
    prisma.habit.findMany({
      where: { userId, isArchived: false },
      include: {
        habitLogs: {
          where: { date: { gte: sevenDaysAgo }, status: 'DONE' },
        },
      },
    }),
    prisma.goal.findMany({
      where: { userId, status: 'ACTIVE' },
      include: { tasks: true },
    }),
    prisma.dailyLog.findMany({
      where: { userId, date: { gte: sevenDaysAgo } },
      select: { mood: true, energy: true, date: true },
    }),
  ]);

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const systemPrompt = `Anda adalah seorang AI Executive Performance Strategist.
Tugas Anda adalah memberikan Rangkuman Mingguan Cerdas (Weekly Smart Summary) berdasarkan pencapaian task, habit, goal, dan mood user selama 7 hari terakhir.

Respon HARUS dalam format JSON valid:
{
  "highlights": [
    "Pencapaian utama 1...",
    "Pencapaian utama 2..."
  ],
  "improvements": [
    "Area yang perlu diperbaiki 1...",
    "Area yang perlu diperbaiki 2..."
  ],
  "summary": "Narasi evaluasi ringkas 2-3 kalimat mengenai produktivitas minggu ini.",
  "advice": "Rekomendasi taktis untuk minggu depan."
}
Gunakan Bahasa Indonesia yang objektif, membangun, profesional, dan menginspirasi.`;

  const tasksStr = completedTasks.map((t) => `- [Selesai] ${t.title}`).join('\n');
  const habitsStr = habits.map((h) => `- ${h.name}: ${h.habitLogs.length}/7 hari selesai`).join('\n');
  const goalsStr = goals.map((g) => {
    const doneCount = g.tasks.filter((t) => t.status === 'DONE').length;
    return `- Goal "${g.title}": ${doneCount}/${g.tasks.length} task selesai`;
  }).join('\n');

  const avgMood = recentLogs.length
    ? (recentLogs.reduce((acc, l) => acc + l.mood, 0) / recentLogs.length).toFixed(1)
    : 'N/A';

  const userPrompt = `Ringkasan Data 7 Hari Terakhir:
- Rata-rata Mood: ${avgMood}/5 (dari ${recentLogs.length} check-in)
- Task Selesai (${completedTasks.length}):
${tasksStr || 'Tidak ada task selesai dalam 7 hari terakhir.'}

- Konsistensi Habit:
${habitsStr || 'Tidak ada data habit.'}

- Progres Goals Aktif:
${goalsStr || 'Tidak ada goals aktif.'}`;

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: 700,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Respons dari OpenAI kosong.');

    const parsed = JSON.parse(content);

    const updatedSettings = await prisma.userSettings.update({
      where: { userId },
      data: { aiUsageThisMonth: { increment: 1 } },
    });

    const quotaRemaining = Math.max(0, updatedSettings.aiMonthlyQuota - updatedSettings.aiUsageThisMonth);

    return {
      success: true,
      data: {
        highlights: Array.isArray(parsed.highlights) ? parsed.highlights.map(String) : [],
        improvements: Array.isArray(parsed.improvements) ? parsed.improvements.map(String) : [],
        summary: String(parsed.summary || '').trim(),
        advice: String(parsed.advice || '').trim(),
        quotaRemaining,
      },
    };
  } catch (error: any) {
    console.error('Error in generateWeeklySummary:', error);
    return { success: false, message: error.message || 'Gagal memproses AI Weekly Summary.' };
  }
}


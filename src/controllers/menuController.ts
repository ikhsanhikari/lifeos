import { Context, Markup, Telegraf } from 'telegraf';

/**
 * Registrasi daftar perintah resmi ke Telegram Client (Native Bot [/] Menu)
 */
export async function registerTelegramCommands(bot: Telegraf) {
  try {
    await bot.telegram.setMyCommands([
      { command: 'app', description: '🚀 Buka Telegram Mini App Life OS' },
      { command: 'menu', description: '📱 Buka Menu Utama Interaktif' },
      { command: 'goals', description: '🌟 Daftar Goal & Progress Mimpi Besar' },
      { command: 'goal', description: '🚀 Buat Goal Baru & Breakdown Task' },
      { command: 'focus', description: '🔎 Focus Mode — Goal & Task Prioritas' },
      { command: 'habits', description: '🎯 Daftar Habit Harian & Check-in' },
      { command: 'tasks', description: '📋 Daftar Tugas Harian & Status' },
      { command: 'log', description: '📖 Catat Mood & Jurnal Hari Ini' },
      { command: 'today', description: '📊 Ringkasan Produktivitas Hari Ini' },
      { command: 'streak', description: '🔥 Lihat Rekor Streak Habit' },
      { command: 'start', description: '🚀 Mulai & Hubungkan Akun Web' },
    ]);
    console.log('✅ Registered Telegram Native Command Menu [/]');
  } catch (error) {
    console.error('Failed to set Telegram commands:', error);
  }
}

/**
 * Return persistent Reply Keyboard (Menu Tombol di Bawah Layar Chat)
 */
export function getPersistentMenuKeyboard() {
  const webAppUrl = (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_WEB_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3011'
  ).replace(/\/$/, '');

  return Markup.keyboard([
    [Markup.button.webApp('🚀 Buka Telegram Mini App', webAppUrl)],
    ['🌟 Goals (Mimpi)', '🔎 Focus Mode'],
    ['🎯 Habit Harian', '📋 Task List'],
    ['📖 Jurnal & Mood', '📊 Today Summary'],
    ['🔥 Habit Streaks', '⚙️ Menu Utama'],
  ]).resize();
}

/**
 * Handler untuk menampilkan Menu Utama Interaktif (/menu atau tombol ⚙️ Menu Utama)
 */
export async function handleMainMenuCommand(ctx: Context) {
  try {
    const webAppUrl = (
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_WEB_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:3011'
    ).replace(/\/$/, '');

    const inlineMenu = Markup.inlineKeyboard([
      [
        Markup.button.webApp('🚀 Launch Mini App', webAppUrl),
      ],
      [
        Markup.button.callback('🌟 Goals (Mimpi)', 'nav_goals'),
        Markup.button.callback('🔎 Focus Mode', 'nav_focus'),
      ],
      [
        Markup.button.callback('🎯 Habit Harian', 'nav_habits'),
        Markup.button.callback('📋 Task List', 'nav_tasks'),
      ],
      [
        Markup.button.callback('📖 Jurnal & Mood', 'nav_log'),
        Markup.button.callback('📊 Ringkasan Hari Ini', 'nav_today'),
      ],
      [
        Markup.button.callback('🔥 Habit Streaks', 'nav_streak'),
        Markup.button.callback('🌐 Web Dashboard Info', 'nav_web_info'),
      ],
    ]);

    const messageText =
      `📱 *Menu Utama Life OS Platform*\n\n` +
      `Silakan pilih menu di bawah ini tanpa perlu menghafal perintah slash commands:\n\n` +
      `• *Telegram Mini App:* Buka aplikasi langsung di Telegram! 🚀\n` +
      `• *Goals (Mimpi):* Kelola mimpi besar & pantau progress\n` +
      `• *Focus Mode:* Prioritas utama yang harus diselesaikan\n` +
      `• *Habit Harian:* Lakukan check-in kebiasaan harian\n` +
      `• *Task List:* Kelola tugas harian kamu\n` +
      `• *Jurnal & Mood:* Catat refleksi hari ini\n` +
      `• *Ringkasan Hari Ini:* Lihat laporan progres harian`;

    await ctx.reply(messageText, {
      parse_mode: 'Markdown',
      ...inlineMenu,
    });
  } catch (error) {
    console.error('Error in handleMainMenuCommand:', error);
    await ctx.reply('❌ Gagal membuka menu utama.');
  }
}

/**
 * Action handler untuk tombol Web Dashboard Info
 */
export async function handleWebInfoCallback(ctx: Context) {
  try {
    const webAppUrl = (
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_WEB_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:3011'
    ).replace(/\/$/, '');

    await ctx.answerCbQuery();
    await ctx.reply(
      `🌐 *Telegram Mini App & Web Dashboard Life OS*\n\n` +
        `Akses grafik lengkap, manajemen habit, task, dan jurnal langsung di browser atau Telegram:\n` +
        `👉 ${webAppUrl}`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.webApp('🚀 Buka Telegram Mini App', webAppUrl)],
        ]),
      }
    );
  } catch (error) {
    console.error('Error in handleWebInfoCallback:', error);
  }
}

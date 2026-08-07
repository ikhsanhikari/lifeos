import { Context, Markup, Telegraf } from 'telegraf';

/**
 * Registrasi daftar perintah resmi ke Telegram Client (Native Bot [/] Menu)
 */
export async function registerTelegramCommands(bot: Telegraf) {
  try {
    await bot.telegram.setMyCommands([
      { command: 'menu', description: '📱 Buka Menu Utama Interaktif' },
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
  return Markup.keyboard([
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
    const inlineMenu = Markup.inlineKeyboard([
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
      `• *Habit Harian:* Lakukan check-in kebiasaan harian\n` +
      `• *Task List:* Kelola tugas harian kamu\n` +
      `• *Jurnal & Mood:* Catat refleksi hari ini\n` +
      `• *Ringkasan Hari Ini:* Lihat laporan progres harian\n` +
      `• *Habit Streaks:* Cek rekor konsistensi kamu\n` +
      `• *Web Dashboard:* http://localhost:3001/dashboard`;

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
    await ctx.answerCbQuery();
    await ctx.reply(
      `🌐 *Web Dashboard Life OS*\n\n` +
        `Akses grafik lengkap, manajemen habit, task, dan jurnal di browser kamu:\n` +
        `👉 http://localhost:3001/dashboard`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Error in handleWebInfoCallback:', error);
  }
}

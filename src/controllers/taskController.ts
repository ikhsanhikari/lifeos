import { Context, Markup } from 'telegraf';
import { prisma } from '../server';
import { TaskPriority, TaskStatus } from '@prisma/client';

export interface TaskWithDetails {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: Date | null;
  dueTime: Date | null;
  tags: string[];
  parentId: string | null;
  sortOrder: number;
  completedAt: Date | null;
  createdAt: Date;
}

/**
 * Helper to resolve user ID from Telegram Chat ID or fallback to default user
 */
async function resolveUserId(telegramChatId?: bigint | null): Promise<string> {
  if (telegramChatId) {
    const telegramLink = await prisma.telegramLink.findUnique({
      where: { telegramChatId },
      select: { userId: true },
    });
    if (telegramLink) {
      return telegramLink.userId;
    }
  }

  const firstUser = await prisma.user.findFirst();
  if (firstUser) {
    return firstUser.id;
  }

  const defaultUser = await prisma.user.create({
    data: {
      email: 'default_user@lifeos.internal',
      name: 'Alex (Default User)',
    },
  });
  return defaultUser.id;
}

/**
 * 1. Mengambil daftar task harian/aktif milik user
 */
export async function getUserTasks(telegramChatId?: bigint | null): Promise<{
  userId: string;
  tasks: TaskWithDetails[];
}> {
  const userId = await resolveUserId(telegramChatId);

  let tasks = await prisma.task.findMany({
    where: {
      userId,
      status: { in: ['TODO', 'IN_PROGRESS', 'DONE'] },
    },
    orderBy: [
      { status: 'asc' }, // TODO first, then DONE
      { priority: 'asc' },
      { createdAt: 'desc' },
    ],
  });

  // Auto-seed sample tasks if user has no tasks yet
  if (tasks.length === 0) {
    console.log(`Auto-seeding sample tasks for user ${userId}...`);
    await prisma.task.createMany({
      data: [
        { userId, title: '📝 Menyusun laporan mingguan project Life OS', priority: 'HIGH', status: 'TODO' },
        { userId, title: '📧 Balas email konfirmasi tim arsitektur', priority: 'MEDIUM', status: 'TODO' },
        { userId, title: '🔍 Code review PR backend & API test', priority: 'URGENT', status: 'DONE', completedAt: new Date() },
        { userId, title: '🎨 Refactor UI Dashboard dark mode', priority: 'LOW', status: 'TODO' },
      ],
    });

    tasks = await prisma.task.findMany({
      where: { userId, status: { in: ['TODO', 'IN_PROGRESS', 'DONE'] } },
      orderBy: [{ status: 'asc' }, { priority: 'asc' }, { createdAt: 'desc' }],
    });
  }

  return { userId, tasks };
}

/**
 * 2. Membuat Task baru
 */
export async function createTask(data: {
  telegramChatId?: bigint | null;
  userId?: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: Date;
}) {
  const userId = data.userId || (await resolveUserId(data.telegramChatId));

  const newTask = await prisma.task.create({
    data: {
      userId,
      title: data.title,
      description: data.description || null,
      priority: data.priority || 'MEDIUM',
      status: 'TODO',
      dueDate: data.dueDate || new Date(),
    },
  });

  return newTask;
}

/**
 * 3. Update status Task (Toggle DONE / TODO)
 */
export async function updateTaskStatus(taskId: string, newStatus?: TaskStatus) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new Error('Task tidak ditemukan');

  const targetStatus = newStatus || (task.status === 'DONE' ? 'TODO' : 'DONE');
  const completedAt = targetStatus === 'DONE' ? new Date() : null;

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: targetStatus,
      completedAt,
    },
  });

  return updatedTask;
}

/**
 * Helper build inline keyboard untuk Telegram bot list task
 */
function buildTasksInlineKeyboard(tasks: TaskWithDetails[]) {
  const buttons = tasks.map((task) => {
    const isDone = task.status === 'DONE';
    const statusIcon = isDone ? '✅' : '⬜';
    const priorityIcon = task.priority === 'URGENT' ? '🔴' : task.priority === 'HIGH' ? '🟠' : task.priority === 'MEDIUM' ? '🟡' : '⚪';
    const label = `${statusIcon} ${priorityIcon} ${task.title}`;
    const callbackData = `toggle_task:${task.id}`;
    return [Markup.button.callback(label, callbackData)];
  });

  buttons.push([Markup.button.callback('🔄 Refresh Task', 'refresh_tasks')]);
  return Markup.inlineKeyboard(buttons);
}

/**
 * 4. Command Telegram /tasks: Menampilkan daftar tugas
 */
export async function handleTasksCommand(ctx: Context) {
  try {
    if (!ctx.chat) return;

    const telegramChatId = BigInt(ctx.chat.id);
    const { tasks } = await getUserTasks(telegramChatId);

    const completedCount = tasks.filter((t) => t.status === 'DONE').length;
    const messageText =
      `📋 *Daftar Task Harian Kamu*\n` +
      `📊 *Progres:* ${completedCount}/${tasks.length} Selesai\n\n` +
      `Klik tombol task di bawah untuk mengubah status (Selesai/Belum):`;

    await ctx.reply(messageText, {
      parse_mode: 'Markdown',
      ...buildTasksInlineKeyboard(tasks),
    });
  } catch (error) {
    console.error('Error handling /tasks command:', error);
    await ctx.reply('❌ Gagal mengambil daftar task.');
  }
}

/**
 * 5. Command Telegram /task <judul>: Quick Add Task dari chat
 */
export async function handleCreateTaskCommand(ctx: Context) {
  try {
    if (!ctx.chat || !('text' in ctx.message!)) return;

    const text = ctx.message.text.trim();
    const taskTitle = text.replace(/^\/task\s*/, '').trim();

    if (!taskTitle) {
      await ctx.reply('⚠️ Harap masukkan judul task.\nContoh: `/task Beli perlengkapan kerja`', {
        parse_mode: 'Markdown',
      });
      return;
    }

    const telegramChatId = BigInt(ctx.chat.id);
    const newTask = await createTask({
      telegramChatId,
      title: taskTitle,
      priority: 'MEDIUM',
    });

    await ctx.reply(
      `✅ *Task Baru Berhasil Ditambahkan!*\n\n` +
        `📌 *Judul:* ${newTask.title}\n` +
        `🏷️ *Prioritas:* ${newTask.priority}\n` +
        ` status: *TODO*`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Error handling /task command:', error);
    await ctx.reply('❌ Gagal membuat task baru.');
  }
}

/**
 * Callback action toggle status task dari inline keyboard
 */
export async function handleTaskToggleCallback(ctx: Context) {
  try {
    if (!ctx.chat || !('data' in ctx.callbackQuery!)) return;

    const callbackData = ctx.callbackQuery.data;

    if (callbackData === 'refresh_tasks') {
      await updateTasksMessage(ctx);
      await ctx.answerCbQuery('🔄 Daftar task diperbarui!');
      return;
    }

    const taskId = callbackData.replace('toggle_task:', '');
    const updatedTask = await updateTaskStatus(taskId);

    const toastMsg = updatedTask.status === 'DONE' ? '✅ Task ditandai Selesai!' : '↩️ Task dikembalikan ke TODO.';
    await ctx.answerCbQuery(toastMsg);

    await updateTasksMessage(ctx);
  } catch (error) {
    console.error('Error in handleTaskToggleCallback:', error);
    await ctx.answerCbQuery('❌ Gagal memperbarui status task.');
  }
}

/**
 * 6. Fungsi untuk menghapus Task
 */
export async function deleteTask(taskId: string) {
  const deletedTask = await prisma.task.delete({
    where: { id: taskId },
  });
  return deletedTask;
}

async function updateTasksMessage(ctx: Context) {
  if (!ctx.chat) return;

  const telegramChatId = BigInt(ctx.chat.id);
  const { tasks } = await getUserTasks(telegramChatId);

  const completedCount = tasks.filter((t) => t.status === 'DONE').length;
  const messageText =
    `📋 *Daftar Task Harian Kamu*\n` +
    `📊 *Progres:* ${completedCount}/${tasks.length} Selesai\n\n` +
    `Klik tombol task di bawah untuk mengubah status (Selesai/Belum):`;

  await ctx.editMessageText(messageText, {
    parse_mode: 'Markdown',
    ...buildTasksInlineKeyboard(tasks),
  });
}

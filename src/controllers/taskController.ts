import { Context, Markup } from 'telegraf';
import { prisma } from '../server';

export type TaskPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

export interface TaskWithDetails {
  id: string;
  userId: string;
  goalId?: string | null;
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
  goal?: {
    id: string;
    title: string;
  } | null;
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
export async function getUserTasks(telegramChatId?: bigint | null): Promise<{ userFound: boolean; tasks: TaskWithDetails[] }> {
  const userId = await resolveUserId(telegramChatId);

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      status: { in: ['TODO', 'IN_PROGRESS', 'DONE'] },
    },
    include: {
      goal: {
        select: { id: true, title: true },
      },
    },
    orderBy: [
      { status: 'asc' },
      { dueTime: { sort: 'asc', nulls: 'last' } },
      { dueDate: { sort: 'asc', nulls: 'last' } },
      { priority: 'asc' },
      { createdAt: 'desc' },
    ],
  });

  return { userFound: true, tasks: tasks as TaskWithDetails[] };
}

/**
 * 2. Membuat Task Baru via Web API / Telegram Command
 */
export async function createTask(data: {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: Date | null;
  dueTime?: Date | null;
  goalId?: string;
  userId: string;
}): Promise<TaskWithDetails> {
  const newTask = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority || 'MEDIUM',
      dueDate: data.dueDate,
      dueTime: data.dueTime,
      goalId: data.goalId || null,
      userId: data.userId,
    },
    include: {
      goal: {
        select: { id: true, title: true },
      },
    },
  });
  return newTask as TaskWithDetails;
}

/**
 * 3. Update Status Task (TODO / DONE)
 */
export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<TaskWithDetails> {
  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: {
      status,
      completedAt: status === 'DONE' ? new Date() : null,
    },
    include: {
      goal: {
        select: { id: true, title: true },
      },
    },
  });
  return updatedTask as TaskWithDetails;
}

/**
 * 3b. Update Full Task Details
 */
export async function updateTask(
  taskId: string,
  data: {
    title?: string;
    description?: string | null;
    priority?: TaskPriority;
    status?: TaskStatus;
    goalId?: string | null;
    dueDate?: Date | null;
    dueTime?: Date | null;
  }
): Promise<TaskWithDetails> {
  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.priority && { priority: data.priority }),
      ...(data.status && {
        status: data.status,
        completedAt: data.status === 'DONE' ? new Date() : null,
      }),
      ...(data.goalId !== undefined && { goalId: data.goalId }),
      ...(data.dueDate !== undefined && { dueDate: data.dueDate }),
      ...(data.dueTime !== undefined && { dueTime: data.dueTime }),
    },
    include: {
      goal: {
        select: { id: true, title: true },
      },
    },
  });
  return updatedTask as TaskWithDetails;
}

/**
 * 4. Hapus Task (Hard Delete)
 */
export async function deleteTask(taskId: string): Promise<TaskWithDetails> {
  const deletedTask = await prisma.task.delete({
    where: { id: taskId },
  });
  return deletedTask as TaskWithDetails;
}

/**
 * 5. Helper Inline Keyboard untuk list task Telegram (dengan Pagination)
 */
function buildTasksInlineKeyboard(tasks: TaskWithDetails[], page: number = 1, pageSize: number = 5) {
  const totalPages = Math.max(1, Math.ceil(tasks.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const paginatedTasks = tasks.slice((safePage - 1) * pageSize, safePage * pageSize);

  const buttons = paginatedTasks.map((task) => {
    const statusIcon = task.status === 'DONE' ? '✅' : '⬜';
    const priorityBadge = task.priority === 'URGENT' ? '🔴' : task.priority === 'HIGH' ? '🟠' : task.priority === 'MEDIUM' ? '🟡' : '⚪';
    const goalTag = task.goal ? `[${task.goal.title}] ` : '';
    const label = `${statusIcon} ${priorityBadge} ${goalTag}${task.title}`;
    return [Markup.button.callback(label, `toggle_task:${task.id}`)];
  });

  if (totalPages > 1) {
    const navRow = [];
    if (safePage > 1) {
      navRow.push(Markup.button.callback('◀️ Sblm', `nav_tasks_page:${safePage - 1}`));
    }
    navRow.push(Markup.button.callback(`Hal ${safePage}/${totalPages}`, 'refresh_tasks'));
    if (safePage < totalPages) {
      navRow.push(Markup.button.callback('Lanjut ▶️', `nav_tasks_page:${safePage + 1}`));
    }
    buttons.push(navRow);
  } else {
    buttons.push([Markup.button.callback('🔄 Refresh Task List', 'refresh_tasks')]);
  }

  return Markup.inlineKeyboard(buttons);
}

/**
 * 6. Telegram Command /tasks: Tampilkan daftar tugas interaktif dengan Pagination
 */
export async function handleTasksCommand(ctx: Context, pageParam?: number) {
  try {
    if (!ctx.chat) return;
    const page = typeof pageParam === 'number' ? pageParam : 1;

    const telegramChatId = BigInt(ctx.chat.id);
    const { tasks } = await getUserTasks(telegramChatId);

    if (tasks.length === 0) {
      await ctx.reply(
        '🎉 *Daftar tugas kamu kosong!*\n\nKetik `/task <judul_tugas>` untuk menambahkan tugas baru.',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const todoTasks = tasks.filter((t) => t.status !== 'DONE');
    const doneTasks = tasks.filter((t) => t.status === 'DONE');

    const messageText =
      `📋 *Daftar Tugas Harian Kamu*\n` +
      `📌 *To Do:* ${todoTasks.length} | ✅ *Selesai:* ${doneTasks.length}\n\n` +
      `Tap pada tombol tugas di bawah ini untuk mengubah status (Selesai/Belum):`;

    await ctx.reply(messageText, {
      parse_mode: 'Markdown',
      ...buildTasksInlineKeyboard(tasks, page),
    });
  } catch (error) {
    console.error('Error handling /tasks command:', error);
    await ctx.reply('❌ Terjadi kesalahan saat mengambil daftar tugas.');
  }
}

/**
 * 6b. Callback Query Handler untuk Navigasi Halaman Task Telegram
 */
export async function handleTasksPageCallback(ctx: Context) {
  try {
    const callbackQuery = ctx.callbackQuery as any;
    if (!callbackQuery || !callbackQuery.data || !ctx.chat) return;

    const pageStr = callbackQuery.data.replace('nav_tasks_page:', '');
    const page = parseInt(pageStr, 10) || 1;

    const telegramChatId = BigInt(ctx.chat.id);
    const { tasks } = await getUserTasks(telegramChatId);

    await ctx.editMessageReplyMarkup(buildTasksInlineKeyboard(tasks, page).reply_markup);
    await ctx.answerCbQuery(`📄 Halaman ${page}`);
  } catch (error) {
    console.error('Error handling tasks page callback:', error);
    await ctx.answerCbQuery();
  }
}

/**
 * 7. Telegram Command /task <judul>: Tambah tugas baru via chat
 */
export async function handleCreateTaskCommand(ctx: Context) {
  try {
    if (!ctx.chat) return;

    const telegramChatId = BigInt(ctx.chat.id);
    const userId = await resolveUserId(telegramChatId);

    const messageText = (ctx.message as any)?.text || '';
    const taskTitle = messageText.replace('/task', '').trim();

    if (!taskTitle) {
      await ctx.reply(
        '⚠️ *Judul tugas tidak boleh kosong!*\n\n' +
          'Gunakan format: `/task Judul Tugas Kamu`\n' +
          'Contoh: `/task Selesaikan laporan mingguan`',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const newTask = await createTask({
      title: taskTitle,
      userId,
    });

    await ctx.reply(
      `✅ *Tugas Berhasil Ditambahkan!*\n\n` +
        `📋 *Judul:* ${newTask.title}\n` +
        `🟡 *Prioritas:* MEDIUM\n\n` +
        `Ketik /tasks untuk melihat semua daftar tugas kamu.`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Error handling /task command:', error);
    await ctx.reply('❌ Terjadi kesalahan saat membuat tugas baru.');
  }
}

/**
 * 8. Callback Query Handler (Toggle Task DONE/TODO)
 */
export async function handleTaskToggleCallback(ctx: Context) {
  try {
    const callbackQuery = ctx.callbackQuery as any;
    if (!callbackQuery || !callbackQuery.data) return;

    const data: string = callbackQuery.data;

    if (data === 'refresh_tasks') {
      if (!ctx.chat) return;
      const telegramChatId = BigInt(ctx.chat.id);
      const { tasks } = await getUserTasks(telegramChatId);
      await ctx.editMessageReplyMarkup(buildTasksInlineKeyboard(tasks).reply_markup);
      await ctx.answerCbQuery('🔄 Daftar tugas diperbarui!');
      return;
    }

    const taskId = data.replace('toggle_task:', '');
    const currentTask = await prisma.task.findUnique({ where: { id: taskId } });

    if (!currentTask) {
      await ctx.answerCbQuery('⚠️ Tugas tidak ditemukan.');
      return;
    }

    const nextStatus: TaskStatus = currentTask.status === 'DONE' ? 'TODO' : 'DONE';
    await updateTaskStatus(taskId, nextStatus);

    if (!ctx.chat) return;
    const telegramChatId = BigInt(ctx.chat.id);
    const { tasks } = await getUserTasks(telegramChatId);

    await ctx.editMessageReplyMarkup(buildTasksInlineKeyboard(tasks).reply_markup);
    await ctx.answerCbQuery(nextStatus === 'DONE' ? '✅ Status tugas diubah ke Selesai!' : '⬜ Status tugas diubah ke To Do!');
  } catch (error) {
    console.error('Error handling task toggle callback:', error);
    await ctx.answerCbQuery('❌ Gagal memperbarui status tugas.');
  }
}

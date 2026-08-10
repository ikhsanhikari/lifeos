import React, { useState, useMemo } from 'react';
import { CheckSquare, Check, Trash2, Plus, CornerDownLeft, Search, Filter, ChevronLeft, ChevronRight, Pencil, Clock, Calendar } from 'lucide-react';

export interface TaskData {
  id: string;
  title: string;
  description: string | null;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  dueDate: string | null;
  dueTime?: string | null;
  completedAt: string | null;
  createdAt: string;
  goalId?: string | null;
  goal?: { id: string; title: string } | null;
}

import { Card } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from './EmptyState';

interface TaskPanelProps {
  tasks: TaskData[];
  onToggleTask: (id: string, status: string) => void;
  onDeleteTask: (id: string, e: React.MouseEvent) => void;
  onEditTask?: (task: TaskData) => void;
  onAddTask: (title: string, priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW', dueDate?: string, dueTime?: string) => Promise<void>;
  showTitle?: boolean;
}

export const TaskPanel: React.FC<TaskPanelProps> = ({
  tasks,
  onToggleTask,
  onDeleteTask,
  onEditTask,
  onAddTask,
  showTitle = true,
}) => {
  const [taskTab, setTaskTab] = useState<'all' | 'todo' | 'done'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [goalFilter, setGoalFilter] = useState<string>('ALL');

  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 6;

  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskPriority, setNewTaskPriority] = useState<'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const completedCount = tasks.filter((t) => t.status === 'DONE').length;
  const todoCount = tasks.filter((t) => t.status !== 'DONE').length;

  // Distinct list of goals for the goal filter dropdown
  const uniqueGoals = useMemo(() => {
    const goalMap = new Map<string, string>();
    tasks.forEach((t) => {
      if (t.goalId && t.goal) {
        goalMap.set(t.goalId, t.goal.title);
      }
    });
    return Array.from(goalMap.entries()).map(([id, title]) => ({ id, title }));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Tab filter
      if (taskTab === 'todo' && t.status === 'DONE') return false;
      if (taskTab === 'done' && t.status !== 'DONE') return false;

      // Priority filter
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;

      // Goal filter
      if (goalFilter === 'NONE' && t.goalId) return false;
      if (goalFilter !== 'ALL' && goalFilter !== 'NONE' && t.goalId !== goalFilter) return false;

      // Search query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const titleMatch = t.title.toLowerCase().includes(query);
        const goalMatch = t.goal?.title.toLowerCase().includes(query) || false;
        if (!titleMatch && !goalMatch) return false;
      }

      return true;
    });
  }, [tasks, taskTab, priorityFilter, goalFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedTasks = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredTasks.slice(start, start + pageSize);
  }, [filteredTasks, safeCurrentPage, pageSize]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddTask(newTaskTitle.trim(), newTaskPriority);
      setNewTaskTitle('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <Badge variant="urgent">Urgent</Badge>;
      case 'HIGH':
        return <Badge variant="high">High</Badge>;
      case 'MEDIUM':
        return <Badge variant="medium">Medium</Badge>;
      default:
        return <Badge variant="low">Low</Badge>;
    }
  };

  return (
    <Card className="flex flex-col justify-between space-y-3.5 sm:space-y-5">
      <div>
        {/* Panel Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pb-3 sm:pb-4 border-b border-zinc-800/80">
          {showTitle ? (
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <CheckSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-zinc-100 tracking-tight">Daftar Tugas (Tasks)</h2>
                <p className="text-[10px] sm:text-[11px] text-zinc-400">Prioritas & eksekusi hari ini</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-200">Daftar Tugas</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
                {tasks.length} Total
              </span>
            </div>
          )}

          <Tabs
            options={[
              { id: 'all', label: 'Semua', count: tasks.length },
              { id: 'todo', label: 'To Do', count: todoCount },
              { id: 'done', label: 'Selesai', count: completedCount },
            ]}
            activeTab={taskTab}
            onChange={(tabId) => {
              setTaskTab(tabId as any);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Search & Advanced Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 my-2.5 sm:my-3">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Cari tugas..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-zinc-900/90 border border-zinc-800 rounded-lg sm:rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* Priority & Goal Filters (Grid side-by-side on mobile) */}
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:col-span-2">
            <div className="relative">
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-zinc-900/90 border border-zinc-800 rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 truncate"
              >
                <option value="ALL">Semua Prioritas</option>
                <option value="URGENT">🔴 Urgent</option>
                <option value="HIGH">🟠 High</option>
                <option value="MEDIUM">🟡 Medium</option>
                <option value="LOW">⚪ Low</option>
              </select>
            </div>

            <div className="relative">
              <select
                value={goalFilter}
                onChange={(e) => {
                  setGoalFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-zinc-900/90 border border-zinc-800 rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 truncate"
              >
                <option value="ALL">Semua Goals</option>
                <option value="NONE">Standalone</option>
                {uniqueGoals.map((g) => (
                  <option key={g.id} value={g.id}>
                    🌟 {g.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Inline Add Task Form */}
        <form onSubmit={handleFormSubmit} className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Tugas baru..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="w-full bg-zinc-900/90 border border-zinc-800 rounded-lg sm:rounded-xl pl-3 pr-7 sm:pl-3.5 sm:pr-8 py-1.5 sm:py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <CornerDownLeft className="w-3.5 h-3.5 text-zinc-500 absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 hidden sm:block" />
          </div>

          <select
            value={newTaskPriority}
            onChange={(e) => setNewTaskPriority(e.target.value as any)}
            className="bg-zinc-900/90 border border-zinc-800 rounded-lg sm:rounded-xl px-2 sm:px-2.5 py-1.5 sm:py-2 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value="MEDIUM">🟡 Med</option>
            <option value="URGENT">🔴 Urg</option>
            <option value="HIGH">🟠 High</option>
            <option value="LOW">⚪ Low</option>
          </select>

          <button
            type="submit"
            disabled={isSubmitting || !newTaskTitle.trim()}
            className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg sm:rounded-xl transition-all disabled:opacity-50 flex items-center gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tambah</span>
          </button>
        </form>

        {/* Tasks List */}
        <div className="space-y-2 sm:space-y-2.5">
          {paginatedTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => onToggleTask(task.id, task.status)}
              className={`flex items-center justify-between py-2.5 px-3 sm:p-3.5 rounded-lg sm:rounded-xl border transition-all duration-200 cursor-pointer group ${
                task.status === 'DONE'
                  ? 'bg-zinc-900/40 border-zinc-800/60 opacity-75'
                  : 'bg-zinc-900/80 border-zinc-800/80 hover:border-indigo-500/40 hover:bg-zinc-800/50 shadow-sm'
              }`}
            >
              <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0 flex-1 pr-2">
                <button
                  type="button"
                  aria-label={`Toggle task ${task.title}`}
                  className={`w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-md flex items-center justify-center transition-all duration-200 shrink-0 mt-0.5 sm:mt-0 ${
                    task.status === 'DONE'
                      ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                      : 'border border-zinc-600 bg-zinc-800/60 group-hover:border-indigo-400'
                  }`}
                >
                  {task.status === 'DONE' && <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />}
                </button>

                <span
                  title={task.title}
                  className={`text-xs font-semibold break-words whitespace-normal leading-snug ${
                    task.status === 'DONE' ? 'line-through text-zinc-500 font-normal' : 'text-zinc-100'
                  }`}
                >
                  {task.title}
                </span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 self-start sm:self-center">
                {task.goal && (
                  <span
                    title={task.goal.title}
                    className="text-[9px] sm:text-[10px] font-medium px-1.5 sm:px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 max-w-[110px] sm:max-w-[160px] truncate"
                  >
                    🌟 {task.goal.title}
                  </span>
                )}
                {task.dueDate && (
                  <span className="text-[9px] sm:text-[10px] font-medium px-1.5 sm:px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(task.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                  </span>
                )}
                {task.dueTime && (
                  <span className="text-[9px] sm:text-[10px] font-medium px-1.5 sm:px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      {typeof task.dueTime === 'string' && task.dueTime.includes(':')
                        ? task.dueTime.substring(0, 5)
                        : new Date(task.dueTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </span>
                  </span>
                )}
                {renderPriorityBadge(task.priority)}
                {onEditTask && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditTask(task);
                    }}
                    title="Edit Task"
                    className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 p-1 hover:bg-indigo-500/10 text-zinc-400 hover:text-indigo-300 rounded-lg transition-all"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => onDeleteTask(task.id, e)}
                  title="Hapus Task"
                  className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 p-1 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 rounded-lg transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {filteredTasks.length === 0 && (
            <EmptyState
              icon={CheckSquare}
              title="Tidak ada tugas pada filter ini"
              description="Coba ubah pencarian atau filter prioritas/goal Anda."
            />
          )}
        </div>

        {/* Pagination Bar */}
        {filteredTasks.length > pageSize && (
          <div className="flex items-center justify-between pt-4 mt-2 border-t border-zinc-800/60 text-xs">
            <span className="text-zinc-400">
              Menampilkan {Math.min(filteredTasks.length, (safeCurrentPage - 1) * pageSize + 1)}-
              {Math.min(filteredTasks.length, safeCurrentPage * pageSize)} dari {filteredTasks.length} task
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                className="p-1 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-semibold text-zinc-300">
                {safeCurrentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                className="p-1 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};


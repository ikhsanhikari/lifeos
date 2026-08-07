import React, { useState } from 'react';
import { CheckSquare, Check, Trash2, Plus, CornerDownLeft } from 'lucide-react';
import { TaskData } from '../page';
import { Card } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from './EmptyState';

interface TaskPanelProps {
  tasks: TaskData[];
  onToggleTask: (id: string, status: string) => void;
  onDeleteTask: (id: string, e: React.MouseEvent) => void;
  onAddTask: (title: string, priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW') => Promise<void>;
}

export const TaskPanel: React.FC<TaskPanelProps> = ({
  tasks,
  onToggleTask,
  onDeleteTask,
  onAddTask,
}) => {
  const [taskTab, setTaskTab] = useState<'all' | 'todo' | 'done'>('all');
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskPriority, setNewTaskPriority] = useState<'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const completedCount = tasks.filter((t) => t.status === 'DONE').length;
  const todoCount = tasks.filter((t) => t.status !== 'DONE').length;

  const filteredTasks = tasks.filter((t) => {
    if (taskTab === 'todo') return t.status !== 'DONE';
    if (taskTab === 'done') return t.status === 'DONE';
    return true;
  });

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
    <Card className="flex flex-col justify-between space-y-5">
      <div>
        {/* Panel Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 tracking-tight">Daftar Tugas (Tasks)</h2>
              <p className="text-[11px] text-zinc-400">Prioritas & eksekusi hari ini</p>
            </div>
          </div>

          <Tabs
            options={[
              { id: 'all', label: 'Semua', count: tasks.length },
              { id: 'todo', label: 'To Do', count: todoCount },
              { id: 'done', label: 'Selesai', count: completedCount },
            ]}
            activeTab={taskTab}
            onChange={(tabId) => setTaskTab(tabId as any)}
          />
        </div>

        {/* Inline Add Task Form */}
        <form onSubmit={handleFormSubmit} className="flex items-center gap-2 my-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Tulis tugas baru lalu tekan Enter..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl pl-3.5 pr-8 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <CornerDownLeft className="w-3.5 h-3.5 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>

          <select
            value={newTaskPriority}
            onChange={(e) => setNewTaskPriority(e.target.value as any)}
            className="bg-zinc-900/90 border border-zinc-800 rounded-xl px-2.5 py-2 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value="MEDIUM">🟡 Medium</option>
            <option value="URGENT">🔴 Urgent</option>
            <option value="HIGH">🟠 High</option>
            <option value="LOW">⚪ Low</option>
          </select>

          <button
            type="submit"
            disabled={isSubmitting || !newTaskTitle.trim()}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah</span>
          </button>
        </form>

        {/* Tasks List */}
        <div className="space-y-2.5">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => onToggleTask(task.id, task.status)}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 cursor-pointer group ${
                task.status === 'DONE'
                  ? 'bg-zinc-900/40 border-zinc-800/60 opacity-75'
                  : 'bg-zinc-900/80 border-zinc-800/80 hover:border-indigo-500/40 hover:bg-zinc-800/50 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  aria-label={`Toggle task ${task.title}`}
                  className={`w-5 h-5 rounded-md flex items-center justify-center transition-all duration-200 shrink-0 ${
                    task.status === 'DONE'
                      ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                      : 'border border-zinc-600 bg-zinc-800/60 group-hover:border-indigo-400'
                  }`}
                >
                  {task.status === 'DONE' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>

                <span
                  className={`text-xs font-semibold truncate ${
                    task.status === 'DONE' ? 'line-through text-zinc-500 font-normal' : 'text-zinc-100'
                  }`}
                >
                  {task.title}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {renderPriorityBadge(task.priority)}
                <button
                  type="button"
                  onClick={(e) => onDeleteTask(task.id, e)}
                  title="Hapus Task"
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 rounded-lg transition-all"
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
              description="Tambahkan tugas baru untuk menyelesaikan agenda produktif kamu."
            />
          )}
        </div>
      </div>
    </Card>
  );
};

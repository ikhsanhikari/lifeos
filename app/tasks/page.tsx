'use client';

import React from 'react';
import { useDashboard } from '../components/DashboardShell';
import { TaskPanel } from '../dashboard/components/TaskPanel';

export default function TasksPage() {
  const {
    tasks,
    toggleTaskStatus,
    handleDeleteTask,
    handleAddNewTask,
  } = useDashboard();

  return (
    <div className="space-y-4">
      <TaskPanel
        tasks={tasks}
        onToggleTask={toggleTaskStatus}
        onDeleteTask={handleDeleteTask}
        onAddTask={handleAddNewTask}
      />
    </div>
  );
}

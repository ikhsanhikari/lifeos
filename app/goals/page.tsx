'use client';

import React from 'react';
import { useDashboard } from '../components/DashboardShell';
import { GoalPanel } from '../dashboard/components/GoalPanel';

export default function GoalsPage() {
  const {
    goals,
    aiStatus,
    handleDeleteGoal,
    setIsAddGoalModalOpen,
    handleAddTaskToGoal,
    handleOpenAiBreakdownModal,
  } = useDashboard();

  return (
    <div className="space-y-4">
      <GoalPanel
        goals={goals}
        onDeleteGoal={handleDeleteGoal}
        onOpenAddModal={() => setIsAddGoalModalOpen(true)}
        onAddTaskToGoal={handleAddTaskToGoal}
        onOpenAiBreakdown={handleOpenAiBreakdownModal}
        aiAvailable={aiStatus?.features?.goalBreakdown ?? aiStatus?.aiAvailable}
        showTitle={false}
      />
    </div>
  );
}

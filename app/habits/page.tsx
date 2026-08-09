'use client';

import React from 'react';
import { useDashboard } from '../components/DashboardShell';
import { HabitPanel } from '../dashboard/components/HabitPanel';
import { StreakInsights } from '../dashboard/components/StreakInsights';

export default function HabitsPage() {
  const {
    habits,
    analytics,
    toggleHabit,
    handleDeleteHabit,
    setIsAddHabitModalOpen,
  } = useDashboard();

  return (
    <div className="space-y-4 sm:space-y-6">
      <StreakInsights analytics={analytics} />

      <HabitPanel
        habits={habits}
        onToggleHabit={toggleHabit}
        onDeleteHabit={handleDeleteHabit}
        onOpenAddModal={() => setIsAddHabitModalOpen(true)}
      />
    </div>
  );
}

'use client';

import React from 'react';
import { useDashboard } from './components/DashboardShell';
import { StatsGrid } from './dashboard/components/StatsGrid';
import { GoalPanel } from './dashboard/components/GoalPanel';
import { HabitPanel } from './dashboard/components/HabitPanel';
import { TaskPanel } from './dashboard/components/TaskPanel';
import { DailyJournal } from './dashboard/components/DailyJournal';
import { StreakInsights } from './dashboard/components/StreakInsights';

export default function OverviewPage() {
  const {
    habits,
    tasks,
    dailyLog,
    analytics,
    goals,
    aiStatus,
    handleOpenShareModal,
    handleDeleteGoal,
    setIsAddGoalModalOpen,
    handleAddTaskToGoal,
    handleOpenAiBreakdownModal,
    toggleHabit,
    handleDeleteHabit,
    setIsAddHabitModalOpen,
    toggleTaskStatus,
    handleDeleteTask,
    handleAddNewTask,
    handleSaveDailyLog,
    handleFetchDailyCoachInsight,
  } = useDashboard();

  return (
    <>
      {/* Stats Overview Grid */}
      <StatsGrid
        habits={habits}
        tasks={tasks}
        dailyLog={dailyLog}
        analytics={analytics}
        onOpenShareModal={handleOpenShareModal}
      />

      {/* Goal Breakdown Section */}
      <GoalPanel
        goals={goals}
        onDeleteGoal={handleDeleteGoal}
        onOpenAddModal={() => setIsAddGoalModalOpen(true)}
        onAddTaskToGoal={handleAddTaskToGoal}
        onOpenAiBreakdown={handleOpenAiBreakdownModal}
        aiAvailable={aiStatus?.features?.goalBreakdown ?? aiStatus?.aiAvailable}
      />

      {/* Habit Streaks Insight Section */}
      <StreakInsights analytics={analytics} />

      {/* Main Interactive Grid (Habit Tracker & Task Management) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-6">
        <HabitPanel
          habits={habits}
          onToggleHabit={toggleHabit}
          onDeleteHabit={handleDeleteHabit}
          onOpenAddModal={() => setIsAddHabitModalOpen(true)}
        />

        <TaskPanel
          tasks={tasks}
          onToggleTask={toggleTaskStatus}
          onDeleteTask={handleDeleteTask}
          onAddTask={handleAddNewTask}
        />
      </div>

      {/* Daily Log & Reflection Journal Section */}
      <DailyJournal
        dailyLog={dailyLog}
        onSaveDailyLog={handleSaveDailyLog}
        onFetchDailyCoachInsight={handleFetchDailyCoachInsight}
        aiAvailable={aiStatus?.features?.dailyCoach ?? aiStatus?.aiAvailable}
      />
    </>
  );
}

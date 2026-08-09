'use client';

import React from 'react';
import { useDashboard } from '../components/DashboardShell';
import { DailyJournal } from '../dashboard/components/DailyJournal';

export default function JournalPage() {
  const {
    dailyLog,
    aiStatus,
    handleSaveDailyLog,
    handleFetchDailyCoachInsight,
  } = useDashboard();

  return (
    <div className="space-y-4">
      <DailyJournal
        dailyLog={dailyLog}
        onSaveDailyLog={handleSaveDailyLog}
        onFetchDailyCoachInsight={handleFetchDailyCoachInsight}
        aiAvailable={aiStatus?.features?.dailyCoach ?? aiStatus?.aiAvailable}
      />
    </div>
  );
}

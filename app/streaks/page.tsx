'use client';

import React from 'react';
import { useDashboard } from '../components/DashboardShell';
import { StreakInsights } from '../dashboard/components/StreakInsights';

export default function StreaksPage() {
  const { analytics } = useDashboard();

  return (
    <div className="space-y-4">
      <StreakInsights analytics={analytics} showTitle={false} />
    </div>
  );
}

import React from 'react';
import { Card } from '../../components/ui/Card';

export const LoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3 bg-zinc-800 rounded w-24" />
              <div className="w-8 h-8 bg-zinc-800 rounded-lg" />
            </div>
            <div className="h-8 bg-zinc-800 rounded w-16" />
            <div className="h-2 bg-zinc-800 rounded w-full mt-2" />
          </Card>
        ))}
      </div>

      {/* Main Panels Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[1, 2].map((i) => (
          <Card key={i} className="space-y-4 min-h-[300px]">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
              <div className="h-5 bg-zinc-800 rounded w-32" />
              <div className="h-7 bg-zinc-800 rounded-lg w-40" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-12 bg-zinc-800/60 rounded-xl" />
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

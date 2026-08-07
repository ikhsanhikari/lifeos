import React from 'react';

interface ProgressBarProps {
  value: number; // 0 - 100
  color?: 'indigo' | 'emerald' | 'amber' | 'violet';
  height?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  color = 'indigo',
  height = 'sm',
  showLabel = false,
  className = '',
}) => {
  const percentage = Math.min(Math.max(value, 0), 100);

  const heightStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  };

  const gradientStyles = {
    indigo: 'bg-gradient-to-r from-indigo-500 to-violet-500',
    emerald: 'bg-gradient-to-r from-emerald-500 to-teal-400',
    amber: 'bg-gradient-to-r from-amber-500 to-orange-400',
    violet: 'bg-gradient-to-r from-violet-500 to-fuchsia-500',
  };

  const textColorStyles = {
    indigo: 'text-indigo-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    violet: 'text-violet-400',
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-xs mb-1 font-medium text-zinc-400">
          <span>Progres</span>
          <span className={`${textColorStyles[color]} font-bold`}>{percentage}%</span>
        </div>
      )}
      <div className={`w-full ${heightStyles[height]} rounded-full bg-zinc-800/80 overflow-hidden`}>
        <div
          className={`h-full ${gradientStyles[color]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

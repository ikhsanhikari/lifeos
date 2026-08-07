import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-10 px-4 rounded-xl bg-zinc-900/40 border border-dashed border-zinc-800 ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center text-zinc-400 mb-3.5 shadow-inner">
        <Icon className="w-6 h-6 stroke-[1.5]" />
      </div>
      <h4 className="text-sm font-semibold text-zinc-200">{title}</h4>
      <p className="text-xs text-zinc-500 max-w-xs mt-1 mb-4 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

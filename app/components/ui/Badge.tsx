import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'urgent' | 'high' | 'medium' | 'low' | 'success' | 'neutral' | 'indigo';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  className = '',
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-md border tracking-tight';

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
  };

  const variantStyles = {
    urgent: 'bg-rose-500/10 border-rose-500/30 text-rose-400 font-semibold',
    high: 'bg-amber-500/10 border-amber-500/30 text-amber-400 font-semibold',
    medium: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 font-semibold',
    low: 'bg-zinc-800 border-zinc-700 text-zinc-400 font-medium',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-medium',
    neutral: 'bg-zinc-800/80 border-zinc-700/60 text-zinc-400',
    indigo: 'bg-indigo-600/10 border-indigo-500/30 text-indigo-300 font-medium',
  };

  return (
    <span className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};

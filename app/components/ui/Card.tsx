import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'interactive';
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  const baseStyles = 'rounded-xl sm:rounded-2xl border border-zinc-800/80 bg-zinc-900/70 backdrop-blur-md p-3.5 sm:p-5 lg:p-6 transition-all duration-200';

  const variantStyles = {
    default: 'shadow-md',
    elevated: 'shadow-xl bg-zinc-900/90 border-zinc-800',
    interactive: 'hover:border-zinc-700 hover:bg-zinc-900/90 cursor-pointer shadow-md hover:shadow-lg',
  };

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

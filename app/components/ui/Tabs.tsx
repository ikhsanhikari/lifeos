import React from 'react';

export interface TabOption<T extends string = string> {
  id: T;
  label: string;
  count?: number;
}

interface TabsProps<T extends string = string> {
  options: TabOption<T>[];
  activeTab: T;
  onChange: (id: T) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function Tabs<T extends string = string>({
  options,
  activeTab,
  onChange,
  size = 'sm',
  className = '',
}: TabsProps<T>) {
  return (
    <div className={`flex bg-zinc-900/90 p-1 rounded-xl border border-zinc-800/80 text-xs font-medium ${className}`}>
      {options.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 ${
              isActive
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive ? 'bg-indigo-500/40 text-white' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

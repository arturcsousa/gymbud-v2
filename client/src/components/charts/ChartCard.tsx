import React from 'react';

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

export function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
      <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">
        {title}
      </h3>
      <div className="h-48">
        {children}
      </div>
    </div>
  );
}

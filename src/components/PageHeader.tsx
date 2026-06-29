import React from 'react';

interface PageHeaderProps {
  icon: string;
  title: string;
}

export default function PageHeader({ icon, title }: PageHeaderProps) {
  return (
    <div className="mb-4">
      <h2 className="text-2xl font-black text-foreground flex items-center gap-2">
        <span className="material-symbols-rounded text-[28px] opacity-80">{icon}</span> {title}
      </h2>
    </div>
  );
}

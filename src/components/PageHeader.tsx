import { ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({ title, subtitle, action, children }: PageHeaderProps) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-[hsl(173_72%_36%)] to-[hsl(200_50%_30%)] p-6 text-white shadow-lg flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-heading font-bold">{title}</h1>
        {subtitle && <p className="text-white/70 mt-1">{subtitle}</p>}
      </div>
      {(action || children) && <div className="flex gap-2">{action}{children}</div>}
    </div>
  );
}

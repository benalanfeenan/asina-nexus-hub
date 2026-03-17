import { DollarSign, Clock, FileText, AlertTriangle } from "lucide-react";

interface StatsProps {
  stats: { paid: number; outstanding: number; draftCount: number; readyCount: number };
}

export function InvoicingStatsBar({ stats }: StatsProps) {
  const cards = [
    { label: "Total Invoiced", value: `$${stats.paid.toFixed(2)}`, icon: DollarSign, bg: "bg-green-50 dark:bg-green-900/20", border: "border-green-200 dark:border-green-800", iconColor: "text-green-600 dark:text-green-400" },
    { label: "Outstanding", value: `$${stats.outstanding.toFixed(2)}`, icon: AlertTriangle, bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-200 dark:border-amber-800", iconColor: "text-amber-600 dark:text-amber-400" },
    { label: "Draft Invoices", value: String(stats.draftCount), icon: FileText, bg: "bg-muted/50", border: "border-border", iconColor: "text-muted-foreground" },
    { label: "Ready to Invoice", value: `${stats.readyCount} shifts`, icon: Clock, bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800", iconColor: "text-blue-600 dark:text-blue-400" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div key={c.label} className={`rounded-xl border ${c.border} ${c.bg} p-4 flex items-center gap-3`}>
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${c.bg} ${c.iconColor}`}>
            <c.icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{c.label}</p>
            <p className="text-lg font-bold tracking-tight">{c.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

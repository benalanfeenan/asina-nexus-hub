import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ReportMonthlySummary() {
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const start = startOfMonth(new Date(month + "-01")).toISOString();
  const end = endOfMonth(new Date(month + "-01")).toISOString();

  const { data: stats } = useQuery({
    queryKey: ["monthly-summary", month],
    queryFn: async () => {
      const [incidents, complaints, rp, feedback, qi, shifts] = await Promise.all([
        supabase.from("incidents").select("id, severity, status", { count: "exact" }).gte("date_occurred", start).lte("date_occurred", end),
        supabase.from("complaints").select("id", { count: "exact" }).gte("created_at", start).lte("created_at", end),
        supabase.from("restrictive_practices").select("id", { count: "exact" }).gte("date_occurred", start).lte("date_occurred", end),
        supabase.from("feedback").select("id", { count: "exact" }).gte("date", start.slice(0, 10)).lte("date", end.slice(0, 10)),
        supabase.from("quality_improvements").select("id, status", { count: "exact" }).gte("created_at", start).lte("created_at", end),
        supabase.from("shifts").select("id", { count: "exact" }).gte("date", start.slice(0, 10)).lte("date", end.slice(0, 10)),
      ]);
      return {
        incidents: incidents.count || 0, complaints: complaints.count || 0, rp: rp.count || 0,
        feedback: feedback.count || 0, qi: qi.count || 0, shifts: shifts.count || 0,
        incidentData: incidents.data || [], qiData: qi.data || [],
      };
    },
  });

  const exportCSV = () => {
    if (!stats) return;
    const rows = [
      ["Metric", "Count"],
      ["Incidents", stats.incidents], ["Complaints", stats.complaints], ["Restrictive Practices", stats.rp],
      ["Feedback", stats.feedback], ["Quality Improvements", stats.qi], ["Shifts", stats.shifts],
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `monthly-summary-${month}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const s = stats || { incidents: 0, complaints: 0, rp: 0, feedback: 0, qi: 0, shifts: 0, incidentData: [], qiData: [] };

  return (
    <div className="space-y-6">
      <PageHeader title="Monthly Summary Report" subtitle="Exportable overview for management review">
        <div className="flex gap-2 items-end">
          <div><Label>Month</Label><Input type="month" value={month} onChange={e => setMonth(e.target.value)} /></div>
          <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-1" />Export CSV</Button>
        </div>
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Incidents", value: s.incidents },
          { label: "Complaints", value: s.complaints },
          { label: "Restrictive Practices", value: s.rp },
          { label: "Feedback", value: s.feedback },
          { label: "QI Actions", value: s.qi },
          { label: "Shifts", value: s.shifts },
        ].map(item => (
          <Card key={item.label}>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Incident Breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {["low", "medium", "high", "critical"].map(sev => {
                const c = s.incidentData.filter((i: any) => i.severity === sev).length;
                return c > 0 ? <div key={sev} className="flex justify-between"><span className="capitalize">{sev}</span><span className="font-medium">{c}</span></div> : null;
              })}
              {s.incidents === 0 && <p className="text-muted-foreground">No incidents this month</p>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">QI Action Status</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {["open", "in_progress", "completed"].map(st => {
                const c = s.qiData.filter((q: any) => q.status === st).length;
                return c > 0 ? <div key={st} className="flex justify-between"><span className="capitalize">{st.replace("_", " ")}</span><span className="font-medium">{c}</span></div> : null;
              })}
              {s.qi === 0 && <p className="text-muted-foreground">No QI actions this month</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

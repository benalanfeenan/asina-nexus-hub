import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { format, subMonths, startOfMonth } from "date-fns";

const COLORS = ["hsl(173, 72%, 36%)", "hsl(38, 78%, 56%)", "hsl(0, 84%, 60%)", "hsl(142, 71%, 45%)", "hsl(200, 50%, 50%)"];

export default function ReportIncidentTrends() {
  const { data: incidents = [] } = useQuery({
    queryKey: ["report-incidents"],
    queryFn: async () => {
      const sixMonthsAgo = subMonths(new Date(), 6).toISOString();
      const { data } = await supabase.from("incidents").select("severity, date_occurred, status").gte("date_occurred", sixMonthsAgo);
      return data || [];
    },
  });

  const monthlyData = (() => {
    const months: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      months[format(startOfMonth(d), "MMM yyyy")] = 0;
    }
    incidents.forEach((inc: any) => {
      const key = format(new Date(inc.date_occurred), "MMM yyyy");
      if (key in months) months[key]++;
    });
    return Object.entries(months).map(([month, count]) => ({ month, count }));
  })();

  const severityData = (() => {
    const counts: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    incidents.forEach((inc: any) => { if (inc.severity in counts) counts[inc.severity]++; });
    return Object.entries(counts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  })();

  return (
    <div className="space-y-6">
      <PageHeader title="Incident Trends" subtitle="6-month incident analysis" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Incidents by Month</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" fontSize={12} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="hsl(173, 72%, 36%)" radius={[4, 4, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">By Severity</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart><Pie data={severityData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" nameKey="name" label>{severityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div><p className="text-2xl font-bold">{incidents.length}</p><p className="text-sm text-muted-foreground">Total (6 months)</p></div>
            <div><p className="text-2xl font-bold">{incidents.filter((i: any) => i.status === "open").length}</p><p className="text-sm text-muted-foreground">Open</p></div>
            <div><p className="text-2xl font-bold">{incidents.filter((i: any) => i.severity === "critical" || i.severity === "high").length}</p><p className="text-sm text-muted-foreground">High/Critical</p></div>
            <div><p className="text-2xl font-bold">{incidents.filter((i: any) => i.status === "closed").length}</p><p className="text-sm text-muted-foreground">Closed</p></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

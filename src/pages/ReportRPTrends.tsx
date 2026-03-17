import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { format, subMonths, startOfMonth } from "date-fns";

export default function ReportRPTrends() {
  const { data: practices = [] } = useQuery({
    queryKey: ["report-rp"],
    queryFn: async () => {
      const twelveMonthsAgo = subMonths(new Date(), 12).toISOString();
      const { data } = await supabase.from("restrictive_practices").select("practice_type, date_occurred, duration_minutes, is_authorised").gte("date_occurred", twelveMonthsAgo);
      return data || [];
    },
  });

  const monthlyData = (() => {
    const months: Record<string, { month: string; count: number; avg_duration: number; _durations: number[] }> = {};
    for (let i = 11; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const key = format(startOfMonth(d), "MMM yyyy");
      months[key] = { month: key, count: 0, avg_duration: 0, _durations: [] };
    }
    practices.forEach((p: any) => {
      const key = format(new Date(p.date_occurred), "MMM yyyy");
      if (key in months) {
        months[key].count++;
        if (p.duration_minutes) months[key]._durations.push(p.duration_minutes);
      }
    });
    return Object.values(months).map(m => ({
      month: m.month, count: m.count,
      avg_duration: m._durations.length ? Math.round(m._durations.reduce((a, b) => a + b, 0) / m._durations.length) : 0,
    }));
  })();

  const typeData = (() => {
    const counts: Record<string, number> = {};
    practices.forEach((p: any) => { counts[p.practice_type] = (counts[p.practice_type] || 0) + 1; });
    return Object.entries(counts).map(([type, count]) => ({ type: type.replace(/_/g, " "), count }));
  })();

  return (
    <div className="space-y-6">
      <PageHeader title="Restrictive Practice Trends" subtitle="12-month analysis showing reduction over time" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Monthly Count (Trend)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" fontSize={11} angle={-45} textAnchor="end" height={60} /><YAxis allowDecimals={false} /><Tooltip /><Line type="monotone" dataKey="count" stroke="hsl(173, 72%, 36%)" strokeWidth={2} dot={{ r: 4 }} /></LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">By Type</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeData} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="type" width={120} fontSize={12} /><Tooltip /><Bar dataKey="count" fill="hsl(38, 78%, 56%)" radius={[0, 4, 4, 0]} /></BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div><p className="text-2xl font-bold">{practices.length}</p><p className="text-sm text-muted-foreground">Total (12 months)</p></div>
            <div><p className="text-2xl font-bold">{practices.filter((p: any) => p.is_authorised).length}</p><p className="text-sm text-muted-foreground">Authorised</p></div>
            <div><p className="text-2xl font-bold">{practices.filter((p: any) => !p.is_authorised).length}</p><p className="text-sm text-muted-foreground">Unauthorised</p></div>
            <div><p className="text-2xl font-bold">{practices.length > 0 ? Math.round(practices.reduce((a: number, p: any) => a + (p.duration_minutes || 0), 0) / practices.length) : 0}</p><p className="text-sm text-muted-foreground">Avg Duration (min)</p></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

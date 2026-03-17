import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCog, AlertTriangle, Clock, CalendarDays, ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { AlertsWidget } from "@/components/dashboard/AlertsWidget";

export default function Dashboard() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);

  const { data: participantCount = 0 } = useQuery({
    queryKey: ["dash-participants"],
    queryFn: async () => {
      const { count } = await supabase.from("participants").select("id", { count: "exact", head: true }).eq("is_active", true);
      return count || 0;
    },
  });

  const { data: staffCount = 0 } = useQuery({
    queryKey: ["dash-staff"],
    queryFn: async () => {
      const { count } = await supabase.from("staff").select("id", { count: "exact", head: true }).eq("is_active", true);
      return count || 0;
    },
  });

  const { data: openIncidents = 0 } = useQuery({
    queryKey: ["dash-incidents"],
    queryFn: async () => {
      const { count } = await supabase.from("incidents").select("id", { count: "exact", head: true }).eq("status", "open");
      return count || 0;
    },
  });

  const { data: pendingTimesheets = 0 } = useQuery({
    queryKey: ["dash-timesheets"],
    queryFn: async () => {
      const { count } = await supabase.from("timesheets").select("id", { count: "exact", head: true }).eq("approval_status", "pending");
      return count || 0;
    },
  });

  const { data: recentIncidents = [] } = useQuery({
    queryKey: ["dash-recent-incidents"],
    queryFn: async () => {
      const { data } = await supabase.from("incidents").select("id, title, severity, reference_number, date_occurred").order("date_occurred", { ascending: false }).limit(5);
      return data || [];
    },
  });

  const { data: todayShifts = [] } = useQuery({
    queryKey: ["dash-today-shifts"],
    queryFn: async () => {
      const { data } = await supabase.from("shifts")
        .select("id, shift_type, status, sil_houses(name), staff(profiles(full_name))")
        .eq("date", today).order("start_time");
      return data || [];
    },
  });

  const { data: expiringCompliance = [] } = useQuery({
    queryKey: ["dash-expiring"],
    queryFn: async () => {
      const thirtyDays = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
      const { data } = await supabase.from("staff_compliance")
        .select("check_type, expiry_date, staff(profiles(full_name))")
        .lte("expiry_date", thirtyDays)
        .order("expiry_date")
        .limit(5);
      return data || [];
    },
  });

  const severityColors: Record<string, string> = {
    low: "bg-success/15 text-success", medium: "bg-warning/15 text-warning",
    high: "bg-accent/20 text-accent-foreground", critical: "bg-destructive/15 text-destructive",
  };

  const statCards = [
    { label: "Active Participants", value: participantCount, icon: Users, path: "/participants" },
    { label: "Active Staff", value: staffCount, icon: UserCog, path: "/staff" },
    { label: "Open Incidents", value: openIncidents, icon: AlertTriangle, path: "/incidents" },
    { label: "Pending Timesheets", value: pendingTimesheets, icon: Clock, path: "/timesheets" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Welcome back to Asina — NDIS All in One" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.path} className="cursor-pointer group border-l-4 border-l-primary" onClick={() => navigate(s.path)}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-brand-gradient-subtle flex items-center justify-center">
                <s.icon className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{s.value}</p></CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-primary" />Recent Incidents</CardTitle></CardHeader>
          <CardContent>
            {recentIncidents.length === 0 ? <p className="text-sm text-muted-foreground">No recent incidents</p> : (
              <div className="space-y-3">
                {recentIncidents.map((i: any) => (
                  <div key={i.id} className="flex items-center justify-between text-sm">
                    <div><p className="font-medium">{i.title}</p><p className="text-xs text-muted-foreground">{i.reference_number} · {format(new Date(i.date_occurred), "dd/MM")}</p></div>
                    <Badge variant="secondary" className={severityColors[i.severity] || ""}>{i.severity}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" />Today's Shifts</CardTitle></CardHeader>
          <CardContent>
            {todayShifts.length === 0 ? <p className="text-sm text-muted-foreground">No shifts today</p> : (
              <div className="space-y-3">
                {todayShifts.slice(0, 6).map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between text-sm">
                    <div><p className="font-medium capitalize">{s.shift_type.replace("_", " ")}</p><p className="text-xs text-muted-foreground">{(s.sil_houses as any)?.name}</p></div>
                    <span className="text-xs">{(s.staff as any)?.profiles?.full_name || "Unassigned"}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-primary" />Compliance Expiring</CardTitle></CardHeader>
          <CardContent>
            {expiringCompliance.length === 0 ? <p className="text-sm text-muted-foreground">All clear</p> : (
              <div className="space-y-3">
                {expiringCompliance.map((c: any, idx: number) => {
                  const isExpired = new Date(c.expiry_date) < new Date();
                  return (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div><p className="font-medium">{(c.staff as any)?.profiles?.full_name}</p><p className="text-xs text-muted-foreground capitalize">{c.check_type.replace("_", " ")}</p></div>
                      <Badge variant="secondary" className={isExpired ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning"}>{isExpired ? "Expired" : format(new Date(c.expiry_date), "dd/MM")}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <AlertsWidget />
      </div>
    </div>
  );
}

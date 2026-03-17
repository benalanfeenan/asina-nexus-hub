import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCog, AlertTriangle, Clock, CalendarDays, ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

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
    low: "bg-green-100 text-green-800", medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800", critical: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back to NDIS All in One</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/participants")}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{participantCount}</p></CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/staff")}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Staff</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{staffCount}</p></CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/incidents")}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{openIncidents}</p></CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/timesheets")}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Timesheets</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{pendingTimesheets}</p></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Incidents */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Recent Incidents</CardTitle></CardHeader>
          <CardContent>
            {recentIncidents.length === 0 ? <p className="text-sm text-muted-foreground">No recent incidents</p> : (
              <div className="space-y-3">
                {recentIncidents.map((i: any) => (
                  <div key={i.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{i.title}</p>
                      <p className="text-xs text-muted-foreground">{i.reference_number} · {format(new Date(i.date_occurred), "dd/MM")}</p>
                    </div>
                    <Badge variant="secondary" className={severityColors[i.severity] || ""}>{i.severity}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Shifts */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><CalendarDays className="h-4 w-4" />Today's Shifts</CardTitle></CardHeader>
          <CardContent>
            {todayShifts.length === 0 ? <p className="text-sm text-muted-foreground">No shifts today</p> : (
              <div className="space-y-3">
                {todayShifts.slice(0, 6).map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium capitalize">{s.shift_type.replace("_", " ")}</p>
                      <p className="text-xs text-muted-foreground">{(s.sil_houses as any)?.name}</p>
                    </div>
                    <span className="text-xs">{(s.staff as any)?.profiles?.full_name || "Unassigned"}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compliance Alerts */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShieldAlert className="h-4 w-4" />Compliance Alerts</CardTitle></CardHeader>
          <CardContent>
            {expiringCompliance.length === 0 ? <p className="text-sm text-muted-foreground">All clear</p> : (
              <div className="space-y-3">
                {expiringCompliance.map((c: any, idx: number) => {
                  const isExpired = new Date(c.expiry_date) < new Date();
                  return (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">{(c.staff as any)?.profiles?.full_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{c.check_type.replace("_", " ")}</p>
                      </div>
                      <Badge variant="secondary" className={isExpired ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}>
                        {isExpired ? "Expired" : format(new Date(c.expiry_date), "dd/MM")}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

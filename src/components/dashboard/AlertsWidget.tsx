import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { differenceInDays, format } from "date-fns";

interface Alert {
  type: string;
  message: string;
  severity: "critical" | "warning" | "info";
  due?: string;
}

export function AlertsWidget() {
  const { data: alerts = [] } = useQuery({
    queryKey: ["dashboard-alerts"],
    queryFn: async () => {
      const computed: Alert[] = [];
      const today = new Date();
      const sixtyDays = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);
      const thirtyDays = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

      // Expiring staff compliance (WSC, First Aid)
      const { data: expiring } = await supabase.from("staff_compliance")
        .select("check_type, expiry_date, staff(profiles(full_name))")
        .lte("expiry_date", sixtyDays).order("expiry_date").limit(10);
      expiring?.forEach((c: any) => {
        const days = differenceInDays(new Date(c.expiry_date), today);
        const name = (c.staff as any)?.profiles?.full_name || "Unknown";
        computed.push({
          type: "compliance", severity: days < 0 ? "critical" : "warning",
          message: `${name}: ${c.check_type.replace(/_/g, " ")} ${days < 0 ? "expired" : `expires in ${days} days`}`,
          due: c.expiry_date,
        });
      });

      // Complaints not acknowledged within 2 days
      const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();
      const { data: unackedComplaints } = await supabase.from("complaints")
        .select("title, reference_number").is("acknowledgement_date", null).lte("created_at", twoDaysAgo).eq("status", "received").limit(5);
      unackedComplaints?.forEach((c: any) => {
        computed.push({ type: "complaint", severity: "critical", message: `Complaint ${c.reference_number} not acknowledged` });
      });

      // QI actions overdue
      const { data: overdueQI } = await supabase.from("quality_improvements")
        .select("description, due_date").lt("due_date", today.toISOString().slice(0, 10)).neq("status", "completed").limit(5);
      overdueQI?.forEach((q: any) => {
        computed.push({ type: "qi", severity: "warning", message: `QI overdue: ${q.description.slice(0, 50)}`, due: q.due_date });
      });

      // Fire drills overdue (check last drill per house > 6 months)
      const { data: houses } = await supabase.from("sil_houses").select("id, name").eq("is_active", true);
      if (houses) {
        for (const house of houses.slice(0, 10)) {
          const { data: lastDrill } = await supabase.from("fire_drills").select("date").eq("sil_house_id", house.id).order("date", { ascending: false }).limit(1);
          if (!lastDrill?.length || differenceInDays(today, new Date(lastDrill[0].date)) > 180) {
            computed.push({ type: "fire_drill", severity: "warning", message: `Fire drill overdue: ${house.name}` });
          }
        }
      }

      return computed.sort((a, b) => (a.severity === "critical" ? -1 : 1) - (b.severity === "critical" ? -1 : 1));
    },
    refetchInterval: 300000, // 5 min
  });

  const severityColors = { critical: "bg-destructive/15 text-destructive", warning: "bg-warning/15 text-warning", info: "bg-primary/10 text-primary" };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />Compliance Alerts
          {alerts.length > 0 && <Badge variant="destructive" className="ml-auto">{alerts.length}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? <p className="text-sm text-muted-foreground">All clear — no alerts</p> : (
          <div className="space-y-3">
            {alerts.slice(0, 8).map((a, i) => (
              <div key={i} className="flex items-start justify-between gap-2 text-sm">
                <p>{a.message}</p>
                <Badge variant="secondary" className={severityColors[a.severity]}>{a.severity}</Badge>
              </div>
            ))}
            {alerts.length > 8 && <p className="text-xs text-muted-foreground">+{alerts.length - 8} more alerts</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

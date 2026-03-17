import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { StaffTrainingTab } from "@/components/staff/StaffTrainingTab";
import { StaffComplianceTab } from "@/components/staff/StaffComplianceTab";
import { StaffSupervisionsTab } from "@/components/staff/StaffSupervisionsTab";
import { StaffCompetenciesTab } from "@/components/staff/StaffCompetenciesTab";
import { StaffAcknowledgementsTab } from "@/components/staff/StaffAcknowledgementsTab";
import { StaffDocumentsTab } from "@/components/staff/StaffDocumentsTab";
import { useMemo } from "react";
import { addMonths } from "date-fns";
import {
  COMPLIANCE_ITEMS, DEFAULT_ROLE_FLAGS, calculateComplianceScore, type RoleFlags,
} from "@/lib/compliance-definitions";

export default function StaffDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: staff, isLoading } = useQuery({
    queryKey: ["staff", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("staff")
        .select("*, profiles(full_name, email, phone)")
        .eq("id", id!)
        .maybeSingle();
      return data;
    },
    enabled: !!id,
  });

  const { data: linkedHouses = [] } = useQuery({
    queryKey: ["staff-houses", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("sil_house_staff")
        .select("sil_houses(name)")
        .eq("staff_id", id!);
      return data || [];
    },
    enabled: !!id,
  });

  const { data: roleFlags } = useQuery({
    queryKey: ["staff-role-flags", id],
    queryFn: async () => {
      const { data } = await supabase.from("staff_role_flags").select("*").eq("staff_id", id!).maybeSingle();
      return data;
    },
    enabled: !!id,
  });

  const { data: complianceRecords = [] } = useQuery({
    queryKey: ["staff-compliance-items", id],
    queryFn: async () => {
      const { data } = await supabase.from("staff_compliance_items").select("*").eq("staff_id", id!);
      return data || [];
    },
    enabled: !!id,
  });

  // Fetch latest supervision for overdue check
  const { data: latestSupervision } = useQuery({
    queryKey: ["staff-latest-supervision", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("staff_supervisions")
        .select("date")
        .eq("staff_id", id!)
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!id,
  });

  const flags: RoleFlags = useMemo(() => {
    if (!roleFlags) return DEFAULT_ROLE_FLAGS;
    return {
      administers_medication: roleFlags.administers_medication,
      supports_mealtime_assessed: roleFlags.supports_mealtime_assessed,
      supports_bsp_participants: roleFlags.supports_bsp_participants,
      delivers_high_intensity: roleFlags.delivers_high_intensity,
      uses_restrictive_practices: roleFlags.uses_restrictive_practices,
      transports_participants: roleFlags.transports_participants,
      supports_under_18: roleFlags.supports_under_18,
    };
  }, [roleFlags]);

  const score = useMemo(() => {
    const map = new Map<string, any>();
    complianceRecords.forEach((r) => map.set(r.item_key, r));
    return calculateComplianceScore(COMPLIANCE_ITEMS, map, flags);
  }, [complianceRecords, flags]);

  const supervisionFrequency = (staff as any)?.supervision_frequency_months ?? 1;

  const isSupervisionOverdue = useMemo(() => {
    const baseDate = latestSupervision?.date || staff?.start_date;
    if (!baseDate) return false;
    const nextDue = addMonths(new Date(baseDate), supervisionFrequency);
    return new Date() > nextDue;
  }, [latestSupervision, staff?.start_date, supervisionFrequency]);

  const scoreColor = score === 100 ? "text-emerald-600" : score >= 80 ? "text-amber-600" : "text-destructive";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!staff) {
    return <div className="py-12 text-center text-muted-foreground">Staff member not found.</div>;
  }

  const profile = staff.profiles as { full_name: string; email: string | null; phone: string | null } | null;
  const displayName = (staff as any).first_name || (staff as any).last_name
    ? [(staff as any).first_name, (staff as any).last_name].filter(Boolean).join(" ")
    : profile?.full_name || "Unknown";

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/staff")}>
        <ArrowLeft className="mr-1 h-4 w-4" />Back to Staff
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{displayName}</CardTitle>
              <p className="text-muted-foreground">{staff.position || "No position"} · {staff.employment_type?.replace("_", " ") || "Casual"}</p>
            </div>
            <div className="flex items-center gap-4">
              {isSupervisionOverdue && (
                <div className="flex items-center gap-1 text-destructive text-xs">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Supervision Overdue</span>
                </div>
              )}
              <div className="text-center">
                <div className={`text-2xl font-bold ${scoreColor}`}>{score}%</div>
                <p className="text-xs text-muted-foreground">Compliance</p>
              </div>
              <Badge variant={staff.is_active ? "default" : "secondary"}>
                {staff.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div><span className="text-muted-foreground">Email:</span> {profile?.email || "—"}</div>
            <div><span className="text-muted-foreground">Phone:</span> {(staff as any).phone || profile?.phone || "—"}</div>
            <div><span className="text-muted-foreground">Start Date:</span> {staff.start_date || "—"}</div>
          </div>
          <div className="mt-3">
            <Progress value={score} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="compliance">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="supervisions" className="relative">
            Supervisions
            {isSupervisionOverdue && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive" />}
          </TabsTrigger>
          <TabsTrigger value="competencies">Competencies</TabsTrigger>
          <TabsTrigger value="acknowledgements">Acknowledgements</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader><CardTitle>Linked SIL Houses</CardTitle></CardHeader>
            <CardContent>
              {linkedHouses.length === 0 ? (
                <p className="text-muted-foreground text-sm">Not assigned to any SIL houses.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {linkedHouses.map((h, i) => (
                    <Badge key={i} variant="outline">{(h.sil_houses as any)?.name}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          {staff.notes && (
            <Card className="mt-4">
              <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
              <CardContent><p className="text-sm">{staff.notes}</p></CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="compliance"><StaffComplianceTab staffId={id!} /></TabsContent>
        <TabsContent value="training"><StaffTrainingTab staffId={id!} /></TabsContent>
        <TabsContent value="supervisions">
          <StaffSupervisionsTab
            staffId={id!}
            staffStartDate={staff.start_date}
            supervisionFrequencyMonths={supervisionFrequency}
          />
        </TabsContent>
        <TabsContent value="competencies"><StaffCompetenciesTab staffId={id!} /></TabsContent>
        <TabsContent value="acknowledgements"><StaffAcknowledgementsTab staffId={id!} /></TabsContent>
        <TabsContent value="documents"><StaffDocumentsTab staffId={id!} /></TabsContent>
      </Tabs>
    </div>
  );
}

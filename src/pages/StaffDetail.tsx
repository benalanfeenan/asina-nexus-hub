import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { StaffTrainingTab } from "@/components/staff/StaffTrainingTab";
import { StaffComplianceTab } from "@/components/staff/StaffComplianceTab";
import { StaffSupervisionsTab } from "@/components/staff/StaffSupervisionsTab";
import { StaffCompetenciesTab } from "@/components/staff/StaffCompetenciesTab";
import { StaffAcknowledgementsTab } from "@/components/staff/StaffAcknowledgementsTab";
import { StaffDocumentsTab } from "@/components/staff/StaffDocumentsTab";

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

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/staff")}>
        <ArrowLeft className="mr-1 h-4 w-4" />Back to Staff
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{profile?.full_name || "Unknown"}</CardTitle>
              <p className="text-muted-foreground">{staff.position || "No position"} · {staff.employment_type?.replace("_", " ") || "Casual"}</p>
            </div>
            <Badge variant={staff.is_active ? "default" : "secondary"}>
              {staff.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div><span className="text-muted-foreground">Email:</span> {profile?.email || "—"}</div>
            <div><span className="text-muted-foreground">Phone:</span> {profile?.phone || "—"}</div>
            <div><span className="text-muted-foreground">Start Date:</span> {staff.start_date || "—"}</div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="training">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="supervisions">Supervisions</TabsTrigger>
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

        <TabsContent value="training"><StaffTrainingTab staffId={id!} /></TabsContent>
        <TabsContent value="compliance"><StaffComplianceTab staffId={id!} /></TabsContent>
        <TabsContent value="supervisions"><StaffSupervisionsTab staffId={id!} /></TabsContent>
        <TabsContent value="competencies"><StaffCompetenciesTab staffId={id!} /></TabsContent>
        <TabsContent value="acknowledgements"><StaffAcknowledgementsTab staffId={id!} /></TabsContent>
        <TabsContent value="documents"><StaffDocumentsTab staffId={id!} /></TabsContent>
      </Tabs>
    </div>
  );
}

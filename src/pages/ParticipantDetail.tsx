import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, AlertTriangle, FileText, UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import { AddParticipantDialog } from "@/components/participants/AddParticipantDialog";
import { ParticipantOverviewTab } from "@/components/participants/ParticipantOverviewTab";
import { ParticipantContactsTab } from "@/components/participants/ParticipantContactsTab";
import { ParticipantGoalsTab } from "@/components/participants/ParticipantGoalsTab";
import { ParticipantRoutinesTab } from "@/components/participants/ParticipantRoutinesTab";
import { ParticipantSupportNeedsTab } from "@/components/participants/ParticipantSupportNeedsTab";
import { ParticipantMedicationsTab } from "@/components/participants/ParticipantMedicationsTab";
import { ParticipantMARTab } from "@/components/participants/ParticipantMARTab";
import { ParticipantABCDataTab } from "@/components/participants/ParticipantABCDataTab";
import { ParticipantDocumentsTab } from "@/components/participants/ParticipantDocumentsTab";
import { ParticipantComplianceTab } from "@/components/participants/ParticipantComplianceTab";

export default function ParticipantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();
  const canEdit = role === "admin" || role === "house_manager";
  const [showEdit, setShowEdit] = useState(false);

  const { data: participant, isLoading } = useQuery({
    queryKey: ["participant", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("participants").select("*, sil_houses(name)").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: silHouses = [] } = useQuery({
    queryKey: ["sil-houses-list"],
    queryFn: async () => {
      const { data } = await supabase.from("sil_houses").select("id, name").eq("is_active", true).order("name");
      return data || [];
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  if (!participant) {
    return <div className="text-center py-12"><p className="text-muted-foreground">Participant not found.</p><Button variant="outline" className="mt-4" onClick={() => navigate("/participants")}>Back to Participants</Button></div>;
  }

  const alerts = (participant.alerts && typeof participant.alerts === "object" && !Array.isArray(participant.alerts)) ? participant.alerts as Record<string, boolean> : {};

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/participants")} className="gap-1"><ArrowLeft className="h-4 w-4" />Back to Participants</Button>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-2xl">{participant.first_name} {participant.last_name}</CardTitle>
            <div className="flex flex-wrap gap-2 mt-2 text-sm text-muted-foreground">
              {participant.ndis_number && <span>NDIS: {participant.ndis_number}</span>}
              {participant.date_of_birth && <span>• DOB: {participant.date_of_birth}</span>}
              {(participant.sil_houses as any)?.name && <span>• {(participant.sil_houses as any).name}</span>}
            </div>
            <div className="flex gap-2 mt-2">
              <Badge variant={participant.is_active ? "default" : "secondary"}>{participant.is_active ? "Active" : "Inactive"}</Badge>
              {alerts.allergies && <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Allergies</Badge>}
              {alerts.bsp && <Badge className="gap-1"><FileText className="h-3 w-3" />BSP</Badge>}
              {alerts.mealtime_plan && <Badge variant="outline" className="gap-1"><UtensilsCrossed className="h-3 w-3" />Mealtime Plan</Badge>}
            </div>
          </div>
          {canEdit && <Button variant="outline" onClick={() => setShowEdit(true)}>Edit</Button>}
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="routines">Daily Routines</TabsTrigger>
          <TabsTrigger value="support">Support Needs</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="mar">MAR</TabsTrigger>
          <TabsTrigger value="abc">ABC Data</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ParticipantOverviewTab participant={participant} />
        </TabsContent>

        <TabsContent value="compliance"><ParticipantComplianceTab participantId={id!} canEdit={canEdit} alerts={alerts} /></TabsContent>
        <TabsContent value="contacts"><ParticipantContactsTab participantId={id!} canEdit={canEdit} /></TabsContent>
        <TabsContent value="goals"><ParticipantGoalsTab participantId={id!} canEdit={canEdit} /></TabsContent>
        <TabsContent value="routines"><ParticipantRoutinesTab participantId={id!} canEdit={canEdit} /></TabsContent>
        <TabsContent value="support"><ParticipantSupportNeedsTab participantId={id!} canEdit={canEdit} /></TabsContent>
        <TabsContent value="medications"><ParticipantMedicationsTab participantId={id!} canEdit={canEdit} /></TabsContent>
        <TabsContent value="mar"><ParticipantMARTab participantId={id!} /></TabsContent>
        <TabsContent value="abc"><ParticipantABCDataTab participantId={id!} /></TabsContent>
        <TabsContent value="documents"><ParticipantDocumentsTab participantId={id!} /></TabsContent>
      </Tabs>

      <AddParticipantDialog open={showEdit} onOpenChange={setShowEdit} silHouses={silHouses} editParticipant={participant} />
    </div>
  );
}

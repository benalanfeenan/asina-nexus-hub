import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Home } from "lucide-react";
import { SILHouseParticipantsTab } from "@/components/sil-houses/SILHouseParticipantsTab";
import { SILHouseStaffTab } from "@/components/sil-houses/SILHouseStaffTab";
import { SILHouseMaintenanceTab } from "@/components/sil-houses/SILHouseMaintenanceTab";

export default function SILHouseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: house, isLoading } = useQuery({
    queryKey: ["sil-house", id],
    queryFn: async () => {
      const { data } = await supabase.from("sil_houses").select("*").eq("id", id!).maybeSingle();
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) return <div className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  if (!house) return <div className="py-12 text-center text-muted-foreground">SIL house not found.</div>;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/sil-houses")}>
        <ArrowLeft className="mr-1 h-4 w-4" />Back to SIL Houses
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Home className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{house.name}</CardTitle>
                <p className="text-muted-foreground">{house.address || "No address"}</p>
              </div>
            </div>
            <Badge variant={house.is_active ? "default" : "secondary"}>{house.is_active ? "Active" : "Inactive"}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div><span className="text-muted-foreground">Capacity:</span> {house.capacity || 0}</div>
            <div><span className="text-muted-foreground">Created:</span> {new Date(house.created_at).toLocaleDateString()}</div>
            {house.notes && <div className="sm:col-span-3"><span className="text-muted-foreground">Notes:</span> {house.notes}</div>}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="participants">
        <TabsList>
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>
        <TabsContent value="participants"><SILHouseParticipantsTab houseId={id!} /></TabsContent>
        <TabsContent value="staff"><SILHouseStaffTab houseId={id!} /></TabsContent>
        <TabsContent value="maintenance"><SILHouseMaintenanceTab houseId={id!} /></TabsContent>
      </Tabs>
    </div>
  );
}

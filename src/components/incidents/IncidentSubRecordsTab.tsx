import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { format } from "date-fns";

interface Props {
  incidentId: string;
}

export function IncidentSubRecordsTab({ incidentId }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAddFollowUp, setShowAddFollowUp] = useState(false);
  const [showAddWitness, setShowAddWitness] = useState(false);
  const [showAddDebrief, setShowAddDebrief] = useState(false);

  // Follow-up form
  const [fuContent, setFuContent] = useState("");
  const [fuSubmitted, setFuSubmitted] = useState(false);

  // Witness form
  const [wName, setWName] = useState("");
  const [wStatement, setWStatement] = useState("");
  const [wSigned, setWSigned] = useState(false);

  // Debrief form
  const [dAttendees, setDAttendees] = useState("");
  const [dLessons, setDLessons] = useState("");
  const [dActions, setDActions] = useState("");

  const { data: followUps = [] } = useQuery({
    queryKey: ["incident-follow-ups", incidentId],
    queryFn: async () => {
      const { data } = await supabase.from("incident_follow_ups").select("*").eq("incident_id", incidentId).order("follow_up_date", { ascending: false });
      return data || [];
    },
  });

  const { data: witnesses = [] } = useQuery({
    queryKey: ["incident-witnesses", incidentId],
    queryFn: async () => {
      const { data } = await supabase.from("incident_witness_statements").select("*").eq("incident_id", incidentId).order("date", { ascending: false });
      return data || [];
    },
  });

  const { data: debriefs = [] } = useQuery({
    queryKey: ["incident-debriefs", incidentId],
    queryFn: async () => {
      const { data } = await supabase.from("incident_debriefs").select("*").eq("incident_id", incidentId).order("date", { ascending: false });
      return data || [];
    },
  });

  const addFollowUp = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("incident_follow_ups").insert({
        incident_id: incidentId,
        content: fuContent,
        submitted_to_commission: fuSubmitted,
        submitted_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident-follow-ups", incidentId] });
      setShowAddFollowUp(false);
      setFuContent(""); setFuSubmitted(false);
      toast({ title: "Follow-up added" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const addWitness = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("incident_witness_statements").insert({
        incident_id: incidentId,
        witness_name: wName,
        statement: wStatement,
        signed: wSigned,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident-witnesses", incidentId] });
      setShowAddWitness(false);
      setWName(""); setWStatement(""); setWSigned(false);
      toast({ title: "Witness statement added" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const addDebrief = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("incident_debriefs").insert({
        incident_id: incidentId,
        attendees: dAttendees || null,
        lessons_identified: dLessons || null,
        actions: dActions || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident-debriefs", incidentId] });
      setShowAddDebrief(false);
      setDAttendees(""); setDLessons(""); setDActions("");
      toast({ title: "Debrief recorded" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <Tabs defaultValue="follow-ups">
        <TabsList className="w-full">
          <TabsTrigger value="follow-ups">Follow-Ups ({followUps.length})</TabsTrigger>
          <TabsTrigger value="witnesses">Witnesses ({witnesses.length})</TabsTrigger>
          <TabsTrigger value="debriefs">Debriefs ({debriefs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="follow-ups" className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowAddFollowUp(true)}><Plus className="mr-1 h-3 w-3" />Add Follow-Up</Button>
          </div>
          {followUps.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No follow-ups recorded</p> : followUps.map((fu: any) => (
            <Card key={fu.id}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium">{format(new Date(fu.follow_up_date), "dd/MM/yyyy")}</span>
                  {fu.submitted_to_commission && <Badge variant="default">Submitted to Commission</Badge>}
                </div>
                <p className="text-sm">{fu.content}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="witnesses" className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowAddWitness(true)}><Plus className="mr-1 h-3 w-3" />Add Statement</Button>
          </div>
          {witnesses.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No witness statements</p> : witnesses.map((w: any) => (
            <Card key={w.id}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium">{w.witness_name}</span>
                  <div className="flex gap-2">
                    <span className="text-xs text-muted-foreground">{format(new Date(w.date), "dd/MM/yyyy")}</span>
                    {w.signed && <Badge variant="outline">Signed</Badge>}
                  </div>
                </div>
                <p className="text-sm">{w.statement}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="debriefs" className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowAddDebrief(true)}><Plus className="mr-1 h-3 w-3" />Add Debrief</Button>
          </div>
          {debriefs.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No debriefs recorded</p> : debriefs.map((d: any) => (
            <Card key={d.id}>
              <CardContent className="pt-4">
                <p className="text-sm"><strong>Attendees:</strong> {d.attendees || "—"}</p>
                <p className="text-sm mt-1"><strong>Lessons:</strong> {d.lessons_identified || "—"}</p>
                <p className="text-sm mt-1"><strong>Actions:</strong> {d.actions || "—"}</p>
                <span className="text-xs text-muted-foreground">{format(new Date(d.date), "dd/MM/yyyy")}</span>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Follow-Up Dialog */}
      <Dialog open={showAddFollowUp} onOpenChange={setShowAddFollowUp}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Follow-Up Report</DialogTitle><DialogDescription>5-day follow-up for reportable incidents</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Content</Label><Textarea value={fuContent} onChange={(e) => setFuContent(e.target.value)} placeholder="Follow-up details…" className="min-h-[120px]" /></div>
            <div className="flex items-center gap-2">
              <Checkbox checked={fuSubmitted} onCheckedChange={(v) => setFuSubmitted(!!v)} />
              <Label>Submitted to NDIS Quality & Safeguards Commission</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddFollowUp(false)}>Cancel</Button>
            <Button onClick={() => addFollowUp.mutate()} disabled={!fuContent.trim()}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Witness Dialog */}
      <Dialog open={showAddWitness} onOpenChange={setShowAddWitness}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Witness Statement</DialogTitle><DialogDescription>Record a witness statement for this incident</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Witness Name</Label><Input value={wName} onChange={(e) => setWName(e.target.value)} /></div>
            <div className="grid gap-2"><Label>Statement</Label><Textarea value={wStatement} onChange={(e) => setWStatement(e.target.value)} className="min-h-[120px]" /></div>
            <div className="flex items-center gap-2">
              <Checkbox checked={wSigned} onCheckedChange={(v) => setWSigned(!!v)} />
              <Label>Statement signed by witness</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddWitness(false)}>Cancel</Button>
            <Button onClick={() => addWitness.mutate()} disabled={!wName || !wStatement}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Debrief Dialog */}
      <Dialog open={showAddDebrief} onOpenChange={setShowAddDebrief}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Post-Incident Debrief</DialogTitle><DialogDescription>Document lessons and actions from the debrief</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Attendees</Label><Input value={dAttendees} onChange={(e) => setDAttendees(e.target.value)} placeholder="Names of attendees" /></div>
            <div className="grid gap-2"><Label>Lessons Identified</Label><Textarea value={dLessons} onChange={(e) => setDLessons(e.target.value)} /></div>
            <div className="grid gap-2"><Label>Actions</Label><Textarea value={dActions} onChange={(e) => setDActions(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDebrief(false)}>Cancel</Button>
            <Button onClick={() => addDebrief.mutate()}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

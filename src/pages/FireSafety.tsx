import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Plus, Flame, Shield } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { format } from "date-fns";

export default function FireSafety() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAddDrill, setShowAddDrill] = useState(false);
  const [showAddTest, setShowAddTest] = useState(false);

  // Drill form
  const [drillHouse, setDrillHouse] = useState("");
  const [drillParticipants, setDrillParticipants] = useState("");
  const [drillStaff, setDrillStaff] = useState("");
  const [drillEvacTime, setDrillEvacTime] = useState("");
  const [drillIssues, setDrillIssues] = useState("");
  const [drillActions, setDrillActions] = useState("");

  // Test form
  const [testHouse, setTestHouse] = useState("");
  const [testEquipment, setTestEquipment] = useState("smoke_alarm");
  const [testResult, setTestResult] = useState("pass");
  const [testActions, setTestActions] = useState("");

  const { data: houses = [] } = useQuery({
    queryKey: ["sil-houses-list"],
    queryFn: async () => {
      const { data } = await supabase.from("sil_houses").select("id, name").eq("is_active", true).order("name");
      return data || [];
    },
  });

  const { data: drills = [] } = useQuery({
    queryKey: ["fire-drills"],
    queryFn: async () => {
      const { data } = await supabase.from("fire_drills").select("*, sil_houses(name)").order("date", { ascending: false });
      return data || [];
    },
  });

  const { data: tests = [] } = useQuery({
    queryKey: ["fire-equipment-tests"],
    queryFn: async () => {
      const { data } = await supabase.from("fire_equipment_tests").select("*, sil_houses(name)").order("date", { ascending: false });
      return data || [];
    },
  });

  const addDrill = useMutation({
    mutationFn: async () => {
      const nextDue = new Date();
      nextDue.setMonth(nextDue.getMonth() + 6);
      const { error } = await supabase.from("fire_drills").insert({
        sil_house_id: drillHouse,
        participants_count: drillParticipants ? parseInt(drillParticipants) : null,
        staff_present: drillStaff || null,
        evacuation_time_seconds: drillEvacTime ? parseInt(drillEvacTime) : null,
        issues: drillIssues || null,
        actions: drillActions || null,
        next_due: nextDue.toISOString().slice(0, 10),
        conducted_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fire-drills"] });
      setShowAddDrill(false);
      setDrillHouse(""); setDrillParticipants(""); setDrillStaff(""); setDrillEvacTime(""); setDrillIssues(""); setDrillActions("");
      toast({ title: "Fire drill recorded" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const addTest = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("fire_equipment_tests").insert({
        sil_house_id: testHouse,
        equipment_type: testEquipment,
        result: testResult,
        actions: testActions || null,
        tested_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fire-equipment-tests"] });
      setShowAddTest(false);
      setTestHouse(""); setTestEquipment("smoke_alarm"); setTestResult("pass"); setTestActions("");
      toast({ title: "Equipment test recorded" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Fire Safety" />

      <Tabs defaultValue="drills">
        <TabsList>
          <TabsTrigger value="drills" className="gap-1"><Flame className="h-4 w-4" />Evacuation Drills</TabsTrigger>
          <TabsTrigger value="tests" className="gap-1"><Shield className="h-4 w-4" />Equipment Tests</TabsTrigger>
        </TabsList>

        <TabsContent value="drills" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="accent" onClick={() => setShowAddDrill(true)}><Plus className="mr-1 h-4 w-4" />Record Drill</Button>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>House</TableHead>
                  <TableHead>Participants</TableHead>
                  <TableHead>Evac Time</TableHead>
                  <TableHead>Issues</TableHead>
                  <TableHead>Next Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drills.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No drills recorded</TableCell></TableRow>
                ) : drills.map((d: any) => (
                  <TableRow key={d.id}>
                    <TableCell>{format(new Date(d.date), "dd/MM/yyyy")}</TableCell>
                    <TableCell>{(d.sil_houses as any)?.name || "—"}</TableCell>
                    <TableCell>{d.participants_count ?? "—"}</TableCell>
                    <TableCell>{d.evacuation_time_seconds ? `${d.evacuation_time_seconds}s` : "—"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{d.issues || "None"}</TableCell>
                    <TableCell>
                      {d.next_due && (
                        <Badge variant={new Date(d.next_due) < new Date() ? "destructive" : "outline"}>
                          {format(new Date(d.next_due), "dd/MM/yyyy")}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="accent" onClick={() => setShowAddTest(true)}><Plus className="mr-1 h-4 w-4" />Record Test</Button>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>House</TableHead>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tests.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No tests recorded</TableCell></TableRow>
                ) : tests.map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell>{format(new Date(t.date), "dd/MM/yyyy")}</TableCell>
                    <TableCell>{(t.sil_houses as any)?.name || "—"}</TableCell>
                    <TableCell className="capitalize">{t.equipment_type.replace(/_/g, " ")}</TableCell>
                    <TableCell>
                      <Badge variant={t.result === "pass" ? "default" : "destructive"}>{t.result}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{t.actions || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Drill Dialog */}
      <Dialog open={showAddDrill} onOpenChange={setShowAddDrill}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Fire Drill</DialogTitle><DialogDescription>Log a fire evacuation drill</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>SIL House</Label>
              <Select value={drillHouse} onValueChange={setDrillHouse}>
                <SelectTrigger><SelectValue placeholder="Select house" /></SelectTrigger>
                <SelectContent>{houses.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Participants Count</Label><Input type="number" value={drillParticipants} onChange={(e) => setDrillParticipants(e.target.value)} /></div>
              <div className="grid gap-2"><Label>Evacuation Time (seconds)</Label><Input type="number" value={drillEvacTime} onChange={(e) => setDrillEvacTime(e.target.value)} /></div>
            </div>
            <div className="grid gap-2"><Label>Staff Present</Label><Input value={drillStaff} onChange={(e) => setDrillStaff(e.target.value)} placeholder="Names of staff present" /></div>
            <div className="grid gap-2"><Label>Issues Identified</Label><Textarea value={drillIssues} onChange={(e) => setDrillIssues(e.target.value)} /></div>
            <div className="grid gap-2"><Label>Actions Required</Label><Textarea value={drillActions} onChange={(e) => setDrillActions(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDrill(false)}>Cancel</Button>
            <Button onClick={() => addDrill.mutate()} disabled={!drillHouse}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Test Dialog */}
      <Dialog open={showAddTest} onOpenChange={setShowAddTest}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Equipment Test</DialogTitle><DialogDescription>Log a fire equipment or smoke alarm test</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>SIL House</Label>
              <Select value={testHouse} onValueChange={setTestHouse}>
                <SelectTrigger><SelectValue placeholder="Select house" /></SelectTrigger>
                <SelectContent>{houses.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Equipment Type</Label>
                <Select value={testEquipment} onValueChange={setTestEquipment}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="smoke_alarm">Smoke Alarm</SelectItem>
                    <SelectItem value="fire_extinguisher">Fire Extinguisher</SelectItem>
                    <SelectItem value="fire_blanket">Fire Blanket</SelectItem>
                    <SelectItem value="emergency_lighting">Emergency Lighting</SelectItem>
                    <SelectItem value="exit_signs">Exit Signs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Result</Label>
                <Select value={testResult} onValueChange={setTestResult}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pass">Pass</SelectItem>
                    <SelectItem value="fail">Fail</SelectItem>
                    <SelectItem value="needs_attention">Needs Attention</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2"><Label>Actions Required</Label><Textarea value={testActions} onChange={(e) => setTestActions(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTest(false)}>Cancel</Button>
            <Button onClick={() => addTest.mutate()} disabled={!testHouse}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

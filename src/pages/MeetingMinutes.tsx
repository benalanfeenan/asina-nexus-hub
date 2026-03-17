import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function MeetingMinutes() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ meeting_type: "management", date: new Date().toISOString().slice(0, 10), attendees: "", agenda: "", minutes: "", actions: "", sil_house_id: "" });

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["meeting-minutes", filter],
    queryFn: async () => {
      let q = supabase.from("meeting_minutes").select("*, sil_houses(name)").order("date", { ascending: false });
      if (filter !== "all") q = q.eq("meeting_type", filter);
      const { data } = await q;
      return data || [];
    },
  });

  const { data: houses = [] } = useQuery({
    queryKey: ["sil-houses-list"],
    queryFn: async () => {
      const { data } = await supabase.from("sil_houses").select("id, name").eq("is_active", true).order("name");
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("meeting_minutes").insert({
        ...form, sil_house_id: form.sil_house_id || null, created_by: user?.id,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["meeting-minutes"] }); setOpen(false); toast.success("Meeting minutes added"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Meeting Minutes" subtitle="Management and house meeting records">
        <div className="flex gap-2">
          <Select value={filter} onValueChange={setFilter}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem><SelectItem value="management">Management</SelectItem><SelectItem value="house_meeting">House Meeting</SelectItem><SelectItem value="staff_meeting">Staff Meeting</SelectItem></SelectContent></Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Add Minutes</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Add Meeting Minutes</DialogTitle></DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Type</Label><Select value={form.meeting_type} onValueChange={v => setForm(f => ({ ...f, meeting_type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="management">Management</SelectItem><SelectItem value="house_meeting">House Meeting</SelectItem><SelectItem value="staff_meeting">Staff Meeting</SelectItem></SelectContent></Select></div>
                  <div><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
                </div>
                {form.meeting_type === "house_meeting" && <div><Label>SIL House</Label><Select onValueChange={v => setForm(f => ({ ...f, sil_house_id: v }))}><SelectTrigger><SelectValue placeholder="Select house" /></SelectTrigger><SelectContent>{houses.map((h: any) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent></Select></div>}
                <div><Label>Attendees</Label><Input value={form.attendees} onChange={e => setForm(f => ({ ...f, attendees: e.target.value }))} placeholder="Comma-separated names" /></div>
                <div><Label>Agenda</Label><Textarea value={form.agenda} onChange={e => setForm(f => ({ ...f, agenda: e.target.value }))} /></div>
                <div><Label>Minutes</Label><Textarea value={form.minutes} onChange={e => setForm(f => ({ ...f, minutes: e.target.value }))} rows={4} /></div>
                <div><Label>Actions</Label><Textarea value={form.actions} onChange={e => setForm(f => ({ ...f, actions: e.target.value }))} /></div>
                <Button onClick={() => addMutation.mutate()} disabled={!form.minutes}>Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>
      <Card>
        <CardContent className="pt-6">
          {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : records.length === 0 ? <p className="text-sm text-muted-foreground">No meeting minutes recorded.</p> : (
            <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>House</TableHead><TableHead>Attendees</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>{records.map((r: any) => (
                <TableRow key={r.id}><TableCell>{format(new Date(r.date), "dd/MM/yyyy")}</TableCell><TableCell><Badge variant="outline">{r.meeting_type.replace("_", " ")}</Badge></TableCell><TableCell>{(r.sil_houses as any)?.name || "—"}</TableCell><TableCell className="max-w-xs truncate">{r.attendees || "—"}</TableCell><TableCell className="max-w-xs truncate">{r.actions || "—"}</TableCell></TableRow>
              ))}</TableBody></Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

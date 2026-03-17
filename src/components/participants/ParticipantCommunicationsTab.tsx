import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Phone, Mail, Users, FileText, ExternalLink, AlertTriangle } from "lucide-react";
import { format, isPast } from "date-fns";
import { toast } from "sonner";

const COMM_TYPES = [
  { value: "phone_call", label: "Phone Call", icon: Phone },
  { value: "email", label: "Email", icon: Mail },
  { value: "meeting", label: "Meeting", icon: Users },
  { value: "letter", label: "Letter", icon: FileText },
  { value: "other", label: "Other", icon: FileText },
];

const CONTACT_ROLES = [
  "Support Coordinator",
  "Plan Manager",
  "Family Member",
  "Guardian",
  "Allied Health",
  "NDIA",
  "Specialist",
  "Advocate",
  "Other",
];

interface Props {
  participantId: string;
  canEdit: boolean;
}

export function ParticipantCommunicationsTab({ participantId, canEdit }: Props) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    type: "phone_call",
    direction: "outbound",
    contact_name: "",
    contact_role: "",
    subject: "",
    summary: "",
    follow_up_required: false,
    follow_up_date: "",
    date: new Date().toISOString().slice(0, 16),
  });

  const { data: comms = [], isLoading } = useQuery({
    queryKey: ["participant-communications", participantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("participant_communications")
        .select("*")
        .eq("participant_id", participantId)
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      let document_url: string | null = null;
      const file = fileRef.current?.files?.[0];
      if (file) {
        const path = `communications/${participantId}/${Date.now()}_${file.name}`;
        const { error: uploadErr } = await supabase.storage.from("documents").upload(path, file);
        if (uploadErr) throw uploadErr;
        document_url = supabase.storage.from("documents").getPublicUrl(path).data.publicUrl;
      }

      const { error } = await supabase.from("participant_communications").insert({
        participant_id: participantId,
        date: new Date(form.date).toISOString(),
        type: form.type,
        direction: form.direction,
        contact_name: form.contact_name || null,
        contact_role: form.contact_role || null,
        subject: form.subject,
        summary: form.summary,
        follow_up_required: form.follow_up_required,
        follow_up_date: form.follow_up_date || null,
        document_url,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["participant-communications", participantId] });
      toast.success("Communication recorded");
      setShowAdd(false);
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleFollowUp = useMutation({
    mutationFn: async (id: string) => {
      const comm = comms.find((c) => c.id === id);
      if (!comm) return;
      const { error } = await supabase
        .from("participant_communications")
        .update({ follow_up_completed: !comm.follow_up_completed })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["participant-communications", participantId] }),
    onError: (e: any) => toast.error(e.message),
  });

  function resetForm() {
    setForm({
      type: "phone_call", direction: "outbound", contact_name: "", contact_role: "",
      subject: "", summary: "", follow_up_required: false, follow_up_date: "",
      date: new Date().toISOString().slice(0, 16),
    });
    if (fileRef.current) fileRef.current.value = "";
  }

  const filtered = filterType === "all" ? comms : comms.filter((c) => c.type === filterType);
  const typeIcon = (t: string) => COMM_TYPES.find((ct) => ct.value === t)?.icon || FileText;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Communication Log</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {COMM_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canEdit && (
            <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1">
              <Plus className="h-4 w-4" />Add
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No communications recorded yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Follow-up</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => {
                const Icon = typeIcon(c.type);
                const overdueFollowUp = c.follow_up_required && !c.follow_up_completed && c.follow_up_date && isPast(new Date(c.follow_up_date));
                return (
                  <TableRow key={c.id}>
                    <TableCell className="whitespace-nowrap">{format(new Date(c.date), "dd MMM yyyy")}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1 capitalize">
                        <Icon className="h-3 w-3" />{c.type.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">{c.direction}</TableCell>
                    <TableCell>
                      <div>{c.contact_name || "—"}</div>
                      {c.contact_role && <div className="text-xs text-muted-foreground">{c.contact_role}</div>}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate" title={c.subject}>{c.subject}</div>
                      <div className="text-xs text-muted-foreground max-w-[200px] truncate">{c.summary}</div>
                    </TableCell>
                    <TableCell>
                      {c.follow_up_required ? (
                        <div className="flex items-center gap-1">
                          {canEdit ? (
                            <Checkbox
                              checked={c.follow_up_completed}
                              onCheckedChange={() => toggleFollowUp.mutate(c.id)}
                            />
                          ) : (
                            <Badge variant={c.follow_up_completed ? "secondary" : "default"}>
                              {c.follow_up_completed ? "Done" : "Pending"}
                            </Badge>
                          )}
                          {overdueFollowUp && (
                            <Badge variant="destructive" className="gap-1 text-xs">
                              <AlertTriangle className="h-3 w-3" />Overdue
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {c.document_url && (
                        <a href={c.document_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 text-primary" />
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Record Communication</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date & Time</Label>
                <Input type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COMM_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Direction</Label>
                <Select value={form.direction} onValueChange={(v) => setForm({ ...form, direction: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inbound">Inbound</SelectItem>
                    <SelectItem value="outbound">Outbound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Contact Role</Label>
                <Select value={form.contact_role} onValueChange={(v) => setForm({ ...form, contact_role: v })}>
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    {CONTACT_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Contact Name</Label>
              <Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} placeholder="e.g. Jane Smith" />
            </div>
            <div>
              <Label>Subject *</Label>
              <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Brief topic" />
            </div>
            <div>
              <Label>Summary *</Label>
              <Textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} rows={3} placeholder="Key points discussed, decisions made, outcomes..." />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="follow_up"
                checked={form.follow_up_required}
                onCheckedChange={(v) => setForm({ ...form, follow_up_required: !!v })}
              />
              <Label htmlFor="follow_up">Follow-up required</Label>
            </div>
            {form.follow_up_required && (
              <div>
                <Label>Follow-up Date</Label>
                <Input type="date" value={form.follow_up_date} onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })} />
              </div>
            )}
            <div>
              <Label>Attach Document</Label>
              <Input type="file" ref={fileRef} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button
              onClick={() => addMutation.mutate()}
              disabled={!form.subject || !form.summary || addMutation.isPending}
            >
              {addMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

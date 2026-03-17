import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, ShieldCheck } from "lucide-react";

const CONCERN_TYPES = [
  { value: "abuse", label: "Abuse" },
  { value: "neglect", label: "Neglect" },
  { value: "exploitation", label: "Exploitation" },
  { value: "other", label: "Other" },
];

export default function Safeguarding() {
  const { role, user } = useAuth();
  const canEdit = role === "admin" || role === "house_manager";
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [filter, setFilter] = useState("all");

  const [concernType, setConcernType] = useState("other");
  const [dateId, setDateId] = useState("");
  const [mandatoryReport, setMandatoryReport] = useState(false);
  const [authority, setAuthority] = useState("");
  const [reportDate, setReportDate] = useState("");
  const [outcome, setOutcome] = useState("");
  const [actions, setActions] = useState("");
  const [participantId, setParticipantId] = useState("");

  const { data: concerns = [], isLoading } = useQuery({
    queryKey: ["safeguarding-concerns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("safeguarding_concerns")
        .select("*, participants(first_name, last_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: participants = [] } = useQuery({
    queryKey: ["participants-list"],
    queryFn: async () => {
      const { data } = await supabase.from("participants").select("id, first_name, last_name").eq("is_active", true).order("first_name");
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("safeguarding_concerns").insert({
        concern_type: concernType,
        date_identified: dateId || new Date().toISOString().split("T")[0],
        reported_by: user?.id,
        mandatory_report_made: mandatoryReport,
        authority_reported_to: authority || null,
        report_date: reportDate || null,
        outcome: outcome || null,
        actions_taken: actions || null,
        participant_id: participantId || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["safeguarding-concerns"] });
      toast({ title: "Concern recorded" });
      resetForm();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const resetForm = () => {
    setShowAdd(false);
    setConcernType("other");
    setDateId("");
    setMandatoryReport(false);
    setAuthority("");
    setReportDate("");
    setOutcome("");
    setActions("");
    setParticipantId("");
  };

  const filtered = filter === "all" ? concerns : concerns.filter((c: any) => c.investigation_status === filter);

  const typeColor = (t: string) => {
    if (t === "abuse") return "bg-destructive/15 text-destructive";
    if (t === "neglect") return "bg-amber-500/15 text-amber-700";
    if (t === "exploitation") return "bg-orange-500/15 text-orange-700";
    return "";
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Safeguarding Register" subtitle="Track and manage safeguarding concerns, abuse, neglect, and exploitation reports">
        {canEdit && <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" />Report Concern</Button>}
      </PageHeader>

      <div className="flex gap-2">
        {["all", "open", "investigating", "closed"].map(s => (
          <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" onClick={() => setFilter(s)} className="capitalize">{s}</Button>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <ShieldCheck className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No safeguarding concerns recorded.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ref</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Participant</TableHead>
                  <TableHead>Mandatory Report</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c: any) => (
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => setShowDetail(c)}>
                    <TableCell className="font-mono text-xs">{c.reference_number}</TableCell>
                    <TableCell><Badge variant="outline" className={typeColor(c.concern_type)}>{c.concern_type}</Badge></TableCell>
                    <TableCell>{new Date(c.date_identified).toLocaleDateString()}</TableCell>
                    <TableCell>{c.participants ? `${c.participants.first_name} ${c.participants.last_name}` : "—"}</TableCell>
                    <TableCell>{c.mandatory_report_made ? <Badge className="bg-emerald-500/15 text-emerald-700">Yes</Badge> : <Badge variant="secondary">No</Badge>}</TableCell>
                    <TableCell><Badge variant="outline">{c.investigation_status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Report Safeguarding Concern</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Concern Type</Label>
              <Select value={concernType} onValueChange={setConcernType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CONCERN_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Date Identified</Label><Input type="date" value={dateId} onChange={e => setDateId(e.target.value)} /></div>
            <div><Label>Participant (optional)</Label>
              <Select value={participantId} onValueChange={setParticipantId}>
                <SelectTrigger><SelectValue placeholder="Select participant" /></SelectTrigger>
                <SelectContent>
                  {participants.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={mandatoryReport} onCheckedChange={setMandatoryReport} />
              <Label>Mandatory Report Made</Label>
            </div>
            {mandatoryReport && (
              <>
                <div><Label>Authority Reported To</Label><Input value={authority} onChange={e => setAuthority(e.target.value)} placeholder="e.g. NDIS Commission, Police" /></div>
                <div><Label>Report Date</Label><Input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} /></div>
              </>
            )}
            <div><Label>Actions Taken</Label><Textarea value={actions} onChange={e => setActions(e.target.value)} placeholder="Describe actions taken" /></div>
            <div><Label>Outcome</Label><Textarea value={outcome} onChange={e => setOutcome(e.target.value)} placeholder="Outcome (if known)" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => addMutation.mutate()} disabled={addMutation.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!showDetail} onOpenChange={() => setShowDetail(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Safeguarding Concern</DialogTitle></DialogHeader>
          {showDetail && (
            <div className="space-y-3 text-sm">
              <div><span className="text-muted-foreground">Reference:</span> {showDetail.reference_number}</div>
              <div><span className="text-muted-foreground">Type:</span> <Badge variant="outline" className={typeColor(showDetail.concern_type)}>{showDetail.concern_type}</Badge></div>
              <div><span className="text-muted-foreground">Date:</span> {new Date(showDetail.date_identified).toLocaleDateString()}</div>
              <div><span className="text-muted-foreground">Participant:</span> {showDetail.participants ? `${showDetail.participants.first_name} ${showDetail.participants.last_name}` : "—"}</div>
              <div><span className="text-muted-foreground">Mandatory Report:</span> {showDetail.mandatory_report_made ? "Yes" : "No"}</div>
              {showDetail.authority_reported_to && <div><span className="text-muted-foreground">Authority:</span> {showDetail.authority_reported_to}</div>}
              {showDetail.actions_taken && <div><span className="text-muted-foreground">Actions:</span><p className="mt-1">{showDetail.actions_taken}</p></div>}
              {showDetail.outcome && <div><span className="text-muted-foreground">Outcome:</span><p className="mt-1">{showDetail.outcome}</p></div>}
              <div><span className="text-muted-foreground">Status:</span> <Badge variant="outline">{showDetail.investigation_status}</Badge></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setShowDetail(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

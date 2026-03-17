import { useState, useRef } from "react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, ClipboardList, ExternalLink } from "lucide-react";

const PRACTICE_STANDARDS = [
  "Rights & Responsibilities",
  "Governance & Operational Management",
  "Provision of Supports",
  "Support Provision Environment",
  "Specialist Behaviour Support",
  "High Intensity Daily Personal Activities",
  "Early Childhood Supports",
];

export default function InternalAudits() {
  const { role } = useAuth();
  const canEdit = role === "admin" || role === "house_manager";
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [auditDate, setAuditDate] = useState("");
  const [standard, setStandard] = useState("");
  const [findings, setFindings] = useState("");
  const [nonConf, setNonConf] = useState("");
  const [corrective, setCorrective] = useState("");
  const [status, setStatus] = useState("scheduled");
  const [nextDate, setNextDate] = useState("");

  const { data: audits = [], isLoading } = useQuery({
    queryKey: ["internal-audits"],
    queryFn: async () => {
      const { data, error } = await supabase.from("internal_audits").select("*").order("audit_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      let document_url: string | null = null;
      const file = fileRef.current?.files?.[0];
      if (file) {
        const path = `audits/${Date.now()}_${file.name}`;
        const { error: uploadErr } = await supabase.storage.from("documents").upload(path, file);
        if (uploadErr) throw uploadErr;
        document_url = supabase.storage.from("documents").getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from("internal_audits").insert({
        audit_date: auditDate || new Date().toISOString().split("T")[0],
        practice_standard: standard,
        findings: findings || null,
        non_conformances: nonConf || null,
        corrective_actions: corrective || null,
        status,
        next_audit_date: nextDate || null,
        document_url,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["internal-audits"] });
      toast({ title: "Audit recorded" });
      resetForm();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const resetForm = () => {
    setShowAdd(false);
    setAuditDate("");
    setStandard("");
    setFindings("");
    setNonConf("");
    setCorrective("");
    setStatus("scheduled");
    setNextDate("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const statusColor = (s: string) => {
    if (s === "completed") return "bg-emerald-500/15 text-emerald-700";
    if (s === "in_progress") return "bg-amber-500/15 text-amber-700";
    return "";
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Internal Audits" subtitle="NDIS Practice Standards self-assessment register">
        {canEdit && <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" />Schedule Audit</Button>}
      </PageHeader>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : audits.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No audits recorded yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Practice Standard</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Non-Conformances</TableHead>
                  <TableHead>Next Audit</TableHead>
                  <TableHead>File</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audits.map((a: any) => (
                  <TableRow key={a.id} className="cursor-pointer" onClick={() => setShowDetail(a)}>
                    <TableCell>{new Date(a.audit_date).toLocaleDateString()}</TableCell>
                    <TableCell>{a.practice_standard}</TableCell>
                    <TableCell><Badge variant="outline" className={statusColor(a.status)}>{a.status}</Badge></TableCell>
                    <TableCell className="max-w-[200px] truncate">{a.non_conformances || "—"}</TableCell>
                    <TableCell>{a.next_audit_date ? new Date(a.next_audit_date).toLocaleDateString() : "—"}</TableCell>
                    <TableCell>
                      {a.document_url ? (
                        <a href={a.document_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                          <ExternalLink className="h-4 w-4 text-primary" />
                        </a>
                      ) : "—"}
                    </TableCell>
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
          <DialogHeader><DialogTitle>Schedule / Record Audit</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Audit Date</Label><Input type="date" value={auditDate} onChange={e => setAuditDate(e.target.value)} /></div>
            <div><Label>Practice Standard</Label>
              <Select value={standard} onValueChange={setStandard}>
                <SelectTrigger><SelectValue placeholder="Select standard" /></SelectTrigger>
                <SelectContent>{PRACTICE_STANDARDS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Findings</Label><Textarea value={findings} onChange={e => setFindings(e.target.value)} placeholder="Audit findings" /></div>
            <div><Label>Non-Conformances</Label><Textarea value={nonConf} onChange={e => setNonConf(e.target.value)} placeholder="Issues identified" /></div>
            <div><Label>Corrective Actions</Label><Textarea value={corrective} onChange={e => setCorrective(e.target.value)} placeholder="Actions to address" /></div>
            <div><Label>Next Audit Date</Label><Input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)} /></div>
            <div><Label>Attach Document</Label><Input type="file" ref={fileRef} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !standard}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!showDetail} onOpenChange={() => setShowDetail(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Audit Details</DialogTitle></DialogHeader>
          {showDetail && (
            <div className="space-y-3 text-sm">
              <div><span className="text-muted-foreground">Date:</span> {new Date(showDetail.audit_date).toLocaleDateString()}</div>
              <div><span className="text-muted-foreground">Standard:</span> {showDetail.practice_standard}</div>
              <div><span className="text-muted-foreground">Status:</span> <Badge variant="outline" className={statusColor(showDetail.status)}>{showDetail.status}</Badge></div>
              {showDetail.findings && <div><span className="text-muted-foreground">Findings:</span><p className="mt-1">{showDetail.findings}</p></div>}
              {showDetail.non_conformances && <div><span className="text-muted-foreground">Non-Conformances:</span><p className="mt-1">{showDetail.non_conformances}</p></div>}
              {showDetail.corrective_actions && <div><span className="text-muted-foreground">Corrective Actions:</span><p className="mt-1">{showDetail.corrective_actions}</p></div>}
              {showDetail.next_audit_date && <div><span className="text-muted-foreground">Next Audit:</span> {new Date(showDetail.next_audit_date).toLocaleDateString()}</div>}
              {showDetail.document_url && (
                <div><span className="text-muted-foreground">Document:</span> <a href={showDetail.document_url} target="_blank" rel="noopener noreferrer" className="text-primary inline-flex items-center gap-1">View <ExternalLink className="h-3.5 w-3.5" /></a></div>
              )}
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setShowDetail(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

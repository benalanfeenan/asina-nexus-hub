import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, CheckCircle2, Clock, AlertCircle, ExternalLink } from "lucide-react";

interface Props {
  incidentId: string;
}

const REPORT_TYPES = [
  { value: "24hr_notification", label: "24-Hour Notification" },
  { value: "5day_report", label: "5-Day Report" },
  { value: "final", label: "Final Report" },
];

export function IncidentCommissionReports({ incidentId }: Props) {
  const { user, role } = useAuth();
  const isAdmin = role === "admin";
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [reportType, setReportType] = useState("24hr_notification");
  const [commRef, setCommRef] = useState("");
  const [ackReceived, setAckReceived] = useState(false);
  const [ackDate, setAckDate] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: reports = [] } = useQuery({
    queryKey: ["incident-commission-reports", incidentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incident_commission_reports")
        .select("*")
        .eq("incident_id", incidentId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      let document_url: string | null = null;
      const file = fileRef.current?.files?.[0];
      if (file) {
        const path = `commission-reports/${incidentId}/${Date.now()}_${file.name}`;
        const { error: uploadErr } = await supabase.storage.from("documents").upload(path, file);
        if (uploadErr) throw uploadErr;
        document_url = supabase.storage.from("documents").getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from("incident_commission_reports").insert({
        incident_id: incidentId,
        report_type: reportType,
        submitted_at: new Date().toISOString(),
        submitted_by: user?.id,
        commission_reference: commRef || null,
        acknowledgement_received: ackReceived,
        acknowledgement_date: ackDate || null,
        document_url,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incident-commission-reports", incidentId] });
      toast({ title: "Commission report recorded" });
      setShowAdd(false);
      setReportType("24hr_notification");
      setCommRef("");
      setAckReceived(false);
      setAckDate("");
      if (fileRef.current) fileRef.current.value = "";
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const submitted = new Set(reports.map((r: any) => r.report_type));

  const getStepStatus = (type: string) => {
    const report = reports.find((r: any) => r.report_type === type);
    if (!report) return "pending";
    if ((report as any).acknowledgement_received) return "acknowledged";
    return "submitted";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h5 className="font-medium text-sm">NDIS Commission Reports</h5>
        {isAdmin && <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}><Plus className="h-3 w-3 mr-1" />Log Submission</Button>}
      </div>

      {/* Timeline */}
      <div className="flex items-center gap-2">
        {REPORT_TYPES.map((rt, i) => {
          const status = getStepStatus(rt.value);
          return (
            <div key={rt.value} className="flex items-center gap-2">
              {i > 0 && <div className={`h-0.5 w-8 ${status !== "pending" || getStepStatus(REPORT_TYPES[i - 1].value) !== "pending" ? "bg-primary" : "bg-border"}`} />}
              <div className="flex flex-col items-center gap-1">
                {status === "acknowledged" ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : status === "submitted" ? (
                  <Clock className="h-5 w-5 text-amber-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-muted-foreground" />
                )}
                <span className="text-[10px] text-muted-foreground text-center leading-tight">{rt.label}</span>
                {status !== "pending" && (
                  <Badge variant={status === "acknowledged" ? "default" : "secondary"} className="text-[9px] px-1">
                    {status === "acknowledged" ? "Ack'd" : "Sent"}
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail list */}
      {reports.length > 0 && (
        <div className="space-y-2 text-xs">
          {reports.map((r: any) => (
            <div key={r.id} className="flex items-center justify-between border rounded-md p-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">{REPORT_TYPES.find(t => t.value === r.report_type)?.label}</span>
                <span className="text-muted-foreground">{new Date(r.submitted_at).toLocaleDateString()}</span>
                {r.commission_reference && <span className="text-muted-foreground">Ref: {r.commission_reference}</span>}
                {r.document_url && (
                  <a href={r.document_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                    <ExternalLink className="h-3.5 w-3.5 text-primary" />
                  </a>
                )}
              </div>
              <Badge variant={r.acknowledgement_received ? "default" : "secondary"}>
                {r.acknowledgement_received ? "Acknowledged" : "Awaiting"}
              </Badge>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log Commission Submission</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map(rt => (
                    <SelectItem key={rt.value} value={rt.value} disabled={submitted.has(rt.value)}>{rt.label}{submitted.has(rt.value) ? " (already logged)" : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Commission Reference</Label><Input value={commRef} onChange={e => setCommRef(e.target.value)} placeholder="e.g. CR-2026-001" /></div>
            <div className="flex items-center gap-3">
              <Switch checked={ackReceived} onCheckedChange={setAckReceived} />
              <Label>Acknowledgement Received</Label>
            </div>
            {ackReceived && <div><Label>Acknowledgement Date</Label><Input type="date" value={ackDate} onChange={e => setAckDate(e.target.value)} /></div>}
            <div><Label>Attach Document</Label><Input type="file" ref={fileRef} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => addMutation.mutate()} disabled={addMutation.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

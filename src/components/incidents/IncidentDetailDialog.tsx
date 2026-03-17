import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle } from "lucide-react";
import { IncidentSubRecordsTab } from "./IncidentSubRecordsTab";

interface Props {
  incident: any;
  onClose: () => void;
}

export function IncidentDetailDialog({ incident, onClose }: Props) {
  const { role, user } = useAuth();
  const isAdmin = role === "admin";
  const { toast } = useToast();
  const qc = useQueryClient();

  const [rootCause, setRootCause] = useState(incident?.root_cause || "");
  const [findings, setFindings] = useState(incident?.investigation_findings || "");
  const [corrective, setCorrective] = useState(incident?.corrective_actions || "");

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("incidents").update({
        root_cause: rootCause || null,
        investigation_findings: findings || null,
        corrective_actions: corrective || null,
        status: "investigating",
      }).eq("id", incident.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incidents"] });
      toast({ title: "Investigation updated" });
      onClose();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const closeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("incidents").update({
        status: "closed",
        closed_at: new Date().toISOString(),
        closed_by: user!.id,
        root_cause: rootCause || null,
        investigation_findings: findings || null,
        corrective_actions: corrective || null,
      }).eq("id", incident.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incidents"] });
      toast({ title: "Incident closed" });
      onClose();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (!incident) return null;

  const p = incident.participants as any;
  const h = incident.sil_houses as any;

  return (
    <Dialog open={!!incident} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">{incident.reference_number}</span>
            {incident.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={incident.severity === "critical" ? "bg-destructive/15 text-destructive" : ""}>{incident.severity}</Badge>
            <Badge variant="outline">{incident.status}</Badge>
            {incident.is_reportable && (
              <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Reportable</Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><span className="text-muted-foreground">Participant:</span> {p ? `${p.first_name} ${p.last_name}` : "—"}</div>
            <div><span className="text-muted-foreground">SIL House:</span> {h?.name || "—"}</div>
            <div><span className="text-muted-foreground">Date Occurred:</span> {new Date(incident.date_occurred).toLocaleDateString()}</div>
            <div><span className="text-muted-foreground">Date Reported:</span> {new Date(incident.date_reported).toLocaleDateString()}</div>
          </div>

          <div>
            <span className="text-muted-foreground font-medium">Description:</span>
            <p className="mt-1">{incident.description}</p>
          </div>

          {incident.immediate_actions && (
            <div>
              <span className="text-muted-foreground font-medium">Immediate Actions:</span>
              <p className="mt-1">{incident.immediate_actions}</p>
            </div>
          )}

          {isAdmin && incident.status !== "closed" && (
            <>
              <hr className="border-border" />
              <h4 className="font-medium">Investigation</h4>
              <div><Label>Root Cause</Label><Textarea value={rootCause} onChange={(e) => setRootCause(e.target.value)} placeholder="Identified root cause" /></div>
              <div><Label>Investigation Findings</Label><Textarea value={findings} onChange={(e) => setFindings(e.target.value)} placeholder="Investigation findings" /></div>
              <div><Label>Corrective Actions</Label><Textarea value={corrective} onChange={(e) => setCorrective(e.target.value)} placeholder="Actions to prevent recurrence" /></div>
            </>
          )}

          {incident.status === "closed" && (
            <>
              {incident.root_cause && <div><span className="text-muted-foreground font-medium">Root Cause:</span><p className="mt-1">{incident.root_cause}</p></div>}
              {incident.investigation_findings && <div><span className="text-muted-foreground font-medium">Findings:</span><p className="mt-1">{incident.investigation_findings}</p></div>}
              {incident.corrective_actions && <div><span className="text-muted-foreground font-medium">Corrective Actions:</span><p className="mt-1">{incident.corrective_actions}</p></div>}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          {isAdmin && incident.status !== "closed" && (
            <>
              <Button variant="secondary" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
                Save Investigation
              </Button>
              <Button variant="destructive" onClick={() => closeMutation.mutate()} disabled={closeMutation.isPending}>
                Close Incident
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

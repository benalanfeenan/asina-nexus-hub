import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ExternalLink } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

export function ParticipantDocumentsTab({ participantId }: { participantId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ document_type: "", title: "", expiry_date: "", version: "1.0" });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: records = [] } = useQuery({
    queryKey: ["participant-documents", participantId],
    queryFn: async () => {
      const { data } = await supabase.from("participant_documents").select("*").eq("participant_id", participantId).order("uploaded_date", { ascending: false });
      return data || [];
    },
  });

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    let file_url = null;
    if (file) {
      setUploading(true);
      const path = `participants/${participantId}/${Date.now()}_${file.name}`;
      const { error: ue } = await supabase.storage.from("documents").upload(path, file);
      if (ue) { toast.error(ue.message); setUploading(false); return; }
      const { data: pub } = supabase.storage.from("documents").getPublicUrl(path);
      file_url = pub.publicUrl;
      setUploading(false);
    }
    const { error } = await supabase.from("participant_documents").insert({
      participant_id: participantId, document_type: form.document_type, title: form.title, file_url, expiry_date: form.expiry_date || null, version: form.version,
    } as any);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["participant-documents", participantId] });
    setOpen(false);
    toast.success("Document added");
  };

  const docTypes = [
    { value: "service_agreement", label: "Service Agreement" },
    { value: "consent_form", label: "Consent Form" },
    { value: "support_plan", label: "Support Plan" },
    { value: "bsp", label: "Behaviour Support Plan" },
    { value: "health_care_plan", label: "Health Care Plan" },
    { value: "mealtime_plan", label: "Mealtime Plan" },
    { value: "intake_form", label: "Intake Form" },
    { value: "compatibility_assessment", label: "Compatibility Assessment" },
    { value: "pep", label: "Personal Emergency Plan" },
    { value: "board_lodging_agreement", label: "Board & Lodging Agreement" },
    { value: "about_me", label: "About Me Profile" },
    { value: "other", label: "Other" },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Documents</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Document</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Participant Document</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Document Type</Label><Select value={form.document_type} onValueChange={v => setForm(f => ({ ...f, document_type: v }))}><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent>{docTypes.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Expiry Date</Label><Input type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} /></div>
                <div><Label>Version</Label><Input value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} /></div>
              </div>
              <div><Label>File</Label><Input type="file" ref={fileRef} /></div>
              <Button onClick={handleUpload} disabled={!form.title || !form.document_type || uploading}>{uploading ? "Uploading..." : "Save"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? <p className="text-sm text-muted-foreground">No documents uploaded.</p> : (
          <Table><TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Version</TableHead><TableHead>Uploaded</TableHead><TableHead>Expiry</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>{records.map((r: any) => (
              <TableRow key={r.id}><TableCell>{r.title}</TableCell><TableCell className="capitalize">{r.document_type.replace(/_/g, " ")}</TableCell><TableCell>{r.version}</TableCell><TableCell>{format(new Date(r.uploaded_date), "dd/MM/yyyy")}</TableCell><TableCell>{r.expiry_date ? format(new Date(r.expiry_date), "dd/MM/yyyy") : "—"}</TableCell><TableCell><Badge variant={r.status === "current" ? "default" : "secondary"}>{r.status}</Badge></TableCell><TableCell>{r.file_url && <a href={r.file_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4 text-primary" /></a>}</TableCell></TableRow>
            ))}</TableBody></Table>
        )}
      </CardContent>
    </Card>
  );
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Upload, ExternalLink } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

export function StaffDocumentsTab({ staffId }: { staffId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ document_type: "", title: "", expiry_date: "" });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: records = [] } = useQuery({
    queryKey: ["staff-documents", staffId],
    queryFn: async () => {
      const { data } = await supabase.from("staff_documents").select("*").eq("staff_id", staffId).order("uploaded_date", { ascending: false });
      return data || [];
    },
  });

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    let file_url = null;
    if (file) {
      setUploading(true);
      const path = `staff/${staffId}/${Date.now()}_${file.name}`;
      const { error: ue } = await supabase.storage.from("documents").upload(path, file);
      if (ue) { toast.error(ue.message); setUploading(false); return; }
      const { data: pub } = supabase.storage.from("documents").getPublicUrl(path);
      file_url = pub.publicUrl;
      setUploading(false);
    }
    const { error } = await supabase.from("staff_documents").insert({
      staff_id: staffId, document_type: form.document_type, title: form.title, file_url, expiry_date: form.expiry_date || null,
    } as any);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["staff-documents", staffId] });
    setOpen(false);
    toast.success("Document added");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Documents</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Document</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Staff Document</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Document Type</Label><Select value={form.document_type} onValueChange={v => setForm(f => ({ ...f, document_type: v }))}><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent><SelectItem value="employment_contract">Employment Contract</SelectItem><SelectItem value="position_description">Position Description</SelectItem><SelectItem value="qualification">Qualification</SelectItem><SelectItem value="clearance">Clearance</SelectItem><SelectItem value="certificate">Certificate</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
              <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div><Label>Expiry Date</Label><Input type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} /></div>
              <div><Label>File</Label><Input type="file" ref={fileRef} /></div>
              <Button onClick={handleUpload} disabled={!form.title || !form.document_type || uploading}>{uploading ? "Uploading..." : "Save"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? <p className="text-sm text-muted-foreground">No documents uploaded.</p> : (
          <Table><TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Uploaded</TableHead><TableHead>Expiry</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>{records.map((r: any) => (
              <TableRow key={r.id}><TableCell>{r.title}</TableCell><TableCell className="capitalize">{r.document_type.replace(/_/g, " ")}</TableCell><TableCell>{format(new Date(r.uploaded_date), "dd/MM/yyyy")}</TableCell><TableCell>{r.expiry_date ? format(new Date(r.expiry_date), "dd/MM/yyyy") : "—"}</TableCell><TableCell>{r.file_url && <a href={r.file_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4 text-primary" /></a>}</TableCell></TableRow>
            ))}</TableBody></Table>
        )}
      </CardContent>
    </Card>
  );
}

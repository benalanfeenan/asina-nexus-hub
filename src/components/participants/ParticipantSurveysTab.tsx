import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Star, ExternalLink } from "lucide-react";

interface Props {
  participantId: string;
  canEdit: boolean;
}

const RATING_OPTIONS = ["1", "2", "3", "4", "5"];

function RatingBadge({ value }: { value: number | null }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  const color = value >= 4 ? "bg-emerald-500/15 text-emerald-700" : value >= 3 ? "bg-amber-500/15 text-amber-700" : "bg-destructive/15 text-destructive";
  return <Badge variant="outline" className={`${color} gap-1`}><Star className="h-3 w-3" />{value}</Badge>;
}

export function ParticipantSurveysTab({ participantId, canEdit }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [surveyDate, setSurveyDate] = useState("");
  const [surveyType, setSurveyType] = useState("satisfaction");
  const [overall, setOverall] = useState("");
  const [safe, setSafe] = useState("");
  const [respectful, setRespectful] = useState("");
  const [choice, setChoice] = useState("");
  const [comments, setComments] = useState("");

  const { data: surveys = [], isLoading } = useQuery({
    queryKey: ["participant-surveys", participantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("participant_surveys")
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
        const path = `surveys/${participantId}/${Date.now()}_${file.name}`;
        const { error: uploadErr } = await supabase.storage.from("documents").upload(path, file);
        if (uploadErr) throw uploadErr;
        document_url = supabase.storage.from("documents").getPublicUrl(path).data.publicUrl;
      }
      const responses = {
        overall_rating: overall ? parseInt(overall) : null,
        feel_safe: safe ? parseInt(safe) : null,
        staff_respectful: respectful ? parseInt(respectful) : null,
        choice_and_control: choice ? parseInt(choice) : null,
      };
      const { error } = await supabase.from("participant_surveys").insert({
        participant_id: participantId,
        date: surveyDate || new Date().toISOString().split("T")[0],
        survey_type: surveyType,
        responses,
        actioned_by: user?.id,
        actions_taken: comments || null,
        document_url,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["participant-surveys", participantId] });
      toast({ title: "Survey recorded" });
      resetForm();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const resetForm = () => {
    setShowAdd(false);
    setSurveyDate("");
    setSurveyType("satisfaction");
    setOverall("");
    setSafe("");
    setRespectful("");
    setChoice("");
    setComments("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const getResponses = (r: any) => {
    if (!r || typeof r !== "object") return {};
    return r as Record<string, number | null>;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><Star className="h-5 w-5" />Satisfaction Surveys</CardTitle>
        {canEdit && <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" />Record Survey</Button>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : surveys.length === 0 ? (
          <p className="text-muted-foreground text-sm">No surveys recorded yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Overall</TableHead>
                <TableHead>Feel Safe</TableHead>
                <TableHead>Respectful</TableHead>
                <TableHead>Choice & Control</TableHead>
                <TableHead>File</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {surveys.map((s: any) => {
                const r = getResponses(s.responses);
                return (
                  <TableRow key={s.id}>
                    <TableCell>{new Date(s.date).toLocaleDateString()}</TableCell>
                    <TableCell><Badge variant="outline">{s.survey_type}</Badge></TableCell>
                    <TableCell><RatingBadge value={r.overall_rating ?? null} /></TableCell>
                    <TableCell><RatingBadge value={r.feel_safe ?? null} /></TableCell>
                    <TableCell><RatingBadge value={r.staff_respectful ?? null} /></TableCell>
                    <TableCell><RatingBadge value={r.choice_and_control ?? null} /></TableCell>
                    <TableCell>
                      {s.document_url ? (
                        <a href={s.document_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 text-primary" />
                        </a>
                      ) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Satisfaction Survey</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Date</Label><Input type="date" value={surveyDate} onChange={e => setSurveyDate(e.target.value)} /></div>
            <div><Label>Survey Type</Label>
              <Select value={surveyType} onValueChange={setSurveyType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="satisfaction">Satisfaction</SelectItem>
                  <SelectItem value="exit">Exit Survey</SelectItem>
                  <SelectItem value="annual">Annual Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {[
              { label: "Overall Rating (1-5)", value: overall, set: setOverall },
              { label: "Feel Safe (1-5)", value: safe, set: setSafe },
              { label: "Staff Respectful (1-5)", value: respectful, set: setRespectful },
              { label: "Choice & Control (1-5)", value: choice, set: setChoice },
            ].map(({ label, value, set }) => (
              <div key={label}><Label>{label}</Label>
                <Select value={value} onValueChange={set}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{RATING_OPTIONS.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            ))}
            <div><Label>Comments / Actions</Label><Textarea value={comments} onChange={e => setComments(e.target.value)} placeholder="Any comments or follow-up actions" /></div>
            <div><Label>Attach Document</Label><Input type="file" ref={fileRef} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => addMutation.mutate()} disabled={addMutation.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

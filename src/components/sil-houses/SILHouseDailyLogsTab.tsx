import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { format } from "date-fns";

interface Props {
  houseId: string;
}

export function SILHouseDailyLogsTab({ houseId }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [content, setContent] = useState("");

  const { data: logs = [] } = useQuery({
    queryKey: ["daily-house-logs", houseId],
    queryFn: async () => {
      const { data } = await supabase
        .from("daily_house_logs")
        .select("*")
        .eq("sil_house_id", houseId)
        .order("date", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("daily_house_logs").insert({
        sil_house_id: houseId,
        content,
        staff_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-house-logs", houseId] });
      setShowAdd(false);
      setContent("");
      toast({ title: "Daily log added" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="accent" onClick={() => setShowAdd(true)}><Plus className="mr-1 h-4 w-4" />Add Log Entry</Button>
      </div>

      {logs.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No daily logs recorded</p>
      ) : (
        <div className="space-y-3">
          {logs.map((log: any) => (
            <Card key={log.id}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium">{format(new Date(log.date), "EEEE, dd MMMM yyyy")}</span>
                  <span className="text-xs text-muted-foreground">{format(new Date(log.created_at), "HH:mm")}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{log.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Daily Log Entry</DialogTitle><DialogDescription>Record daily household activities and notes</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Log Entry</Label>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Record today's activities, observations, and notes…" className="min-h-[150px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => addMutation.mutate()} disabled={!content.trim()}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

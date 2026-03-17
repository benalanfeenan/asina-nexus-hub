import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  houseId: string;
  prefillDate?: string;
  prefillType?: string;
}

export function AddShiftDialog({ open, onOpenChange, houseId, prefillDate, prefillType }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [date, setDate] = useState(prefillDate || "");
  const [shiftType, setShiftType] = useState(prefillType || "morning");
  const [staffId, setStaffId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [status, setStatus] = useState("draft");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setDate(prefillDate || "");
      setShiftType(prefillType || "morning");
      setStaffId(""); setStartTime(""); setEndTime(""); setStatus("draft"); setNotes("");
    }
  }, [open, prefillDate, prefillType]);

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff-for-shift"],
    queryFn: async () => {
      const { data } = await supabase.from("staff").select("id, profiles(full_name)").eq("is_active", true);
      return data || [];
    },
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("shifts").insert({
        sil_house_id: houseId,
        date,
        shift_type: shiftType as any,
        staff_id: staffId || null,
        start_time: startTime || null,
        end_time: endTime || null,
        status: status as any,
        notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shifts"] });
      toast({ title: "Shift created" });
      onOpenChange(false);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Shift</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div><Label>Shift Type</Label>
            <Select value={shiftType} onValueChange={setShiftType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Morning (AM)</SelectItem>
                <SelectItem value="afternoon">Afternoon (PM)</SelectItem>
                <SelectItem value="night">Night</SelectItem>
                <SelectItem value="sleepover">Sleepover</SelectItem>
                <SelectItem value="active_night">Active Night</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Staff</Label>
            <Select value={staffId} onValueChange={setStaffId}>
              <SelectTrigger><SelectValue placeholder="Select staff (optional)" /></SelectTrigger>
              <SelectContent>
                {staffList.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{(s.profiles as any)?.full_name || "Unknown"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Start Time</Label><Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} /></div>
            <div><Label>End Time</Label><Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} /></div>
          </div>
          <div><Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!date || mutation.isPending}>
            {mutation.isPending ? "Creating..." : "Create Shift"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

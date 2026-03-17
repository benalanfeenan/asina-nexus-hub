import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Pencil, Copy, Trash2, Clock, User, Users, MapPin, FileText, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface ShiftDetailDialogProps {
  shift: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffMap: Record<string, string>;
  participantMap: Record<string, string>;
  houseMap: Record<string, string>;
  onEdit: (shift: any) => void;
  onDuplicate: (shift: any) => void;
}

function getHoursFromTime(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60;
  return diff / 60;
}

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-emerald-500/15 text-emerald-700",
  confirmed: "bg-blue-500/15 text-blue-700",
  completed: "bg-blue-500/20 text-blue-800",
  cancelled: "bg-destructive/15 text-destructive",
};

export function ShiftDetailDialog({
  shift,
  open,
  onOpenChange,
  staffMap,
  participantMap,
  houseMap,
  onEdit,
  onDuplicate,
}: ShiftDetailDialogProps) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!shift) return null;

  const hours = getHoursFromTime(shift.start_time, shift.end_time);
  const rate = shift.ndis_price_list?.rate;
  const estimatedCost = rate ? (hours * rate) : null;
  const canComplete = !["completed", "cancelled"].includes(shift.status);

  const markCompleted = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("scheduler_shifts")
      .update({ status: "completed" })
      .eq("id", shift.id);
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Shift marked as completed" });
      qc.invalidateQueries({ queryKey: ["scheduler-shifts"] });
      onOpenChange(false);
    }
  };

  const deleteShift = async () => {
    const { error } = await supabase.from("scheduler_shifts").delete().eq("id", shift.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Shift deleted" });
      qc.invalidateQueries({ queryKey: ["scheduler-shifts"] });
      onOpenChange(false);
    }
  };

  const DetailRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | null | undefined }) => {
    if (!value) return null;
    return (
      <div className="flex items-start gap-3 py-2">
        <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-sm font-medium">{value}</div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Shift Details
              <Badge className={STATUS_BADGE[shift.status] || ""}>{shift.status}</Badge>
            </DialogTitle>
            <DialogDescription>
              {format(new Date(shift.date), "EEEE, d MMMM yyyy")}
            </DialogDescription>
          </DialogHeader>

          <div className="divide-y">
            <DetailRow icon={Clock} label="Time" value={`${shift.start_time.slice(0, 5)} – ${shift.end_time.slice(0, 5)} (${hours.toFixed(1)}h)`} />
            <DetailRow icon={User} label="Staff" value={staffMap[shift.staff_id]} />
            <DetailRow icon={Users} label="Participant" value={shift.participant_id ? participantMap[shift.participant_id] : undefined} />
            <DetailRow icon={MapPin} label="SIL House" value={shift.sil_house_id ? houseMap[shift.sil_house_id] : undefined} />
            <DetailRow icon={FileText} label="Service Type" value={shift.service_type} />
            {shift.ndis_price_list && (
              <DetailRow
                icon={DollarSign}
                label="NDIS Line Item"
                value={`${shift.ndis_price_list.item_code} — $${rate?.toFixed(2)}/${shift.ndis_price_list.unit || "ea"}${estimatedCost ? ` (Est. $${estimatedCost.toFixed(2)})` : ""}`}
              />
            )}
            {shift.notes && <DetailRow icon={FileText} label="Notes" value={shift.notes} />}
          </div>

          <Separator />

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex gap-2 flex-1">
              <Button variant="outline" size="sm" onClick={() => { onOpenChange(false); onEdit(shift); }}>
                <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
              </Button>
              <Button variant="outline" size="sm" onClick={() => { onOpenChange(false); onDuplicate(shift); }}>
                <Copy className="h-3.5 w-3.5 mr-1" /> Duplicate
              </Button>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
              </Button>
            </div>
            {canComplete && (
              <Button size="sm" onClick={markCompleted} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark Completed
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete Shift"
        description="Are you sure you want to delete this shift? This action cannot be undone."
        onConfirm={deleteShift}
      />
    </>
  );
}

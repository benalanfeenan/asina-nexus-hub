import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Copy } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const SERVICE_TYPES = ["SIL", "Personal Care", "Community Access", "Respite", "Transport", "Domestic Assistance", "Social & Community", "Other"];
const STATUSES = ["draft", "published", "confirmed", "completed", "cancelled"];

interface ShiftData {
  id?: string;
  staff_id: string;
  participant_id?: string | null;
  sil_house_id?: string | null;
  date: string;
  start_time: string;
  end_time: string;
  service_type: string;
  status: string;
  notes?: string | null;
  ndis_line_item_id?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  defaultStaffId?: string;
  defaultDate?: string;
  editShift?: ShiftData | null;
}

function getHoursFromTime(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60;
  return diff / 60;
}

export function AddSchedulerShiftDialog({ open, onOpenChange, onSaved, defaultStaffId, defaultDate, editShift }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [showDuplicate, setShowDuplicate] = useState(false);
  const [dupDate, setDupDate] = useState("");
  const [dupDays, setDupDays] = useState<number[]>([]);

  const [form, setForm] = useState<ShiftData>({
    staff_id: "",
    date: "",
    start_time: "08:00",
    end_time: "16:00",
    service_type: "SIL",
    status: "draft",
    notes: "",
    participant_id: null,
    sil_house_id: null,
    ndis_line_item_id: null,
  });

  useEffect(() => {
    if (editShift) {
      setForm({ ...editShift });
    } else {
      setForm({
        staff_id: defaultStaffId || "",
        date: defaultDate || "",
        start_time: "08:00",
        end_time: "16:00",
        service_type: "SIL",
        status: "draft",
        notes: "",
        participant_id: null,
        sil_house_id: null,
        ndis_line_item_id: null,
      });
    }
  }, [editShift, defaultStaffId, defaultDate, open]);

  const { data: staffList } = useQuery({
    queryKey: ["staff-list"],
    queryFn: async () => {
      const { data } = await supabase.from("staff").select("id, first_name, last_name").eq("status", "active").order("first_name") as any;
      return (data || []) as { id: string; first_name: string; last_name: string }[];
    },
  });

  const { data: participants } = useQuery({
    queryKey: ["participants-list"],
    queryFn: async () => {
      const { data } = await supabase.from("participants").select("id, first_name, last_name").eq("is_active", true).order("first_name") as any;
      return (data || []) as { id: string; first_name: string; last_name: string }[];
    },
  });

  const { data: houses } = useQuery({
    queryKey: ["sil-houses-list"],
    queryFn: async () => {
      const { data } = await supabase.from("sil_houses").select("id, name").order("name") as any;
      return (data || []) as { id: string; name: string }[];
    },
  });

  const { data: ndisLineItems } = useQuery({
    queryKey: ["ndis-line-items-active"],
    queryFn: async () => {
      const { data } = await supabase.from("ndis_price_list").select("id, item_code, description, rate, unit").eq("is_active", true).order("item_code") as any;
      return (data || []) as { id: string; item_code: string; description: string; rate: number; unit: string | null }[];
    },
  });

  const selectedLineItem = ndisLineItems?.find(li => li.id === form.ndis_line_item_id);
  const estimatedCost = selectedLineItem
    ? (selectedLineItem.unit === "hour" || selectedLineItem.unit === "H"
      ? selectedLineItem.rate * getHoursFromTime(form.start_time, form.end_time)
      : selectedLineItem.rate)
    : null;

  const handleSave = async () => {
    if (!form.staff_id || !form.date || !form.start_time || !form.end_time) {
      toast({ title: "Missing fields", description: "Staff, date and times are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        staff_id: form.staff_id,
        participant_id: form.participant_id || null,
        sil_house_id: form.sil_house_id || null,
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time,
        service_type: form.service_type,
        status: form.status,
        notes: form.notes || null,
        created_by: user?.id || null,
        ndis_line_item_id: form.ndis_line_item_id || null,
      };

      if (editShift?.id) {
        const { error } = await supabase.from("scheduler_shifts").update(payload).eq("id", editShift.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("scheduler_shifts").insert(payload);
        if (error) throw error;
      }
      toast({ title: editShift ? "Shift updated" : "Shift added" });
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editShift?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("scheduler_shifts").delete().eq("id", editShift.id);
      if (error) throw error;
      toast({ title: "Shift deleted" });
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async () => {
    if (!editShift) return;
    setSaving(true);
    try {
      const payload = {
        staff_id: form.staff_id,
        participant_id: form.participant_id || null,
        sil_house_id: form.sil_house_id || null,
        start_time: form.start_time,
        end_time: form.end_time,
        service_type: form.service_type,
        status: "draft",
        notes: form.notes || null,
        created_by: user?.id || null,
        ndis_line_item_id: form.ndis_line_item_id || null,
      };

      if (dupDays.length > 0) {
        // Duplicate to selected days of week (0=Mon .. 6=Sun)
        const baseDate = new Date(form.date + "T00:00:00");
        const baseDay = (baseDate.getDay() + 6) % 7; // convert to Mon=0
        const rows = dupDays.filter(d => d !== baseDay).map(dayIdx => {
          const diff = dayIdx - baseDay;
          const targetDate = new Date(baseDate);
          targetDate.setDate(targetDate.getDate() + diff);
          const dateStr = targetDate.toISOString().slice(0, 10);
          return { ...payload, date: dateStr };
        });
        if (rows.length > 0) {
          const { error } = await supabase.from("scheduler_shifts").insert(rows);
          if (error) throw error;
          toast({ title: `${rows.length} shift(s) duplicated` });
        }
      } else if (dupDate) {
        const { error } = await supabase.from("scheduler_shifts").insert({ ...payload, date: dupDate });
        if (error) throw error;
        toast({ title: "Shift duplicated" });
      }
      onSaved();
      setShowDuplicate(false);
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const set = (k: keyof ShiftData, v: string | null) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editShift ? "Edit Shift" : "Add Shift"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Staff *</Label>
              <Select value={form.staff_id} onValueChange={v => set("staff_id", v)}>
                <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                <SelectContent>
                  {staffList?.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Input type="date" value={form.date} onChange={e => set("date", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Start Time *</Label>
              <Input type="time" value={form.start_time} onChange={e => set("start_time", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>End Time *</Label>
              <Input type="time" value={form.end_time} onChange={e => set("end_time", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Service Type</Label>
              <Select value={form.service_type} onValueChange={v => set("service_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Participant (optional)</Label>
            <Select value={form.participant_id || "__none__"} onValueChange={v => set("participant_id", v === "__none__" ? null : v)}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {participants?.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(form.service_type === "SIL" || form.sil_house_id) && (
            <div className="space-y-1.5">
              <Label>SIL House (optional)</Label>
              <Select value={form.sil_house_id || "__none__"} onValueChange={v => set("sil_house_id", v === "__none__" ? null : v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {houses?.map(h => (
                    <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>NDIS Line Item (optional)</Label>
            <Select value={form.ndis_line_item_id || "__none__"} onValueChange={v => set("ndis_line_item_id", v === "__none__" ? null : v)}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {ndisLineItems?.map(li => (
                  <SelectItem key={li.id} value={li.id}>
                    {li.item_code} – {li.description} (${Number(li.rate).toFixed(2)}/{li.unit || "ea"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {estimatedCost !== null && (
              <p className="text-xs text-muted-foreground mt-1">
                Est. cost: <span className="font-medium">${estimatedCost.toFixed(2)}</span>
                {" "}({getHoursFromTime(form.start_time, form.end_time).toFixed(1)}h × ${Number(selectedLineItem!.rate).toFixed(2)})
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={form.notes || ""} onChange={e => set("notes", e.target.value)} rows={2} />
          </div>
        </div>

        {/* Duplicate section */}
        {editShift?.id && showDuplicate && (
          <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
            <Label className="text-sm font-medium">Duplicate to…</Label>
            <div className="space-y-1.5">
              <Label className="text-xs">Specific date</Label>
              <Input type="date" value={dupDate} onChange={e => { setDupDate(e.target.value); setDupDays([]); }} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Or select days of the week</Label>
              <div className="flex gap-2 flex-wrap">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
                  <label key={day} className="flex items-center gap-1 text-xs">
                    <Checkbox
                      checked={dupDays.includes(i)}
                      onCheckedChange={checked => {
                        setDupDate("");
                        setDupDays(prev => checked ? [...prev, i] : prev.filter(d => d !== i));
                      }}
                    />
                    {day}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleDuplicate} disabled={saving || (!dupDate && dupDays.length === 0)}>
                {saving ? "Duplicating…" : "Confirm Duplicate"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowDuplicate(false)}>Cancel</Button>
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between">
          {editShift?.id && (
            <div className="flex gap-2">
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={saving}>
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
              {!showDuplicate && (
                <Button variant="outline" size="sm" onClick={() => setShowDuplicate(true)}>
                  <Copy className="h-4 w-4 mr-1" /> Duplicate
                </Button>
              )}
            </div>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : editShift ? "Update" : "Add Shift"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

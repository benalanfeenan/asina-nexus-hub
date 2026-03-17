import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, Check, X } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function Timesheets() {
  const { role, user } = useAuth();
  const canApprove = role === "admin" || role === "house_manager";
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);

  const [formDate, setFormDate] = useState("");
  const [formStaff, setFormStaff] = useState("");
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");
  const [formBreak, setFormBreak] = useState("0");
  const [formRate, setFormRate] = useState("standard");
  const [formNotes, setFormNotes] = useState("");

  const { data: timesheets = [] } = useQuery({
    queryKey: ["timesheets"],
    queryFn: async () => {
      const { data } = await supabase
        .from("timesheets")
        .select("*, staff(id, profiles(full_name))")
        .order("date", { ascending: false });
      return data || [];
    },
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff-list"],
    queryFn: async () => {
      const { data } = await supabase.from("staff").select("id, profiles(full_name)").eq("is_active", true);
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      let hours: number | null = null;
      if (formStart && formEnd) {
        const [sh, sm] = formStart.split(":").map(Number);
        const [eh, em] = formEnd.split(":").map(Number);
        hours = Math.max(0, (eh * 60 + em - (sh * 60 + sm) - Number(formBreak)) / 60);
      }
      const { error } = await supabase.from("timesheets").insert({
        staff_id: formStaff,
        date: formDate,
        start_time: formStart || null,
        end_time: formEnd || null,
        break_minutes: Number(formBreak),
        rate_type: formRate as any,
        hours,
        notes: formNotes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timesheets"] });
      setShowAdd(false);
      resetForm();
      toast({ title: "Timesheet entry added" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      const { error } = await supabase.from("timesheets").update({
        approval_status: status,
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timesheets"] });
      toast({ title: "Timesheet updated" });
    },
  });

  const resetForm = () => {
    setFormDate(""); setFormStaff(""); setFormStart(""); setFormEnd("");
    setFormBreak("0"); setFormRate("standard"); setFormNotes("");
  };

  const filtered = useMemo(() => {
    return timesheets.filter((t: any) => {
      if (statusFilter !== "all" && t.approval_status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const name = (t.staff as any)?.profiles?.full_name?.toLowerCase() || "";
        if (!name.includes(q) && !t.date.includes(q)) return false;
      }
      return true;
    });
  }, [timesheets, search, statusFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timesheets"
        action={<Button variant="accent" onClick={() => setShowAdd(true)}><Plus className="mr-1 h-4 w-4" />Add Entry</Button>}
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by staff name or date…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Staff</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
              <TableHead>Break</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Status</TableHead>
              {canApprove && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No timesheet entries found</TableCell></TableRow>
            ) : filtered.map((t: any) => (
              <TableRow key={t.id}>
                <TableCell>{format(new Date(t.date), "dd/MM/yyyy")}</TableCell>
                <TableCell className="font-medium">{(t.staff as any)?.profiles?.full_name || "—"}</TableCell>
                <TableCell>{t.start_time?.slice(0, 5) || "—"}</TableCell>
                <TableCell>{t.end_time?.slice(0, 5) || "—"}</TableCell>
                <TableCell>{t.break_minutes ?? 0}m</TableCell>
                <TableCell>{t.hours != null ? Number(t.hours).toFixed(1) : "—"}</TableCell>
                <TableCell className="capitalize">{t.rate_type?.replace("_", " ")}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={statusColors[t.approval_status] || ""}>
                    {t.approval_status}
                  </Badge>
                </TableCell>
                {canApprove && (
                  <TableCell>
                    {t.approval_status === "pending" && (
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => approveMutation.mutate({ id: t.id, status: "approved" })}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600" onClick={() => approveMutation.mutate({ id: t.id, status: "rejected" })}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Timesheet Entry</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Staff Member</Label>
              <Select value={formStaff} onValueChange={setFormStaff}>
                <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                <SelectContent>
                  {staffList.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{(s.profiles as any)?.full_name || "Unknown"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Date</Label>
              <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start Time</Label>
                <Input type="time" value={formStart} onChange={(e) => setFormStart(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>End Time</Label>
                <Input type="time" value={formEnd} onChange={(e) => setFormEnd(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Break (mins)</Label>
                <Input type="number" value={formBreak} onChange={(e) => setFormBreak(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Rate Type</Label>
                <Select value={formRate} onValueChange={setFormRate}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["standard", "saturday", "sunday", "public_holiday", "overtime", "sleepover"].map((r) => (
                      <SelectItem key={r} value={r}>{r.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => addMutation.mutate()} disabled={!formStaff || !formDate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

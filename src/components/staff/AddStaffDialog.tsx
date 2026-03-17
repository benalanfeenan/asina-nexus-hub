import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface AddStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editStaff?: {
    id: string;
    profile_id: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    position: string | null;
    employment_type: string | null;
    start_date: string | null;
    notes: string | null;
  } | null;
}

export function AddStaffDialog({ open, onOpenChange, editStaff }: AddStaffDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!editStaff;

  const [firstName, setFirstName] = useState(editStaff?.first_name || "");
  const [lastName, setLastName] = useState(editStaff?.last_name || "");
  const [profileId, setProfileId] = useState(editStaff?.profile_id || "");
  const [phone, setPhone] = useState(editStaff?.phone || "");
  const [position, setPosition] = useState(editStaff?.position || "");
  const [employmentType, setEmploymentType] = useState(editStaff?.employment_type || "casual");
  const [startDate, setStartDate] = useState(editStaff?.start_date || "");
  const [notes, setNotes] = useState(editStaff?.notes || "");

  const { data: profiles } = useQuery({
    queryKey: ["profiles-for-staff"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, email");
      return data || [];
    },
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        profile_id: profileId,
        first_name: firstName || null,
        last_name: lastName || null,
        phone: phone || null,
        position: position || null,
        employment_type: employmentType,
        start_date: startDate || null,
        notes: notes || null,
      };
      if (isEdit) {
        const { error } = await supabase.from("staff").update(payload).eq("id", editStaff!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("staff").insert(payload);
        if (error) throw error;
      }
      // Also update profiles.full_name for backward compatibility
      if (profileId && (firstName || lastName)) {
        const fullName = [firstName, lastName].filter(Boolean).join(" ");
        await supabase.from("profiles").update({ full_name: fullName }).eq("id", profileId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast({ title: isEdit ? "Staff updated" : "Staff added" });
      onOpenChange(false);
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Staff Member" : "Add Staff Member"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>First Name *</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
            </div>
            <div>
              <Label>Last Name *</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
            </div>
          </div>
          <div>
            <Label>User Profile (Login Account)</Label>
            <Select value={profileId} onValueChange={setProfileId} disabled={isEdit}>
              <SelectTrigger><SelectValue placeholder="Select a user" /></SelectTrigger>
              <SelectContent>
                {profiles?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.full_name || p.email || p.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" />
          </div>
          <div>
            <Label>Position</Label>
            <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="e.g. Support Worker" />
          </div>
          <div>
            <Label>Employment Type</Label>
            <Select value={employmentType} onValueChange={setEmploymentType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="part_time">Part Time</SelectItem>
                <SelectItem value="full_time">Full Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Start Date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!profileId || !firstName || !lastName || mutation.isPending}>
            {mutation.isPending ? "Saving..." : isEdit ? "Update" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

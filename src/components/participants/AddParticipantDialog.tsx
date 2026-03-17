import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  silHouses: { id: string; name: string }[];
  editParticipant?: any;
}

export function AddParticipantDialog({ open, onOpenChange, silHouses, editParticipant }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!editParticipant;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [ndisNumber, setNdisNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [silHouseId, setSilHouseId] = useState("none");
  const [notes, setNotes] = useState("");
  const [allergies, setAllergies] = useState(false);
  const [bsp, setBsp] = useState(false);
  const [mealtimePlan, setMealtimePlan] = useState(false);
  const [restrictivePractices, setRestrictivePractices] = useState(false);
  const [highIntensity, setHighIntensity] = useState(false);
  const [medications, setMedications] = useState(false);

  useEffect(() => {
    if (editParticipant) {
      setFirstName(editParticipant.first_name || "");
      setLastName(editParticipant.last_name || "");
      setDob(editParticipant.date_of_birth || "");
      setNdisNumber(editParticipant.ndis_number || "");
      setPhone(editParticipant.phone || "");
      setEmail(editParticipant.email || "");
      setAddress(editParticipant.address || "");
      setSilHouseId(editParticipant.sil_house_id || "none");
      setNotes(editParticipant.notes || "");
      const alerts = editParticipant.alerts as Record<string, boolean> | null;
      setAllergies(alerts?.allergies || false);
      setBsp(alerts?.bsp || false);
      setMealtimePlan(alerts?.mealtime_plan || false);
      setRestrictivePractices(alerts?.restrictive_practices || false);
      setHighIntensity(alerts?.high_intensity || false);
      setMedications(alerts?.medications || false);
    } else {
      setFirstName(""); setLastName(""); setDob(""); setNdisNumber("");
      setPhone(""); setEmail(""); setAddress(""); setSilHouseId("none");
      setNotes(""); setAllergies(false); setBsp(false); setMealtimePlan(false);
      setRestrictivePractices(false); setHighIntensity(false); setMedications(false);
    }
  }, [editParticipant, open]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        date_of_birth: dob || null,
        ndis_number: ndisNumber.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        sil_house_id: silHouseId === "none" ? null : silHouseId,
        notes: notes.trim() || null,
        alerts: { allergies, bsp, mealtime_plan: mealtimePlan, restrictive_practices: restrictivePractices, high_intensity: highIntensity },
      };
      if (isEdit) {
        const { error } = await supabase.from("participants").update(payload).eq("id", editParticipant.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("participants").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participants"] });
      queryClient.invalidateQueries({ queryKey: ["participant"] });
      toast({ title: isEdit ? "Participant updated" : "Participant added" });
      onOpenChange(false);
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Participant" : "Add Participant"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>First Name *</Label><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
            <div><Label>Last Name *</Label><Input value={lastName} onChange={(e) => setLastName(e.target.value)} /></div>
          </div>
          <div><Label>Date of Birth</Label><Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} /></div>
          <div><Label>NDIS Number</Label><Input value={ndisNumber} onChange={(e) => setNdisNumber(e.target.value)} placeholder="e.g. 431234567" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          </div>
          <div><Label>Address</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
          <div>
            <Label>SIL House</Label>
            <Select value={silHouseId} onValueChange={setSilHouseId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {silHouses.map((h) => (<SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-2 block">Alerts</Label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm"><Checkbox checked={allergies} onCheckedChange={(v) => setAllergies(!!v)} />Allergies</label>
              <label className="flex items-center gap-2 text-sm"><Checkbox checked={bsp} onCheckedChange={(v) => setBsp(!!v)} />BSP</label>
              <label className="flex items-center gap-2 text-sm"><Checkbox checked={mealtimePlan} onCheckedChange={(v) => setMealtimePlan(!!v)} />Mealtime Plan</label>
              <label className="flex items-center gap-2 text-sm"><Checkbox checked={restrictivePractices} onCheckedChange={(v) => setRestrictivePractices(!!v)} />Restrictive Practices</label>
              <label className="flex items-center gap-2 text-sm"><Checkbox checked={highIntensity} onCheckedChange={(v) => setHighIntensity(!!v)} />High Intensity</label>
            </div>
          </div>
          <div><Label>Notes</Label><Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!firstName.trim() || !lastName.trim() || mutation.isPending}>
            {mutation.isPending ? "Saving..." : isEdit ? "Update" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const COMPETENCY_OPTIONS = [
  { key: "administers_medication", label: "Participants require medication administration" },
  { key: "supports_mealtime_assessed", label: "Participants have assessed mealtime needs" },
  { key: "supports_bsp_participants", label: "Participants have Behaviour Support Plans" },
  { key: "delivers_high_intensity", label: "High intensity supports required" },
  { key: "uses_restrictive_practices", label: "Restrictive practices may be used" },
] as const;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddSILHouseDialog({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [capacity, setCapacity] = useState("");
  const [notes, setNotes] = useState("");
  const [competencies, setCompetencies] = useState<Record<string, boolean>>({
    administers_medication: false,
    supports_mealtime_assessed: false,
    supports_bsp_participants: false,
    delivers_high_intensity: false,
    uses_restrictive_practices: false,
  });

  const toggleCompetency = (key: string) => {
    setCompetencies((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: house, error } = await supabase.from("sil_houses").insert({
        name,
        address: address || null,
        capacity: capacity ? parseInt(capacity) : 0,
        notes: notes || null,
      }).select("id").single();
      if (error) throw error;

      // Insert competency requirements
      const { error: reqError } = await supabase.from("sil_house_competency_requirements").insert({
        sil_house_id: house.id,
        ...competencies,
      });
      if (reqError) throw reqError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sil-houses"] });
      toast({ title: "SIL house added" });
      onOpenChange(false);
      setName(""); setAddress(""); setCapacity(""); setNotes("");
      setCompetencies({
        administers_medication: false,
        supports_mealtime_assessed: false,
        supports_bsp_participants: false,
        delivers_high_intensity: false,
        uses_restrictive_practices: false,
      });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add SIL House</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="House name" /></div>
          <div><Label>Address</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full address" /></div>
          <div><Label>Capacity</Label><Input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="e.g. 4" /></div>
          <div><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" /></div>

          <div className="border-t border-border pt-4">
            <Label className="text-sm font-semibold">House Competency Requirements</Label>
            <p className="text-xs text-muted-foreground mb-3">Select what participant needs exist at this house. Staff assigned here will require corresponding training.</p>
            <div className="space-y-2">
              {COMPETENCY_OPTIONS.map((opt) => (
                <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={competencies[opt.key]}
                    onCheckedChange={() => toggleCompetency(opt.key)}
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!name || mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

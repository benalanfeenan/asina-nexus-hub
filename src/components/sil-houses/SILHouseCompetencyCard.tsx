import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Save, X } from "lucide-react";

const COMPETENCY_OPTIONS = [
  { key: "administers_medication", label: "Medication administration" },
  { key: "supports_mealtime_assessed", label: "Mealtime assessed needs" },
  { key: "supports_bsp_participants", label: "Behaviour Support Plans" },
  { key: "delivers_high_intensity", label: "High intensity supports" },
  { key: "uses_restrictive_practices", label: "Restrictive practices" },
] as const;

export function SILHouseCompetencyCard({ houseId }: { houseId: string }) {
  const { role } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const canEdit = role === "admin" || role === "house_manager";
  const [editing, setEditing] = useState(false);
  const [localFlags, setLocalFlags] = useState<Record<string, boolean>>({});

  const { data: reqs } = useQuery({
    queryKey: ["house-competency-reqs", houseId],
    queryFn: async () => {
      const { data } = await supabase
        .from("sil_house_competency_requirements")
        .select("*")
        .eq("sil_house_id", houseId)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (reqs) {
      setLocalFlags({
        administers_medication: reqs.administers_medication,
        supports_mealtime_assessed: reqs.supports_mealtime_assessed,
        supports_bsp_participants: reqs.supports_bsp_participants,
        delivers_high_intensity: reqs.delivers_high_intensity,
        uses_restrictive_practices: reqs.uses_restrictive_practices,
      });
    }
  }, [reqs]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (reqs) {
        const { error } = await supabase
          .from("sil_house_competency_requirements")
          .update(localFlags as any)
          .eq("sil_house_id", houseId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("sil_house_competency_requirements")
          .insert({ sil_house_id: houseId, ...localFlags });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["house-competency-reqs", houseId] });
      qc.invalidateQueries({ queryKey: ["all-house-competency-reqs"] });
      setEditing(false);
      toast({ title: "Competency requirements updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const activeCount = COMPETENCY_OPTIONS.filter((o) => reqs?.[o.key]).length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Competency Requirements</CardTitle>
          <div className="flex items-center gap-2">
            {!editing && <Badge variant="secondary" className="text-xs">{activeCount} active</Badge>}
            {canEdit && !editing && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(true)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            {editing && (
              <>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(false); if (reqs) setLocalFlags({ administers_medication: reqs.administers_medication, supports_mealtime_assessed: reqs.supports_mealtime_assessed, supports_bsp_participants: reqs.supports_bsp_participants, delivers_high_intensity: reqs.delivers_high_intensity, uses_restrictive_practices: reqs.uses_restrictive_practices }); }}>
                  <X className="h-3.5 w-3.5" />
                </Button>
                <Button variant="default" size="icon" className="h-7 w-7" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
                  <Save className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-2">
            {COMPETENCY_OPTIONS.map((opt) => (
              <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={localFlags[opt.key] || false}
                  onCheckedChange={() => setLocalFlags((prev) => ({ ...prev, [opt.key]: !prev[opt.key] }))}
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {COMPETENCY_OPTIONS.filter((o) => reqs?.[o.key]).map((o) => (
              <Badge key={o.key} variant="outline" className="text-xs">{o.label}</Badge>
            ))}
            {activeCount === 0 && <span className="text-xs text-muted-foreground">No specific competencies required</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

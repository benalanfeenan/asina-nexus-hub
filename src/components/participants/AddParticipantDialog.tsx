import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  silHouses: { id: string; name: string }[];
  editParticipant?: any;
}

function SectionHeader({ children, open }: { children: React.ReactNode; open?: boolean }) {
  return (
    <div className="flex items-center justify-between w-full py-2 font-medium text-sm">
      {children}
      <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
    </div>
  );
}

const INITIAL_FORM = {
  firstName: "", lastName: "", dob: "", ndisNumber: "", phone: "", email: "", address: "",
  silHouseId: "none", gender: "", pronouns: "", sexuality: "",
  isCald: false, countryOfBirth: "", languagesSpoken: "", interpreterRequired: false, indigenousStatus: "",
  diagnosis: "", allergiesDetail: "", dietaryRequirements: "", medicalConditions: "",
  gpName: "", gpPhone: "", gpAddress: "", pharmacyName: "", pharmacyPhone: "",
  hospitalPreference: "", medicareNumber: "", ambulanceCover: false,
  ndisPlanStart: "", ndisPlanEnd: "", planManager: "", planManagerEmail: "", planManagerPhone: "",
  supportCoordinator: "", supportCoordinatorEmail: "", supportCoordinatorPhone: "", fundingType: "",
  communicationNeeds: "", communicationAids: "", decisionMaking: "",
  guardianName: "", guardianPhone: "", guardianRelationship: "", hasGuardianshipOrder: false,
  advocateName: "", advocatePhone: "",
  allergies: false, bsp: false, mealtimePlan: false, restrictivePractices: false, highIntensity: false, medications: false, manualHandling: false,
  clientPortalEnabled: false,
  notes: "",
};

export function AddParticipantDialog({ open, onOpenChange, silHouses, editParticipant }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!editParticipant;

  const [form, setForm] = useState({ ...INITIAL_FORM });

  useEffect(() => {
    if (editParticipant) {
      const p = editParticipant;
      const alerts = (p.alerts && typeof p.alerts === "object" && !Array.isArray(p.alerts)) ? p.alerts as Record<string, boolean> : {};
      setForm({
        firstName: p.first_name || "", lastName: p.last_name || "", dob: p.date_of_birth || "",
        ndisNumber: p.ndis_number || "", phone: p.phone || "", email: p.email || "",
        address: p.address || "", silHouseId: p.sil_house_id || "none",
        gender: p.gender || "", pronouns: p.pronouns || "", sexuality: p.sexuality || "",
        isCald: p.is_cald || false, countryOfBirth: p.country_of_birth || "",
        languagesSpoken: p.languages_spoken || "", interpreterRequired: p.interpreter_required || false,
        indigenousStatus: p.indigenous_status || "",
        diagnosis: p.diagnosis || "", allergiesDetail: p.allergies_detail || "",
        dietaryRequirements: p.dietary_requirements || "", medicalConditions: p.medical_conditions || "",
        gpName: p.gp_name || "", gpPhone: p.gp_phone || "", gpAddress: p.gp_address || "",
        pharmacyName: p.pharmacy_name || "", pharmacyPhone: p.pharmacy_phone || "",
        hospitalPreference: p.hospital_preference || "", medicareNumber: p.medicare_number || "",
        ambulanceCover: p.ambulance_cover || false,
        ndisPlanStart: p.ndis_plan_start || "", ndisPlanEnd: p.ndis_plan_end || "",
        planManager: p.plan_manager || "", planManagerEmail: p.plan_manager_email || "",
        planManagerPhone: p.plan_manager_phone || "",
        supportCoordinator: p.support_coordinator || "", supportCoordinatorEmail: p.support_coordinator_email || "",
        supportCoordinatorPhone: p.support_coordinator_phone || "", fundingType: p.funding_type || "",
        communicationNeeds: p.communication_needs || "", communicationAids: p.communication_aids || "",
        decisionMaking: p.decision_making || "",
        guardianName: p.guardian_name || "", guardianPhone: p.guardian_phone || "",
        guardianRelationship: p.guardian_relationship || "", hasGuardianshipOrder: p.has_guardianship_order || false,
        advocateName: p.advocate_name || "", advocatePhone: p.advocate_phone || "",
        allergies: alerts.allergies || false, bsp: alerts.bsp || false, mealtimePlan: alerts.mealtime_plan || false,
        restrictivePractices: alerts.restrictive_practices || false, highIntensity: alerts.high_intensity || false,
        medications: alerts.medications || false, manualHandling: alerts.manual_handling || false,
        clientPortalEnabled: p.client_portal_enabled || false,
        notes: p.notes || "",
      });
    } else {
      setForm({ ...INITIAL_FORM });
    }
  }, [editParticipant, open]);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  const setBool = (key: string) => (val: boolean) =>
    setForm((prev) => ({ ...prev, [key]: val }));
  const setSelect = (key: string) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        first_name: form.firstName.trim(), last_name: form.lastName.trim(),
        date_of_birth: form.dob || null, ndis_number: form.ndisNumber.trim() || null,
        phone: form.phone.trim() || null, email: form.email.trim() || null,
        address: form.address.trim() || null,
        sil_house_id: form.silHouseId === "none" ? null : form.silHouseId,
        gender: form.gender || null, pronouns: form.pronouns || null, sexuality: form.sexuality || null,
        is_cald: form.isCald, country_of_birth: form.countryOfBirth || null,
        languages_spoken: form.languagesSpoken || null, interpreter_required: form.interpreterRequired,
        indigenous_status: form.indigenousStatus || null,
        diagnosis: form.diagnosis || null, allergies_detail: form.allergiesDetail || null,
        dietary_requirements: form.dietaryRequirements || null, medical_conditions: form.medicalConditions || null,
        gp_name: form.gpName || null, gp_phone: form.gpPhone || null, gp_address: form.gpAddress || null,
        pharmacy_name: form.pharmacyName || null, pharmacy_phone: form.pharmacyPhone || null,
        hospital_preference: form.hospitalPreference || null, medicare_number: form.medicareNumber || null,
        ambulance_cover: form.ambulanceCover,
        ndis_plan_start: form.ndisPlanStart || null, ndis_plan_end: form.ndisPlanEnd || null,
        plan_manager: form.planManager || null, plan_manager_email: form.planManagerEmail || null,
        plan_manager_phone: form.planManagerPhone || null,
        support_coordinator: form.supportCoordinator || null,
        support_coordinator_email: form.supportCoordinatorEmail || null,
        support_coordinator_phone: form.supportCoordinatorPhone || null,
        funding_type: form.fundingType || null,
        communication_needs: form.communicationNeeds || null, communication_aids: form.communicationAids || null,
        decision_making: form.decisionMaking || null,
        guardian_name: form.guardianName || null, guardian_phone: form.guardianPhone || null,
        guardian_relationship: form.guardianRelationship || null,
        has_guardianship_order: form.hasGuardianshipOrder,
        advocate_name: form.advocateName || null, advocate_phone: form.advocatePhone || null,
        notes: form.notes.trim() || null,
        alerts: {
          allergies: form.allergies, bsp: form.bsp, mealtime_plan: form.mealtimePlan,
          restrictive_practices: form.restrictivePractices, high_intensity: form.highIntensity, medications: form.medications,
          manual_handling: form.manualHandling,
        },
      };
      if (isEdit) {
        const { error } = await supabase.from("participants").update(payload).eq("id", editParticipant.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("participants").insert(payload as any);
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

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    basic: true, cultural: false, medical: false, ndis: false, communication: false, guardian: false, alerts: false, notes: false,
  });
  const toggle = (s: string) => setOpenSections((p) => ({ ...p, [s]: !p[s] }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Participant" : "Add Participant"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-1">
          {/* Basic Info */}
          <Collapsible open={openSections.basic} onOpenChange={() => toggle("basic")}>
            <CollapsibleTrigger className="w-full border-b border-border">
              <SectionHeader open={openSections.basic}>Basic Information</SectionHeader>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3 pb-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>First Name *</Label><Input value={form.firstName} onChange={set("firstName")} /></div>
                <div><Label>Last Name *</Label><Input value={form.lastName} onChange={set("lastName")} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Date of Birth</Label><Input type="date" value={form.dob} onChange={set("dob")} /></div>
                <div>
                  <Label>Gender</Label>
                  <Select value={form.gender} onValueChange={setSelect("gender")}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="non_binary">Non-Binary</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Pronouns</Label><Input value={form.pronouns} onChange={set("pronouns")} placeholder="e.g. she/her" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Phone</Label><Input value={form.phone} onChange={set("phone")} /></div>
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={set("email")} /></div>
              </div>
              <div><Label>Address</Label><Input value={form.address} onChange={set("address")} /></div>
              <div><Label>NDIS Number</Label><Input value={form.ndisNumber} onChange={set("ndisNumber")} placeholder="e.g. 431234567" /></div>
              <div>
                <Label>SIL House</Label>
                <Select value={form.silHouseId} onValueChange={setSelect("silHouseId")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {silHouses.map((h) => (<SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Cultural & Language */}
          <Collapsible open={openSections.cultural} onOpenChange={() => toggle("cultural")}>
            <CollapsibleTrigger className="w-full border-b border-border">
              <SectionHeader open={openSections.cultural}>Cultural & Language</SectionHeader>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3 pb-4">
              <div className="flex items-center gap-3">
                <Switch checked={form.isCald} onCheckedChange={setBool("isCald")} />
                <Label>Culturally & Linguistically Diverse (CALD)</Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Country of Birth</Label><Input value={form.countryOfBirth} onChange={set("countryOfBirth")} /></div>
                <div><Label>Languages Spoken</Label><Input value={form.languagesSpoken} onChange={set("languagesSpoken")} placeholder="e.g. English, Arabic" /></div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.interpreterRequired} onCheckedChange={setBool("interpreterRequired")} />
                <Label>Interpreter Required</Label>
              </div>
              <div>
                <Label>Indigenous Status</Label>
                <Select value={form.indigenousStatus} onValueChange={setSelect("indigenousStatus")}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="non_indigenous">Non-Indigenous</SelectItem>
                    <SelectItem value="aboriginal">Aboriginal</SelectItem>
                    <SelectItem value="torres_strait_islander">Torres Strait Islander</SelectItem>
                    <SelectItem value="both">Aboriginal & Torres Strait Islander</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Medical & Health */}
          <Collapsible open={openSections.medical} onOpenChange={() => toggle("medical")}>
            <CollapsibleTrigger className="w-full border-b border-border">
              <SectionHeader open={openSections.medical}>Medical & Health</SectionHeader>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3 pb-4">
              <div><Label>Diagnosis / Disabilities</Label><Textarea value={form.diagnosis} onChange={set("diagnosis")} placeholder="Primary diagnosis" /></div>
              <div><Label>Allergy Details</Label><Textarea value={form.allergiesDetail} onChange={set("allergiesDetail")} placeholder="Specific allergy information" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Dietary Requirements</Label><Input value={form.dietaryRequirements} onChange={set("dietaryRequirements")} /></div>
                <div><Label>Medical Conditions</Label><Input value={form.medicalConditions} onChange={set("medicalConditions")} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>GP Name</Label><Input value={form.gpName} onChange={set("gpName")} /></div>
                <div><Label>GP Phone</Label><Input value={form.gpPhone} onChange={set("gpPhone")} /></div>
                <div><Label>GP Address</Label><Input value={form.gpAddress} onChange={set("gpAddress")} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Pharmacy Name</Label><Input value={form.pharmacyName} onChange={set("pharmacyName")} /></div>
                <div><Label>Pharmacy Phone</Label><Input value={form.pharmacyPhone} onChange={set("pharmacyPhone")} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Hospital Preference</Label><Input value={form.hospitalPreference} onChange={set("hospitalPreference")} /></div>
                <div><Label>Medicare Number</Label><Input value={form.medicareNumber} onChange={set("medicareNumber")} /></div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.ambulanceCover} onCheckedChange={setBool("ambulanceCover")} />
                <Label>Ambulance Cover</Label>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* NDIS Plan */}
          <Collapsible open={openSections.ndis} onOpenChange={() => toggle("ndis")}>
            <CollapsibleTrigger className="w-full border-b border-border">
              <SectionHeader open={openSections.ndis}>NDIS Plan</SectionHeader>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3 pb-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Plan Start</Label><Input type="date" value={form.ndisPlanStart} onChange={set("ndisPlanStart")} /></div>
                <div><Label>Plan End</Label><Input type="date" value={form.ndisPlanEnd} onChange={set("ndisPlanEnd")} /></div>
              </div>
              <div>
                <Label>Funding Type</Label>
                <Select value={form.fundingType} onValueChange={setSelect("fundingType")}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ndia_managed">NDIA Managed</SelectItem>
                    <SelectItem value="plan_managed">Plan Managed</SelectItem>
                    <SelectItem value="self_managed">Self Managed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Plan Manager</Label><Input value={form.planManager} onChange={set("planManager")} /></div>
                <div><Label>PM Email</Label><Input type="email" value={form.planManagerEmail} onChange={set("planManagerEmail")} /></div>
                <div><Label>PM Phone</Label><Input value={form.planManagerPhone} onChange={set("planManagerPhone")} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Support Coordinator</Label><Input value={form.supportCoordinator} onChange={set("supportCoordinator")} /></div>
                <div><Label>SC Email</Label><Input type="email" value={form.supportCoordinatorEmail} onChange={set("supportCoordinatorEmail")} /></div>
                <div><Label>SC Phone</Label><Input value={form.supportCoordinatorPhone} onChange={set("supportCoordinatorPhone")} /></div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Communication */}
          <Collapsible open={openSections.communication} onOpenChange={() => toggle("communication")}>
            <CollapsibleTrigger className="w-full border-b border-border">
              <SectionHeader open={openSections.communication}>Communication</SectionHeader>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3 pb-4">
              <div><Label>Communication Needs</Label><Textarea value={form.communicationNeeds} onChange={set("communicationNeeds")} placeholder="How the participant communicates" /></div>
              <div><Label>Communication Aids</Label><Input value={form.communicationAids} onChange={set("communicationAids")} placeholder="Aids or devices used" /></div>
              <div><Label>Decision Making</Label><Textarea value={form.decisionMaking} onChange={set("decisionMaking")} placeholder="Supported/substitute decision making info" /></div>
            </CollapsibleContent>
          </Collapsible>

          {/* Guardian / Advocate */}
          <Collapsible open={openSections.guardian} onOpenChange={() => toggle("guardian")}>
            <CollapsibleTrigger className="w-full border-b border-border">
              <SectionHeader open={openSections.guardian}>Guardian / Advocate</SectionHeader>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3 pb-4">
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Guardian Name</Label><Input value={form.guardianName} onChange={set("guardianName")} /></div>
                <div><Label>Guardian Phone</Label><Input value={form.guardianPhone} onChange={set("guardianPhone")} /></div>
                <div><Label>Relationship</Label><Input value={form.guardianRelationship} onChange={set("guardianRelationship")} /></div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.hasGuardianshipOrder} onCheckedChange={setBool("hasGuardianshipOrder")} />
                <Label>Has Guardianship Order</Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Advocate Name</Label><Input value={form.advocateName} onChange={set("advocateName")} /></div>
                <div><Label>Advocate Phone</Label><Input value={form.advocatePhone} onChange={set("advocatePhone")} /></div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Alerts */}
          <Collapsible open={openSections.alerts} onOpenChange={() => toggle("alerts")}>
            <CollapsibleTrigger className="w-full border-b border-border">
              <SectionHeader open={openSections.alerts}>Alerts</SectionHeader>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3 pb-4">
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.allergies} onCheckedChange={(v) => setBool("allergies")(!!v)} />Allergies</label>
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.bsp} onCheckedChange={(v) => setBool("bsp")(!!v)} />BSP</label>
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.mealtimePlan} onCheckedChange={(v) => setBool("mealtimePlan")(!!v)} />Mealtime Plan</label>
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.restrictivePractices} onCheckedChange={(v) => setBool("restrictivePractices")(!!v)} />Restrictive Practices</label>
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.highIntensity} onCheckedChange={(v) => setBool("highIntensity")(!!v)} />High Intensity</label>
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.medications} onCheckedChange={(v) => setBool("medications")(!!v)} />Medications</label>
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.manualHandling} onCheckedChange={(v) => setBool("manualHandling")(!!v)} />Manual Handling</label>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Notes */}
          <Collapsible open={openSections.notes} onOpenChange={() => toggle("notes")}>
            <CollapsibleTrigger className="w-full border-b border-border">
              <SectionHeader open={openSections.notes}>Notes</SectionHeader>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3 pb-4">
              <Textarea value={form.notes} onChange={set("notes")} placeholder="Optional notes" />
            </CollapsibleContent>
          </Collapsible>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!form.firstName.trim() || !form.lastName.trim() || mutation.isPending}>
            {mutation.isPending ? "Saving..." : isEdit ? "Update" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

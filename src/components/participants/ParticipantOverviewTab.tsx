import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ParticipantOverviewTabProps {
  participant: Record<string, any>;
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <span className="text-muted-foreground text-xs">{label}</span>
      <p className="text-sm">{value || "—"}</p>
    </div>
  );
}

function BoolField({ label, value }: { label: string; value: boolean | undefined }) {
  return (
    <div>
      <span className="text-muted-foreground text-xs">{label}</span>
      <p className="text-sm">{value ? "Yes" : "No"}</p>
    </div>
  );
}

const GENDER_LABELS: Record<string, string> = {
  male: "Male", female: "Female", non_binary: "Non-Binary", other: "Other", prefer_not_to_say: "Prefer not to say",
};
const INDIGENOUS_LABELS: Record<string, string> = {
  non_indigenous: "Non-Indigenous", aboriginal: "Aboriginal", torres_strait_islander: "Torres Strait Islander",
  both: "Aboriginal & Torres Strait Islander", prefer_not_to_say: "Prefer not to say",
};
const FUNDING_LABELS: Record<string, string> = {
  ndia_managed: "NDIA Managed", plan_managed: "Plan Managed", self_managed: "Self Managed",
};

export function ParticipantOverviewTab({ participant: p }: ParticipantOverviewTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Personal Details */}
      <Card>
        <CardHeader><CardTitle className="text-base">Personal Details</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <Field label="Phone" value={p.phone} />
          <Field label="Email" value={p.email} />
          <Field label="Date of Birth" value={p.date_of_birth} />
          <Field label="Gender" value={GENDER_LABELS[p.gender] || p.gender} />
          <Field label="Pronouns" value={p.pronouns} />
          <Field label="Sexuality" value={p.sexuality} />
          <Field label="Address" value={p.address} />
          <Field label="NDIS Number" value={p.ndis_number} />
          <Field label="SIL House" value={(p.sil_houses as any)?.name} />
        </CardContent>
      </Card>

      {/* Cultural & Language */}
      <Card>
        <CardHeader><CardTitle className="text-base">Cultural & Language</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <BoolField label="CALD" value={p.is_cald} />
          <Field label="Country of Birth" value={p.country_of_birth} />
          <Field label="Languages Spoken" value={p.languages_spoken} />
          <BoolField label="Interpreter Required" value={p.interpreter_required} />
          <Field label="Indigenous Status" value={INDIGENOUS_LABELS[p.indigenous_status] || p.indigenous_status} />
        </CardContent>
      </Card>

      {/* Medical & Health */}
      <Card>
        <CardHeader><CardTitle className="text-base">Medical & Health</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Field label="Diagnosis / Disabilities" value={p.diagnosis} /></div>
          <div className="col-span-2"><Field label="Allergy Details" value={p.allergies_detail} /></div>
          <Field label="Dietary Requirements" value={p.dietary_requirements} />
          <Field label="Medical Conditions" value={p.medical_conditions} />
          <Field label="GP Name" value={p.gp_name} />
          <Field label="GP Phone" value={p.gp_phone} />
          <Field label="GP Address" value={p.gp_address} />
          <Field label="Pharmacy" value={p.pharmacy_name} />
          <Field label="Pharmacy Phone" value={p.pharmacy_phone} />
          <Field label="Hospital Preference" value={p.hospital_preference} />
          <Field label="Medicare Number" value={p.medicare_number} />
          <BoolField label="Ambulance Cover" value={p.ambulance_cover} />
        </CardContent>
      </Card>

      {/* NDIS Plan */}
      <Card>
        <CardHeader><CardTitle className="text-base">NDIS Plan</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <Field label="Plan Start" value={p.ndis_plan_start} />
          <Field label="Plan End" value={p.ndis_plan_end} />
          <Field label="Funding Type" value={FUNDING_LABELS[p.funding_type] || p.funding_type} />
          <Field label="Plan Manager" value={p.plan_manager} />
          <Field label="PM Email" value={p.plan_manager_email} />
          <Field label="PM Phone" value={p.plan_manager_phone} />
          <Field label="Support Coordinator" value={p.support_coordinator} />
          <Field label="SC Email" value={p.support_coordinator_email} />
          <Field label="SC Phone" value={p.support_coordinator_phone} />
        </CardContent>
      </Card>

      {/* Communication */}
      <Card>
        <CardHeader><CardTitle className="text-base">Communication</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Field label="Communication Needs" value={p.communication_needs} /></div>
          <Field label="Communication Aids" value={p.communication_aids} />
          <div className="col-span-2"><Field label="Decision Making" value={p.decision_making} /></div>
        </CardContent>
      </Card>

      {/* Guardian / Advocate */}
      <Card>
        <CardHeader><CardTitle className="text-base">Guardian / Advocate</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <Field label="Guardian Name" value={p.guardian_name} />
          <Field label="Guardian Phone" value={p.guardian_phone} />
          <Field label="Relationship" value={p.guardian_relationship} />
          <BoolField label="Guardianship Order" value={p.has_guardianship_order} />
          <Field label="Advocate Name" value={p.advocate_name} />
          <Field label="Advocate Phone" value={p.advocate_phone} />
          {p.notes && (
            <div className="col-span-2 mt-2">
              <span className="text-muted-foreground text-xs">Notes</span>
              <p className="text-sm">{p.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

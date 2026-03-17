export interface ComplianceItemDefinition {
  item_key: string;
  name: string;
  description: string;
  category: "Pre-Employment" | "Induction" | "Role-Specific" | "Ongoing";
  requires_document: boolean;
  has_expiry: boolean;
  expiry_months: number | null;
  is_mandatory: boolean;
  conditional_on: string | null;
  linked_to: string | null;
  display_order: number;
}

export const COMPLIANCE_ITEMS: ComplianceItemDefinition[] = [
  // Pre-Employment
  { item_key: "ndis_wsc", name: "NDIS Worker Screening Check (Cleared)", description: "NDIS Worker Screening Check must be cleared before participant contact", category: "Pre-Employment", requires_document: true, has_expiry: true, expiry_months: 60, is_mandatory: true, conditional_on: null, linked_to: null, display_order: 1 },
  { item_key: "wwcc", name: "Working With Children Check", description: "Required if supporting participants under 18", category: "Pre-Employment", requires_document: true, has_expiry: true, expiry_months: 60, is_mandatory: true, conditional_on: "supports_under_18", linked_to: null, display_order: 2 },
  { item_key: "right_to_work", name: "Right to Work in Australia Verification", description: "Verification of right to work in Australia", category: "Pre-Employment", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: null, linked_to: null, display_order: 3 },
  { item_key: "reference_check_1", name: "Reference Check 1 (completed)", description: "First professional reference check completed", category: "Pre-Employment", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: null, linked_to: null, display_order: 4 },
  { item_key: "reference_check_2", name: "Reference Check 2 (completed)", description: "Second professional reference check completed", category: "Pre-Employment", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: null, linked_to: null, display_order: 5 },
  { item_key: "qualifications", name: "Qualifications Verified (Cert III/IV or equivalent)", description: "Qualifications verified", category: "Pre-Employment", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: null, linked_to: null, display_order: 6 },
  { item_key: "hundred_points_id", name: "100 Points of ID Verified", description: "100 points of identification verified (e.g. passport, licence, birth certificate)", category: "Pre-Employment", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: null, linked_to: null, display_order: 4 },
  { item_key: "drivers_licence", name: "Current Driver's Licence", description: "Current driver's licence required for all staff", category: "Pre-Employment", requires_document: true, has_expiry: true, expiry_months: 12, is_mandatory: true, conditional_on: null, linked_to: null, display_order: 7 },
  { item_key: "vehicle_registration", name: "Vehicle Registration", description: "Required if transporting clients in own vehicle", category: "Pre-Employment", requires_document: true, has_expiry: true, expiry_months: 12, is_mandatory: true, conditional_on: "transports_in_own_vehicle", linked_to: null, display_order: 8 },
  { item_key: "vehicle_insurance", name: "Vehicle Insurance", description: "Required if transporting clients in own vehicle", category: "Pre-Employment", requires_document: true, has_expiry: true, expiry_months: 12, is_mandatory: true, conditional_on: "transports_in_own_vehicle", linked_to: null, display_order: 8.5 },
  // Induction
  { item_key: "ndis_orientation", name: "NDIS Worker Orientation Module Certificate", description: "Completion of NDIS Worker Orientation Module", category: "Induction", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: null, linked_to: null, display_order: 9 },
  { item_key: "employment_contract", name: "Signed Employment Contract", description: "Signed employment contract on file", category: "Induction", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: null, linked_to: null, display_order: 10 },
  { item_key: "position_description", name: "Position Description Acknowledged", description: "Position description acknowledged and signed", category: "Induction", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: null, linked_to: null, display_order: 11 },
  { item_key: "code_of_conduct", name: "Code of Conduct Acknowledgement Signed", description: "Code of conduct signed", category: "Induction", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: null, linked_to: null, display_order: 12 },
  { item_key: "confidentiality_agreement", name: "Confidentiality Agreement Signed", description: "Confidentiality agreement signed", category: "Induction", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: null, linked_to: null, display_order: 13 },
  { item_key: "coi_declaration", name: "Conflict of Interest Declaration Completed", description: "COI declaration completed", category: "Induction", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: null, linked_to: null, display_order: 14 },
  { item_key: "induction_checklist", name: "Staff Induction Checklist Completed and Signed", description: "Full induction checklist completed", category: "Induction", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: null, linked_to: null, display_order: 15 },
  { item_key: "whs_induction", name: "WHS Induction Completed", description: "Work health and safety induction completed", category: "Induction", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: null, linked_to: null, display_order: 16 },
  { item_key: "first_aid", name: "First Aid Certificate (HLTAID011)", description: "Current first aid certificate", category: "Induction", requires_document: true, has_expiry: true, expiry_months: 36, is_mandatory: true, conditional_on: null, linked_to: null, display_order: 17 },
  { item_key: "cpr", name: "CPR Certificate (HLTAID009)", description: "Current CPR certificate", category: "Induction", requires_document: true, has_expiry: true, expiry_months: 12, is_mandatory: true, conditional_on: null, linked_to: null, display_order: 18 },
  { item_key: "manual_handling", name: "Manual Handling Training", description: "Manual handling training completed", category: "Induction", requires_document: true, has_expiry: true, expiry_months: 12, is_mandatory: true, conditional_on: null, linked_to: null, display_order: 19 },
  { item_key: "infection_control", name: "Infection Prevention and Control Training", description: "Infection control training completed", category: "Induction", requires_document: true, has_expiry: true, expiry_months: 12, is_mandatory: true, conditional_on: null, linked_to: null, display_order: 20 },
  { item_key: "fire_safety", name: "Fire Safety and Evacuation Training", description: "Fire safety training completed", category: "Induction", requires_document: true, has_expiry: true, expiry_months: 12, is_mandatory: true, conditional_on: null, linked_to: null, display_order: 21 },
  { item_key: "incident_reporting", name: "Incident Reporting Training", description: "Incident reporting training completed", category: "Induction", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: null, linked_to: null, display_order: 22 },
  { item_key: "code_of_conduct_training", name: "NDIS Code of Conduct Training", description: "NDIS Code of Conduct training completed", category: "Induction", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: null, linked_to: null, display_order: 23 },
  { item_key: "participant_rights", name: "Participant Rights and Dignity of Risk Training", description: "Participant rights training completed", category: "Induction", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: null, linked_to: null, display_order: 24 },
  { item_key: "policies_orientation", name: "Organisational Policies and Procedures Orientation", description: "Policies orientation completed", category: "Induction", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: null, linked_to: null, display_order: 25 },
  // Role-Specific
  { item_key: "medication_training", name: "Medication Administration Training", description: "Medication administration training", category: "Role-Specific", requires_document: true, has_expiry: true, expiry_months: 12, is_mandatory: true, conditional_on: "administers_medication", linked_to: null, display_order: 26 },
  { item_key: "medication_competency", name: "Medication Competency Assessment (passed)", description: "Medication competency assessment passed", category: "Role-Specific", requires_document: true, has_expiry: true, expiry_months: 12, is_mandatory: true, conditional_on: "administers_medication", linked_to: null, display_order: 27 },
  { item_key: "mealtime_training", name: "Mealtime Management Training", description: "Mealtime management training", category: "Role-Specific", requires_document: true, has_expiry: true, expiry_months: 12, is_mandatory: true, conditional_on: "supports_mealtime_assessed", linked_to: null, display_order: 28 },
  { item_key: "mealtime_competency", name: "Mealtime Competency Assessment (passed)", description: "Mealtime competency assessment passed", category: "Role-Specific", requires_document: true, has_expiry: true, expiry_months: 12, is_mandatory: true, conditional_on: "supports_mealtime_assessed", linked_to: null, display_order: 29 },
  { item_key: "bsp_training", name: "Behaviour Support Plan Training (participant-specific)", description: "BSP training completed", category: "Role-Specific", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: "supports_bsp_participants", linked_to: null, display_order: 30 },
  { item_key: "restrictive_practice_training", name: "Restrictive Practice Training", description: "Restrictive practice training completed", category: "Role-Specific", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: "uses_restrictive_practices", linked_to: null, display_order: 31 },
  { item_key: "high_intensity_training", name: "High Intensity Support Training", description: "High intensity support training", category: "Role-Specific", requires_document: true, has_expiry: true, expiry_months: 12, is_mandatory: true, conditional_on: "delivers_high_intensity", linked_to: null, display_order: 32 },
  { item_key: "high_intensity_competency", name: "High Intensity Skills Competency Assessment (passed)", description: "High intensity competency passed", category: "Role-Specific", requires_document: true, has_expiry: true, expiry_months: 12, is_mandatory: true, conditional_on: "delivers_high_intensity", linked_to: null, display_order: 33 },
  // Ongoing
  { item_key: "cpr_refresher", name: "CPR Refresher (annual)", description: "Annual CPR refresher", category: "Ongoing", requires_document: true, has_expiry: true, expiry_months: 12, is_mandatory: true, conditional_on: null, linked_to: "cpr", display_order: 34 },
  { item_key: "first_aid_renewal", name: "First Aid Renewal", description: "First aid certificate renewal", category: "Ongoing", requires_document: true, has_expiry: true, expiry_months: 36, is_mandatory: true, conditional_on: null, linked_to: "first_aid", display_order: 35 },
  { item_key: "ndis_wsc_renewal", name: "NDIS WSC Renewal", description: "NDIS Worker Screening Check renewal", category: "Ongoing", requires_document: true, has_expiry: true, expiry_months: 60, is_mandatory: true, conditional_on: null, linked_to: "ndis_wsc", display_order: 36 },
  { item_key: "infection_control_refresher", name: "Infection Control Refresher (annual)", description: "Annual infection control refresher", category: "Ongoing", requires_document: true, has_expiry: true, expiry_months: 12, is_mandatory: true, conditional_on: null, linked_to: null, display_order: 37 },
  { item_key: "fire_safety_refresher", name: "Fire Safety Refresher (annual)", description: "Annual fire safety refresher", category: "Ongoing", requires_document: true, has_expiry: true, expiry_months: 12, is_mandatory: true, conditional_on: null, linked_to: null, display_order: 38 },
  { item_key: "manual_handling_refresher", name: "Manual Handling Refresher (annual)", description: "Annual manual handling refresher", category: "Ongoing", requires_document: true, has_expiry: true, expiry_months: 12, is_mandatory: true, conditional_on: null, linked_to: null, display_order: 39 },
  { item_key: "supervision_records", name: "Regular Supervision Records on File", description: "At least 1 supervision record in last 3 months", category: "Ongoing", requires_document: true, has_expiry: false, expiry_months: null, is_mandatory: true, conditional_on: null, linked_to: null, display_order: 40 },
  { item_key: "performance_review", name: "Annual Performance Review Completed", description: "Annual performance review completed", category: "Ongoing", requires_document: true, has_expiry: true, expiry_months: 12, is_mandatory: true, conditional_on: null, linked_to: null, display_order: 41 },
];

export const CATEGORIES = ["Pre-Employment", "Induction", "Role-Specific", "Ongoing"] as const;

export const ROLE_FLAG_LABELS: Record<string, string> = {
  administers_medication: "Administers medication",
  supports_mealtime_assessed: "Supports participants with assessed mealtime needs",
  supports_bsp_participants: "Supports participants with Behaviour Support Plans",
  delivers_high_intensity: "Delivers high intensity supports",
  uses_restrictive_practices: "Uses restrictive practices (trained)",
  transports_in_own_vehicle: "Transports clients in own vehicle",
  supports_under_18: "Supports participants under 18",
};

export const ROLE_FLAG_KEYS = Object.keys(ROLE_FLAG_LABELS);

export type RoleFlags = {
  administers_medication: boolean;
  supports_mealtime_assessed: boolean;
  supports_bsp_participants: boolean;
  delivers_high_intensity: boolean;
  uses_restrictive_practices: boolean;
  transports_in_own_vehicle: boolean;
  supports_under_18: boolean;
};

export const DEFAULT_ROLE_FLAGS: RoleFlags = {
  administers_medication: false,
  supports_mealtime_assessed: false,
  supports_bsp_participants: false,
  delivers_high_intensity: false,
  uses_restrictive_practices: false,
  transports_participants: false,
  supports_under_18: false,
};

export function isItemApplicable(item: ComplianceItemDefinition, flags: RoleFlags): boolean {
  if (!item.conditional_on) return true;
  return !!(flags as any)[item.conditional_on];
}

export function getItemStatus(
  item: ComplianceItemDefinition,
  record: { status: string; expiry_date: string | null } | undefined,
  flags: RoleFlags
): "completed" | "expired" | "expiring_soon" | "in_progress" | "not_started" | "not_applicable" {
  if (!isItemApplicable(item, flags)) return "not_applicable";
  if (!record || record.status === "not_started") return "not_started";
  if (record.status === "not_applicable") return "not_applicable";
  if (record.status === "in_progress") return "in_progress";
  if (record.status === "completed" || record.status === "expired") {
    if (item.has_expiry && record.expiry_date) {
      const diff = (new Date(record.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (diff < 0) return "expired";
      if (diff <= 30) return "expiring_soon";
    }
    if (record.status === "expired") return "expired";
    return "completed";
  }
  return "not_started";
}

export function calculateComplianceScore(
  items: ComplianceItemDefinition[],
  records: Map<string, { status: string; expiry_date: string | null }>,
  flags: RoleFlags
): number {
  const applicable = items.filter((i) => i.is_mandatory && isItemApplicable(i, flags));
  if (applicable.length === 0) return 100;
  const compliant = applicable.filter((i) => {
    const status = getItemStatus(i, records.get(i.item_key), flags);
    return status === "completed";
  });
  return Math.round((compliant.length / applicable.length) * 100);
}

// === Cross-tab mapping constants ===

/** Maps acknowledgement document_type → compliance item_key */
export const ACKNOWLEDGEMENT_TO_COMPLIANCE: Record<string, string> = {
  code_of_conduct: "code_of_conduct",
  confidentiality_agreement: "confidentiality_agreement",
  induction_checklist: "induction_checklist",
  whs_policy: "whs_induction",
};

/** Maps competency_type → compliance item_key */
export const COMPETENCY_TO_COMPLIANCE: Record<string, string> = {
  medication: "medication_competency",
  mealtime: "mealtime_competency",
  high_intensity: "high_intensity_competency",
};

/** Maps training name (lowercase) → { compliance_key, expiry_months } */
export const TRAINING_TO_COMPLIANCE: Record<string, { key: string; expiry_months: number | null }> = {
  "first aid": { key: "first_aid", expiry_months: 36 },
  "cpr": { key: "cpr", expiry_months: 12 },
  "manual handling": { key: "manual_handling", expiry_months: 12 },
  "fire safety": { key: "fire_safety", expiry_months: 12 },
  "infection control": { key: "infection_control", expiry_months: 12 },
  "ndis orientation": { key: "ndis_orientation", expiry_months: null },
  "ndis worker orientation": { key: "ndis_orientation", expiry_months: null },
  "incident reporting": { key: "incident_reporting", expiry_months: null },
  "medication administration": { key: "medication_training", expiry_months: 12 },
  "mealtime management": { key: "mealtime_training", expiry_months: 12 },
  "behaviour support": { key: "bsp_training", expiry_months: null },
  "restrictive practice": { key: "restrictive_practice_training", expiry_months: null },
  "high intensity": { key: "high_intensity_training", expiry_months: 12 },
  "code of conduct": { key: "code_of_conduct_training", expiry_months: null },
  "participant rights": { key: "participant_rights", expiry_months: null },
};

/** Supervision type → compliance item_key */
export const SUPERVISION_TO_COMPLIANCE: Record<string, string> = {
  supervision: "supervision_records",
  performance_review: "performance_review",
};

/** Helper: upsert a compliance item via supabase */
export async function upsertComplianceItem(
  supabase: any,
  staffId: string,
  itemKey: string,
  data: {
    status: string;
    date_completed?: string | null;
    expiry_date?: string | null;
    document_url?: string | null;
    notes?: string | null;
  }
) {
  const { data: existing } = await supabase
    .from("staff_compliance_items")
    .select("id")
    .eq("staff_id", staffId)
    .eq("item_key", itemKey)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("staff_compliance_items")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    await supabase
      .from("staff_compliance_items")
      .insert({ staff_id: staffId, item_key: itemKey, ...data });
  }

  // Bi-directional sync: if this item has a linked parent, sync to parent too
  const currentDef = COMPLIANCE_ITEMS.find((i) => i.item_key === itemKey);
  if (currentDef?.linked_to) {
    const parentKey = currentDef.linked_to;
    const { data: parentExisting } = await supabase
      .from("staff_compliance_items")
      .select("id")
      .eq("staff_id", staffId)
      .eq("item_key", parentKey)
      .maybeSingle();
    if (parentExisting) {
      await supabase
        .from("staff_compliance_items")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", parentExisting.id);
    } else {
      await supabase
        .from("staff_compliance_items")
        .insert({ staff_id: staffId, item_key: parentKey, ...data });
    }
  }

  // Also sync parent → children
  const linkedChildren = COMPLIANCE_ITEMS.filter((i) => i.linked_to === itemKey);
  for (const child of linkedChildren) {
    const { data: childExisting } = await supabase
      .from("staff_compliance_items")
      .select("id")
      .eq("staff_id", staffId)
      .eq("item_key", child.item_key)
      .maybeSingle();
    if (childExisting) {
      await supabase
        .from("staff_compliance_items")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", childExisting.id);
    } else {
      await supabase
        .from("staff_compliance_items")
        .insert({ staff_id: staffId, item_key: child.item_key, ...data });
    }
  }
}

/** Calculate expiry date from a completion date and expiry_months */
export function calcExpiryDate(completionDate: string, expiryMonths: number): string {
  const d = new Date(completionDate);
  d.setMonth(d.getMonth() + expiryMonths);
  return d.toISOString().slice(0, 10);
}

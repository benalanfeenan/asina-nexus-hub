
-- 1. Add columns to staff table
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- 2. compliance_item_definitions table
CREATE TABLE public.compliance_item_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  requires_document boolean NOT NULL DEFAULT true,
  has_expiry boolean NOT NULL DEFAULT false,
  expiry_months integer,
  is_mandatory boolean NOT NULL DEFAULT true,
  conditional_on text,
  linked_to text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.compliance_item_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view compliance_item_definitions" ON public.compliance_item_definitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage compliance_item_definitions" ON public.compliance_item_definitions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. staff_compliance_items table
CREATE TABLE public.staff_compliance_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  item_key text NOT NULL,
  status text NOT NULL DEFAULT 'not_started',
  date_completed date,
  expiry_date date,
  document_url text,
  verified_by uuid,
  verified_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(staff_id, item_key)
);

ALTER TABLE public.staff_compliance_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view staff_compliance_items" ON public.staff_compliance_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert staff_compliance_items" ON public.staff_compliance_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can manage staff_compliance_items" ON public.staff_compliance_items FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "HM can manage staff_compliance_items" ON public.staff_compliance_items FOR ALL USING (has_role(auth.uid(), 'house_manager'::app_role));

-- 4. staff_role_flags table
CREATE TABLE public.staff_role_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE UNIQUE,
  administers_medication boolean NOT NULL DEFAULT false,
  supports_mealtime_assessed boolean NOT NULL DEFAULT false,
  supports_bsp_participants boolean NOT NULL DEFAULT false,
  delivers_high_intensity boolean NOT NULL DEFAULT false,
  uses_restrictive_practices boolean NOT NULL DEFAULT false,
  transports_participants boolean NOT NULL DEFAULT false,
  supports_under_18 boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_role_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view staff_role_flags" ON public.staff_role_flags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert staff_role_flags" ON public.staff_role_flags FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can manage staff_role_flags" ON public.staff_role_flags FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "HM can manage staff_role_flags" ON public.staff_role_flags FOR ALL USING (has_role(auth.uid(), 'house_manager'::app_role));

-- 5. Seed the 41 compliance item definitions
INSERT INTO public.compliance_item_definitions (item_key, name, description, category, requires_document, has_expiry, expiry_months, is_mandatory, conditional_on, linked_to, display_order) VALUES
-- Pre-Employment
('ndis_wsc', 'NDIS Worker Screening Check (Cleared)', 'NDIS Worker Screening Check must be cleared before participant contact', 'Pre-Employment', true, true, 60, true, null, null, 1),
('wwcc', 'Working With Children Check', 'Required if supporting participants under 18', 'Pre-Employment', true, true, 60, true, 'supports_under_18', null, 2),
('right_to_work', 'Right to Work in Australia Verification', 'Verification of right to work in Australia', 'Pre-Employment', true, false, null, true, null, null, 3),
('reference_check_1', 'Reference Check 1 (completed)', 'First professional reference check completed', 'Pre-Employment', true, false, null, true, null, null, 4),
('reference_check_2', 'Reference Check 2 (completed)', 'Second professional reference check completed', 'Pre-Employment', true, false, null, true, null, null, 5),
('qualifications', 'Qualifications Verified (Cert III/IV or equivalent)', 'Qualifications verified', 'Pre-Employment', true, false, null, true, null, null, 6),
('drivers_licence', 'Current Drivers Licence', 'Required if transporting participants', 'Pre-Employment', true, true, 12, true, 'transports_participants', null, 7),
('vehicle_rego_insurance', 'Vehicle Registration and Insurance', 'Required if transporting participants', 'Pre-Employment', true, true, 12, true, 'transports_participants', null, 8),
-- Induction
('ndis_orientation', 'NDIS Worker Orientation Module Certificate', 'Completion of NDIS Worker Orientation Module', 'Induction', true, false, null, true, null, null, 9),
('employment_contract', 'Signed Employment Contract', 'Signed employment contract on file', 'Induction', true, false, null, true, null, null, 10),
('position_description', 'Position Description Acknowledged', 'Position description acknowledged and signed', 'Induction', true, false, null, true, null, null, 11),
('code_of_conduct', 'Code of Conduct Acknowledgement Signed', 'Code of conduct signed', 'Induction', true, false, null, true, null, null, 12),
('confidentiality_agreement', 'Confidentiality Agreement Signed', 'Confidentiality agreement signed', 'Induction', true, false, null, true, null, null, 13),
('coi_declaration', 'Conflict of Interest Declaration Completed', 'COI declaration completed', 'Induction', true, false, null, true, null, null, 14),
('induction_checklist', 'Staff Induction Checklist Completed and Signed', 'Full induction checklist completed', 'Induction', true, false, null, true, null, null, 15),
('whs_induction', 'WHS Induction Completed', 'Work health and safety induction completed', 'Induction', true, false, null, true, null, null, 16),
('first_aid', 'First Aid Certificate (HLTAID011)', 'Current first aid certificate', 'Induction', true, true, 36, true, null, null, 17),
('cpr', 'CPR Certificate (HLTAID009)', 'Current CPR certificate', 'Induction', true, true, 12, true, null, null, 18),
('manual_handling', 'Manual Handling Training', 'Manual handling training completed', 'Induction', true, true, 12, true, null, null, 19),
('infection_control', 'Infection Prevention and Control Training', 'Infection control training completed', 'Induction', true, true, 12, true, null, null, 20),
('fire_safety', 'Fire Safety and Evacuation Training', 'Fire safety training completed', 'Induction', true, true, 12, true, null, null, 21),
('incident_reporting', 'Incident Reporting Training', 'Incident reporting training completed', 'Induction', true, false, null, true, null, null, 22),
('code_of_conduct_training', 'NDIS Code of Conduct Training', 'NDIS Code of Conduct training completed', 'Induction', true, false, null, true, null, null, 23),
('participant_rights', 'Participant Rights and Dignity of Risk Training', 'Participant rights training completed', 'Induction', true, false, null, true, null, null, 24),
('policies_orientation', 'Organisational Policies and Procedures Orientation', 'Policies orientation completed', 'Induction', true, false, null, true, null, null, 25),
-- Role-Specific
('medication_training', 'Medication Administration Training', 'Medication administration training', 'Role-Specific', true, true, 12, true, 'administers_medication', null, 26),
('medication_competency', 'Medication Competency Assessment (passed)', 'Medication competency assessment passed', 'Role-Specific', true, true, 12, true, 'administers_medication', null, 27),
('mealtime_training', 'Mealtime Management Training', 'Mealtime management training', 'Role-Specific', true, true, 12, true, 'supports_mealtime_assessed', null, 28),
('mealtime_competency', 'Mealtime Competency Assessment (passed)', 'Mealtime competency assessment passed', 'Role-Specific', true, true, 12, true, 'supports_mealtime_assessed', null, 29),
('bsp_training', 'Behaviour Support Plan Training (participant-specific)', 'BSP training completed', 'Role-Specific', true, false, null, true, 'supports_bsp_participants', null, 30),
('restrictive_practice_training', 'Restrictive Practice Training', 'Restrictive practice training completed', 'Role-Specific', true, false, null, true, 'uses_restrictive_practices', null, 31),
('high_intensity_training', 'High Intensity Support Training', 'High intensity support training', 'Role-Specific', true, true, 12, true, 'delivers_high_intensity', null, 32),
('high_intensity_competency', 'High Intensity Skills Competency Assessment (passed)', 'High intensity competency passed', 'Role-Specific', true, true, 12, true, 'delivers_high_intensity', null, 33),
-- Ongoing
('cpr_refresher', 'CPR Refresher (annual)', 'Annual CPR refresher', 'Ongoing', true, true, 12, true, null, 'cpr', 34),
('first_aid_renewal', 'First Aid Renewal', 'First aid certificate renewal', 'Ongoing', true, true, 36, true, null, 'first_aid', 35),
('ndis_wsc_renewal', 'NDIS WSC Renewal', 'NDIS Worker Screening Check renewal', 'Ongoing', true, true, 60, true, null, 'ndis_wsc', 36),
('infection_control_refresher', 'Infection Control Refresher (annual)', 'Annual infection control refresher', 'Ongoing', true, true, 12, true, null, null, 37),
('fire_safety_refresher', 'Fire Safety Refresher (annual)', 'Annual fire safety refresher', 'Ongoing', true, true, 12, true, null, null, 38),
('manual_handling_refresher', 'Manual Handling Refresher (annual)', 'Annual manual handling refresher', 'Ongoing', true, true, 12, true, null, null, 39),
('supervision_records', 'Regular Supervision Records on File', 'At least 1 supervision record in last 3 months', 'Ongoing', true, false, null, true, null, null, 40),
('performance_review', 'Annual Performance Review Completed', 'Annual performance review completed', 'Ongoing', true, true, 12, true, null, null, 41);

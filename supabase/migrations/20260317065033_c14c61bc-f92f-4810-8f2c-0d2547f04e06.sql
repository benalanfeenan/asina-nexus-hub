
-- Phase 1/2 CRITICAL tables

-- 1. Feedback Register
CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  type text NOT NULL DEFAULT 'compliment',
  source text,
  description text NOT NULL,
  action_taken text,
  status text NOT NULL DEFAULT 'open',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage feedback" ON public.feedback FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view feedback" ON public.feedback FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert feedback" ON public.feedback FOR INSERT TO authenticated WITH CHECK (true);

-- 2. Incident Follow-Ups (5-day reports)
CREATE TABLE public.incident_follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  follow_up_date date NOT NULL DEFAULT CURRENT_DATE,
  submitted_to_commission boolean DEFAULT false,
  content text NOT NULL,
  submitted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.incident_follow_ups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage incident_follow_ups" ON public.incident_follow_ups FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view incident_follow_ups" ON public.incident_follow_ups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert incident_follow_ups" ON public.incident_follow_ups FOR INSERT TO authenticated WITH CHECK (true);

-- 3. Incident Witness Statements
CREATE TABLE public.incident_witness_statements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  witness_name text NOT NULL,
  statement text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  signed boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.incident_witness_statements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage incident_witness_statements" ON public.incident_witness_statements FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view incident_witness_statements" ON public.incident_witness_statements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert incident_witness_statements" ON public.incident_witness_statements FOR INSERT TO authenticated WITH CHECK (true);

-- 4. Incident Debriefs
CREATE TABLE public.incident_debriefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  attendees text,
  lessons_identified text,
  actions text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.incident_debriefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage incident_debriefs" ON public.incident_debriefs FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view incident_debriefs" ON public.incident_debriefs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert incident_debriefs" ON public.incident_debriefs FOR INSERT TO authenticated WITH CHECK (true);

-- 5. ABC Data Sheets
CREATE TABLE public.abc_data_sheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  date timestamptz NOT NULL DEFAULT now(),
  antecedent text NOT NULL,
  behaviour text NOT NULL,
  consequence text NOT NULL,
  staff_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.abc_data_sheets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage abc_data_sheets" ON public.abc_data_sheets FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view abc_data_sheets" ON public.abc_data_sheets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert abc_data_sheets" ON public.abc_data_sheets FOR INSERT TO authenticated WITH CHECK (true);

-- 6. Monthly Restrictive Practice Reports
CREATE TABLE public.restrictive_practice_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month integer NOT NULL,
  year integer NOT NULL,
  submitted_date date,
  submitted_by uuid,
  report_url text,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.restrictive_practice_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage rp_reports" ON public.restrictive_practice_reports FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view rp_reports" ON public.restrictive_practice_reports FOR SELECT TO authenticated USING (true);

-- 7. Fire Drills
CREATE TABLE public.fire_drills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sil_house_id uuid NOT NULL REFERENCES public.sil_houses(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  participants_count integer,
  staff_present text,
  evacuation_time_seconds integer,
  issues text,
  actions text,
  next_due date,
  conducted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fire_drills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage fire_drills" ON public.fire_drills FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "HM can manage fire_drills" ON public.fire_drills FOR ALL USING (has_role(auth.uid(), 'house_manager'));
CREATE POLICY "Authenticated can view fire_drills" ON public.fire_drills FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert fire_drills" ON public.fire_drills FOR INSERT TO authenticated WITH CHECK (true);

-- 8. Fire Equipment Tests
CREATE TABLE public.fire_equipment_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sil_house_id uuid NOT NULL REFERENCES public.sil_houses(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  equipment_type text NOT NULL,
  result text NOT NULL DEFAULT 'pass',
  actions text,
  tested_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fire_equipment_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage fire_equipment_tests" ON public.fire_equipment_tests FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "HM can manage fire_equipment_tests" ON public.fire_equipment_tests FOR ALL USING (has_role(auth.uid(), 'house_manager'));
CREATE POLICY "Authenticated can view fire_equipment_tests" ON public.fire_equipment_tests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert fire_equipment_tests" ON public.fire_equipment_tests FOR INSERT TO authenticated WITH CHECK (true);

-- 9. Daily House Logs
CREATE TABLE public.daily_house_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sil_house_id uuid NOT NULL REFERENCES public.sil_houses(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  content text NOT NULL,
  staff_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.daily_house_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage daily_house_logs" ON public.daily_house_logs FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "HM can manage daily_house_logs" ON public.daily_house_logs FOR ALL USING (has_role(auth.uid(), 'house_manager'));
CREATE POLICY "Authenticated can view daily_house_logs" ON public.daily_house_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert daily_house_logs" ON public.daily_house_logs FOR INSERT TO authenticated WITH CHECK (true);

-- 10. Medication Errors
CREATE TABLE public.medication_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  medication_id uuid REFERENCES public.medications(id),
  date timestamptz NOT NULL DEFAULT now(),
  error_type text NOT NULL,
  description text NOT NULL,
  actions_taken text,
  reported_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.medication_errors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage medication_errors" ON public.medication_errors FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view medication_errors" ON public.medication_errors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert medication_errors" ON public.medication_errors FOR INSERT TO authenticated WITH CHECK (true);

-- 11. Medication Audits
CREATE TABLE public.medication_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sil_house_id uuid NOT NULL REFERENCES public.sil_houses(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  auditor_id uuid,
  findings text,
  actions text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.medication_audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage medication_audits" ON public.medication_audits FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view medication_audits" ON public.medication_audits FOR SELECT TO authenticated USING (true);

-- 12. Workplace Inspections
CREATE TABLE public.workplace_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sil_house_id uuid NOT NULL REFERENCES public.sil_houses(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  inspector_id uuid,
  findings text,
  actions text,
  status text NOT NULL DEFAULT 'pending',
  next_due date,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.workplace_inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage workplace_inspections" ON public.workplace_inspections FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "HM can manage workplace_inspections" ON public.workplace_inspections FOR ALL USING (has_role(auth.uid(), 'house_manager'));
CREATE POLICY "Authenticated can view workplace_inspections" ON public.workplace_inspections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert workplace_inspections" ON public.workplace_inspections FOR INSERT TO authenticated WITH CHECK (true);

-- 13. Add outcome letter fields to complaints
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS outcome_letter_url text;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS outcome_letter_date date;


CREATE TABLE public.scheduler_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES public.participants(id) ON DELETE SET NULL,
  sil_house_id uuid REFERENCES public.sil_houses(id) ON DELETE SET NULL,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  service_type text NOT NULL DEFAULT 'SIL',
  status text NOT NULL DEFAULT 'draft',
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduler_shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view scheduler_shifts"
  ON public.scheduler_shifts FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert scheduler_shifts"
  ON public.scheduler_shifts FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage scheduler_shifts"
  ON public.scheduler_shifts FOR ALL TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "HM can manage scheduler_shifts"
  ON public.scheduler_shifts FOR ALL TO public
  USING (has_role(auth.uid(), 'house_manager'::app_role));

CREATE INDEX idx_scheduler_shifts_staff_date ON public.scheduler_shifts(staff_id, date);
CREATE INDEX idx_scheduler_shifts_date ON public.scheduler_shifts(date);

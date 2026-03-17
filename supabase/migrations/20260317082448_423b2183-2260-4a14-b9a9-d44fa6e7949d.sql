
CREATE TABLE public.sil_house_competency_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sil_house_id uuid NOT NULL REFERENCES public.sil_houses(id) ON DELETE CASCADE,
  administers_medication boolean NOT NULL DEFAULT false,
  supports_mealtime_assessed boolean NOT NULL DEFAULT false,
  supports_bsp_participants boolean NOT NULL DEFAULT false,
  delivers_high_intensity boolean NOT NULL DEFAULT false,
  uses_restrictive_practices boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(sil_house_id)
);

ALTER TABLE public.sil_house_competency_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view sil_house_competency_requirements"
  ON public.sil_house_competency_requirements FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage sil_house_competency_requirements"
  ON public.sil_house_competency_requirements FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "HM can manage sil_house_competency_requirements"
  ON public.sil_house_competency_requirements FOR ALL USING (has_role(auth.uid(), 'house_manager'::app_role));

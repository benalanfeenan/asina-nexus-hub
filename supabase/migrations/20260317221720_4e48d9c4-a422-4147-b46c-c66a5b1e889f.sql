
ALTER TABLE public.participant_transitions ADD COLUMN IF NOT EXISTS document_url text;
ALTER TABLE public.internal_audits ADD COLUMN IF NOT EXISTS document_url text;
ALTER TABLE public.safeguarding_concerns ADD COLUMN IF NOT EXISTS document_url text;
ALTER TABLE public.participant_surveys ADD COLUMN IF NOT EXISTS document_url text;

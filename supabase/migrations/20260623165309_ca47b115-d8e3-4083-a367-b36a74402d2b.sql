
-- Sections enum
CREATE TYPE public.section_kind AS ENUM ('subject','action','space','camera','light','mood','style','technical','negative');

-- Chunks table
CREATE TABLE public.chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  section public.section_kind NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  platforms TEXT[] NOT NULL DEFAULT '{}',
  images TEXT[] NOT NULL DEFAULT '{}',
  memo TEXT,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX chunks_section_idx ON public.chunks(section);
CREATE INDEX chunks_created_at_idx ON public.chunks(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chunks TO anon, authenticated;
GRANT ALL ON public.chunks TO service_role;
ALTER TABLE public.chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Single-user open access on chunks" ON public.chunks FOR ALL USING (true) WITH CHECK (true);

-- Prompt sets
CREATE TABLE public.prompt_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'universal',
  sections JSONB NOT NULL DEFAULT '{}'::jsonb,
  compiled_text TEXT NOT NULL DEFAULT '',
  result_images TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX prompt_sets_created_at_idx ON public.prompt_sets(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.prompt_sets TO anon, authenticated;
GRANT ALL ON public.prompt_sets TO service_role;
ALTER TABLE public.prompt_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Single-user open access on prompt_sets" ON public.prompt_sets FOR ALL USING (true) WITH CHECK (true);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER chunks_set_updated_at BEFORE UPDATE ON public.chunks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER prompt_sets_set_updated_at BEFORE UPDATE ON public.prompt_sets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

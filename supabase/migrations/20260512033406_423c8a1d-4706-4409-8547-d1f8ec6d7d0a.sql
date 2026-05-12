-- Add pipeline_stage column to companies
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS pipeline_stage TEXT;

-- Create an index for faster filtering by stage
CREATE INDEX IF NOT EXISTS idx_companies_pipeline_stage ON public.companies (pipeline_stage);

-- Add a comment to describe the column
COMMENT ON COLUMN public.companies.pipeline_stage IS 'Current stage of the lead in the sales funnel (e.g., Novo Lead, Contato Iniciado, etc.)';
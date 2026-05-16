
CREATE TABLE public.serpapi_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  api_key text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.serpapi_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own serpapi config"
ON public.serpapi_config FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own serpapi config"
ON public.serpapi_config FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own serpapi config"
ON public.serpapi_config FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own serpapi config"
ON public.serpapi_config FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_serpapi_config_updated_at
BEFORE UPDATE ON public.serpapi_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

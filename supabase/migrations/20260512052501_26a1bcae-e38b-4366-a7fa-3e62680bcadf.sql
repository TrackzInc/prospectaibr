-- Create evolution_config table
CREATE TABLE IF NOT EXISTS public.evolution_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    api_url TEXT NOT NULL,
    api_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Enable RLS for evolution_config
ALTER TABLE public.evolution_config ENABLE ROW LEVEL SECURITY;

-- Create policies for evolution_config
CREATE POLICY "Users can view their own evolution config" ON public.evolution_config
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own evolution config" ON public.evolution_config
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own evolution config" ON public.evolution_config
    FOR UPDATE USING (auth.uid() = user_id);

-- Create whatsapp_instances table
CREATE TABLE IF NOT EXISTS public.whatsapp_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    instance_name TEXT NOT NULL,
    instance_id TEXT, -- The ID from Evolution API
    status TEXT DEFAULT 'disconnected',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for whatsapp_instances
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;

-- Create policies for whatsapp_instances
CREATE POLICY "Users can view their own whatsapp instances" ON public.whatsapp_instances
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own whatsapp instances" ON public.whatsapp_instances
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own whatsapp instances" ON public.whatsapp_instances
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own whatsapp instances" ON public.whatsapp_instances
    FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER set_updated_at_evolution_config
    BEFORE UPDATE ON public.evolution_config
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER set_updated_at_whatsapp_instances
    BEFORE UPDATE ON public.whatsapp_instances
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();
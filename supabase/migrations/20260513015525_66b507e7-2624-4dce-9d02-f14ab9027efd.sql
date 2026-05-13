-- Create robot_config table
CREATE TABLE IF NOT EXISTS public.robot_config (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    is_active BOOLEAN DEFAULT false,
    assistant_name TEXT NOT NULL DEFAULT 'Assistente',
    objective TEXT NOT NULL DEFAULT 'Qualificar lead',
    business_context TEXT,
    specific_instructions TEXT,
    delay_minutes INTEGER DEFAULT 2,
    working_hours_enabled BOOLEAN DEFAULT true,
    work_start_time TIME DEFAULT '09:00',
    work_end_time TIME DEFAULT '18:00',
    work_days INTEGER[] DEFAULT '{1,2,3,4,5}', -- 1=Monday, 7=Sunday
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create robot_logs table
CREATE TABLE IF NOT EXISTS public.robot_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    received_message TEXT NOT NULL,
    sent_response TEXT,
    status TEXT DEFAULT 'automatic' CHECK (status IN ('automatic', 'transferred', 'error')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.robot_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.robot_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own robot_config" ON public.robot_config FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own robot_logs" ON public.robot_logs FOR ALL USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_robot_config_updated_at BEFORE UPDATE ON public.robot_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create schedules table
CREATE TABLE IF NOT EXISTS public.schedules (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    recurrence TEXT DEFAULT 'once' CHECK (recurrence IN ('once', 'daily', 'weekly', 'monthly')),
    recurrence_days INTEGER[], -- Array of days (0-6 for weekly, 1-31 for monthly)
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Create policies for schedules
CREATE POLICY "Users can manage their own schedules"
ON public.schedules
FOR ALL
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_schedules_updated_at
BEFORE UPDATE ON public.schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

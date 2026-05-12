-- Create campaigns table
CREATE TABLE public.campaigns (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Active', 'Paused', 'Completed', 'Draft')),
    message_template TEXT NOT NULL,
    delay_seconds INTEGER NOT NULL DEFAULT 60,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    total_leads INTEGER NOT NULL DEFAULT 0,
    sent_leads INTEGER NOT NULL DEFAULT 0,
    failed_leads INTEGER NOT NULL DEFAULT 0,
    pending_leads INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaign_logs table
CREATE TABLE public.campaign_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Sent', 'Failed', 'Pending')),
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for campaigns
CREATE POLICY "Users can view their own campaigns" 
ON public.campaigns FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own campaigns" 
ON public.campaigns FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns" 
ON public.campaigns FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns" 
ON public.campaigns FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for campaign_logs
CREATE POLICY "Users can view logs of their campaigns" 
ON public.campaign_logs FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE id = campaign_id AND user_id = auth.uid()
));

CREATE POLICY "Users can insert logs for their campaigns" 
ON public.campaign_logs FOR INSERT 
WITH CHECK (EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE id = campaign_id AND user_id = auth.uid()
));

CREATE POLICY "Users can update logs for their campaigns" 
ON public.campaign_logs FOR UPDATE 
USING (EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE id = campaign_id AND user_id = auth.uid()
));

-- Trigger for updated_at
CREATE TRIGGER update_campaigns_updated_at
BEFORE UPDATE ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

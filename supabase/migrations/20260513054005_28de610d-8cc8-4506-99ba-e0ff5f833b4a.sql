-- Add crm_synced column to companies table
ALTER TABLE public.companies 
ADD COLUMN crm_synced BOOLEAN DEFAULT false;

-- Update existing companies that are already in contacts with ProspectAI origin
UPDATE public.companies c
SET crm_synced = true
WHERE EXISTS (
    SELECT 1 FROM public.contacts con 
    WHERE con.user_id = c.user_id 
    AND con.name = c.name 
    AND con.origin = 'ProspectAI'
);

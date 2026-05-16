
-- Recreate ALL policies to include WITH CHECK
DROP POLICY IF EXISTS "Users can manage their own lead_tags" ON public.lead_tags;
CREATE POLICY "Users can manage their own lead_tags" ON public.lead_tags
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own robot_config" ON public.robot_config;
CREATE POLICY "Users can manage their own robot_config" ON public.robot_config
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own robot_logs" ON public.robot_logs;
CREATE POLICY "Users can manage their own robot_logs" ON public.robot_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own schedules" ON public.schedules;
CREATE POLICY "Users can manage their own schedules" ON public.schedules
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own messages" ON public.messages;
CREATE POLICY "Users can manage their own messages" ON public.messages
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own leads" ON public.leads;
CREATE POLICY "Users can manage their own leads" ON public.leads
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own tags" ON public.tags;
CREATE POLICY "Users can manage their own tags" ON public.tags
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Add DELETE policy for evolution_config
CREATE POLICY "Users can delete their own evolution config" ON public.evolution_config
  FOR DELETE USING (auth.uid() = user_id);

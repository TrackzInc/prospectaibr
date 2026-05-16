-- Re-create all RLS policies to ensure strict user_id checking

-- Companies
DROP POLICY IF EXISTS "Users can manage their own companies" ON companies;
CREATE POLICY "Users can manage their own companies" ON companies
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Contacts
DROP POLICY IF EXISTS "Users can create their own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can view their own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can update their own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can delete their own contacts" ON contacts;
CREATE POLICY "Users can view their own contacts" ON contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own contacts" ON contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own contacts" ON contacts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own contacts" ON contacts FOR DELETE USING (auth.uid() = user_id);

-- Search History
DROP POLICY IF EXISTS "Users can view their own search history" ON search_history;
DROP POLICY IF EXISTS "Users can insert their own search history" ON search_history;
DROP POLICY IF EXISTS "Users can delete their own search history" ON search_history;
CREATE POLICY "Users can view their own search history" ON search_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own search history" ON search_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own search history" ON search_history FOR DELETE USING (auth.uid() = user_id);

-- Evolution Config
DROP POLICY IF EXISTS "Users can view their own evolution config" ON evolution_config;
DROP POLICY IF EXISTS "Users can insert their own evolution config" ON evolution_config;
DROP POLICY IF EXISTS "Users can update their own evolution config" ON evolution_config;
DROP POLICY IF EXISTS "Users can delete their own evolution config" ON evolution_config;
CREATE POLICY "Users can view their own evolution config" ON evolution_config FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own evolution config" ON evolution_config FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own evolution config" ON evolution_config FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own evolution config" ON evolution_config FOR DELETE USING (auth.uid() = user_id);

-- WhatsApp Instances
DROP POLICY IF EXISTS "Users can view their own whatsapp instances" ON whatsapp_instances;
DROP POLICY IF EXISTS "Users can insert their own whatsapp instances" ON whatsapp_instances;
DROP POLICY IF EXISTS "Users can update their own whatsapp instances" ON whatsapp_instances;
DROP POLICY IF EXISTS "Users can delete their own whatsapp instances" ON whatsapp_instances;
CREATE POLICY "Users can view their own whatsapp instances" ON whatsapp_instances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own whatsapp instances" ON whatsapp_instances FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own whatsapp instances" ON whatsapp_instances FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own whatsapp instances" ON whatsapp_instances FOR DELETE USING (auth.uid() = user_id);

-- Campaigns
DROP POLICY IF EXISTS "Users can view their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can create their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can update their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can delete their own campaigns" ON campaigns;
CREATE POLICY "Users can view their own campaigns" ON campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own campaigns" ON campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own campaigns" ON campaigns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own campaigns" ON campaigns FOR DELETE USING (auth.uid() = user_id);

-- Lead Tags
DROP POLICY IF EXISTS "Users can manage their own lead_tags" ON lead_tags;
CREATE POLICY "Users can manage their own lead_tags" ON lead_tags
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Leads
DROP POLICY IF EXISTS "Users can manage their own leads" ON leads;
CREATE POLICY "Users can manage their own leads" ON leads
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Messages
DROP POLICY IF EXISTS "Users can manage their own messages" ON messages;
CREATE POLICY "Users can manage their own messages" ON messages
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Robot Config
DROP POLICY IF EXISTS "Users can manage their own robot_config" ON robot_config;
CREATE POLICY "Users can manage their own robot_config" ON robot_config
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Robot Logs
DROP POLICY IF EXISTS "Users can manage their own robot_logs" ON robot_logs;
CREATE POLICY "Users can manage their own robot_logs" ON robot_logs
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Schedules
DROP POLICY IF EXISTS "Users can manage their own schedules" ON schedules;
CREATE POLICY "Users can manage their own schedules" ON schedules
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Scripts
DROP POLICY IF EXISTS "Users can view their own scripts" ON scripts;
DROP POLICY IF EXISTS "Users can create their own scripts" ON scripts;
DROP POLICY IF EXISTS "Users can update their own scripts" ON scripts;
DROP POLICY IF EXISTS "Users can delete their own scripts" ON scripts;
CREATE POLICY "Users can view their own scripts" ON scripts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own scripts" ON scripts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own scripts" ON scripts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own scripts" ON scripts FOR DELETE USING (auth.uid() = user_id);

-- Tags
DROP POLICY IF EXISTS "Users can manage their own tags" ON tags;
CREATE POLICY "Users can manage their own tags" ON tags
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- SerpApi Config
DROP POLICY IF EXISTS "Users can view their own serpapi config" ON serpapi_config;
DROP POLICY IF EXISTS "Users can insert their own serpapi config" ON serpapi_config;
DROP POLICY IF EXISTS "Users can update their own serpapi config" ON serpapi_config;
DROP POLICY IF EXISTS "Users can delete their own serpapi config" ON serpapi_config;
CREATE POLICY "Users can view their own serpapi config" ON serpapi_config FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own serpapi config" ON serpapi_config FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own serpapi config" ON serpapi_config FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own serpapi config" ON serpapi_config FOR DELETE USING (auth.uid() = user_id);

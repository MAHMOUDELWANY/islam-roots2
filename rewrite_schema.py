import re

with open('supabase/schema.sql', 'r') as f:
    schema = f.read()

# Replace the is_super_admin function
new_func = """
-- Helper function to check super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teachers WHERE id = auth.uid() AND is_super_admin = true
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;
"""

schema = re.sub(
    r"-- Helper function to check super admin.*?SECURITY DEFINER;",
    new_func.strip(),
    schema,
    flags=re.DOTALL
)

# Remove all existing policies
schema = re.sub(r"-- RLS Policies.*?(?=-- Enable Realtime publication)", "-- RLS Policies\n\n", schema, flags=re.DOTALL)

# Add new policies
new_policies = """
-- RLS Policies for Teachers
-- 1. Select: A teacher can read their own profile, super admin can read all
CREATE POLICY "Teachers select policy" ON teachers
  FOR SELECT USING (id = auth.uid() OR is_super_admin());

-- 2. Insert: User can create their own profile. is_super_admin MUST be false unless created by server (service role bypasses RLS)
-- Since RLS policies apply, users can only insert if id = auth.uid() and is_super_admin = false
CREATE POLICY "Teachers insert policy" ON teachers
  FOR INSERT WITH CHECK (id = auth.uid() AND is_super_admin = false);

-- 3. Update: User can update own profile, but cannot change is_super_admin, email, or id.
-- Note: Supabase's `auth.uid()` cannot be spoofed, so they can only update their row.
-- We use a trigger or purely restrict columns. PostgreSQL doesn't have column-level RLS exactly in the way we want without triggers.
-- But we can do: `WITH CHECK` on the fields we want to lock?
-- Wait, `WITH CHECK` applies to the whole row AFTER update. But we can't easily compare OLD vs NEW in a standard policy for specific columns,
-- unless we use a BEFORE UPDATE trigger.
"""

# Let's write the trigger approach for Teachers table update.

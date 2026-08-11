import re

tables = [
    "students",
    "curriculums",
    "student_curriculums",
    "lesson_sessions",
    "memory_detective_sessions",
    "saved_ai_content",
    "schedules",
    "notifications",
    "progress_records"
]

with open('supabase/schema.sql', 'r') as f:
    schema = f.read()

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
    r"-- Helper function to check super admin.*?SECURITY DEFINER SET search_path = public;",
    new_func.strip(),
    schema,
    flags=re.DOTALL
)

# Remove all existing policies
schema = re.sub(r"-- RLS Policies.*?(?=-- Enable Realtime publication)", "-- RLS Policies\n\n", schema, flags=re.DOTALL)

policies = """
-- RLS Policies for Teachers
CREATE POLICY "Teachers select policy" ON teachers
  FOR SELECT USING (id = auth.uid() OR is_super_admin());

CREATE POLICY "Teachers insert policy" ON teachers
  FOR INSERT WITH CHECK (id = auth.uid() AND is_super_admin = false);

CREATE POLICY "Teachers update policy" ON teachers
  FOR UPDATE USING (id = auth.uid() OR is_super_admin())
  WITH CHECK (id = auth.uid() OR is_super_admin());

CREATE POLICY "Teachers delete policy" ON teachers
  FOR DELETE USING (id = auth.uid() OR is_super_admin());

-- Trigger to prevent privilege escalation on Teachers table
CREATE OR REPLACE FUNCTION check_teacher_update()
RETURNS trigger AS $$
BEGIN
  IF NEW.id <> OLD.id THEN
    RAISE EXCEPTION 'Cannot change teacher id';
  END IF;

  IF NEW.email <> OLD.email THEN
    RAISE EXCEPTION 'Cannot change teacher email';
  END IF;

  IF NEW.is_super_admin <> OLD.is_super_admin THEN
    -- Allow bypass if performed by service_role or postgres (server-side admin claims)
    -- Also allow if the user is ALREADY a super_admin.
    IF NOT is_super_admin() AND current_user NOT IN ('service_role', 'postgres', 'supabase_admin') THEN
      RAISE EXCEPTION 'Cannot change is_super_admin privilege';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_check_teacher_update ON teachers;
CREATE TRIGGER tr_check_teacher_update
BEFORE UPDATE ON teachers
FOR EACH ROW
EXECUTE FUNCTION check_teacher_update();

"""

for table in tables:
    policies += f"""
-- RLS Policies for {table}
CREATE POLICY "{table.capitalize()} select policy" ON {table}
  FOR SELECT USING (teacher_id = auth.uid() OR is_super_admin());

CREATE POLICY "{table.capitalize()} insert policy" ON {table}
  FOR INSERT WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "{table.capitalize()} update policy" ON {table}
  FOR UPDATE USING (teacher_id = auth.uid() OR is_super_admin())
  WITH CHECK (teacher_id = auth.uid() OR is_super_admin());

CREATE POLICY "{table.capitalize()} delete policy" ON {table}
  FOR DELETE USING (teacher_id = auth.uid() OR is_super_admin());
"""

schema = schema.replace("-- RLS Policies\n\n", "-- RLS Policies\n\n" + policies + "\n\n")

with open('supabase/schema.sql', 'w') as f:
    f.write(schema)

with open('migration.sql', 'w') as f:
    f.write(new_func.strip() + "\n\n")
    f.write("DROP POLICY IF EXISTS \"Teachers access policy\" ON teachers;\n")
    for table in tables:
        f.write(f"DROP POLICY IF EXISTS \"{table.replace('_', ' ').title()} access policy\" ON {table};\n")
        f.write(f"DROP POLICY IF EXISTS \"{table.replace('_', ' ').capitalize()} access policy\" ON {table};\n")
        f.write(f"DROP POLICY IF EXISTS \"{table.title()} access policy\" ON {table};\n")
        f.write(f"DROP POLICY IF EXISTS \"{table.capitalize()} access policy\" ON {table};\n")
    f.write(policies)


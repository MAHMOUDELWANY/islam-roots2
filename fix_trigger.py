import re

with open('supabase/schema.sql', 'r') as f:
    schema = f.read()

new_trigger = """
CREATE OR REPLACE FUNCTION check_teacher_update()
RETURNS trigger AS $$
DECLARE
  current_role_name text;
BEGIN
  IF NEW.id <> OLD.id THEN
    RAISE EXCEPTION 'Cannot change teacher id';
  END IF;

  IF NEW.email <> OLD.email THEN
    RAISE EXCEPTION 'Cannot change teacher email';
  END IF;

  IF NEW.is_super_admin <> OLD.is_super_admin THEN
    -- Check if it's the service role or a true super admin
    BEGIN
      current_role_name := current_setting('role');
    EXCEPTION WHEN OTHERS THEN
      current_role_name := '';
    END;
    
    IF NOT is_super_admin() AND current_role_name NOT IN ('service_role', 'postgres', 'supabase_admin') THEN
      RAISE EXCEPTION 'Cannot change is_super_admin privilege';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
"""

schema = re.sub(
    r"CREATE OR REPLACE FUNCTION check_teacher_update\(\).*?LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;",
    new_trigger.strip(),
    schema,
    flags=re.DOTALL
)

with open('supabase/schema.sql', 'w') as f:
    f.write(schema)

# Do the same for migration.sql
with open('migration.sql', 'r') as f:
    mig = f.read()

mig = re.sub(
    r"CREATE OR REPLACE FUNCTION check_teacher_update\(\).*?LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;",
    new_trigger.strip(),
    mig,
    flags=re.DOTALL
)

with open('migration.sql', 'w') as f:
    f.write(mig)


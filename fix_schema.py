import re

with open('supabase/schema.sql', 'r') as f:
    schema = f.read()

replacement = """
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  name TEXT NOT NULL DEFAULT 'Ustadh',
"""

schema = re.sub(
    r"  id UUID PRIMARY KEY REFERENCES auth\.users\(id\) ON DELETE CASCADE,\n  name TEXT NOT NULL DEFAULT 'Ustadh',",
    replacement.strip("\n"),
    schema
)

with open('supabase/schema.sql', 'w') as f:
    f.write(schema)

# And add to migration
with open('migration.sql', 'r') as f:
    mig = f.read()

mig_add = """
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
"""

with open('migration.sql', 'w') as f:
    f.write(mig_add + "\n" + mig)


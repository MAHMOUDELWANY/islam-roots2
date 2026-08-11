import re

with open('supabase/schema.sql', 'r') as f:
    schema = f.read()

schema = re.sub(
    r"  email TEXT NOT NULL,",
    "  email TEXT,",
    schema
)

with open('supabase/schema.sql', 'w') as f:
    f.write(schema)


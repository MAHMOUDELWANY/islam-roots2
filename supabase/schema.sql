-- IslamRoots Educator Supabase Schema & Security Rules

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Teachers
CREATE TABLE IF NOT EXISTS teachers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Ustadh',
  email TEXT NOT NULL,
  preferred_language TEXT DEFAULT 'en',
  age INTEGER,
  years_of_experience INTEGER,
  purpose TEXT,
  location TEXT,
  onboarding_completed BOOLEAN DEFAULT true,
  tour_completed BOOLEAN DEFAULT false,
  timezone TEXT,
  reminder_minutes INTEGER,
  reminder_sound_enabled BOOLEAN DEFAULT true,
  reminder_vibration_enabled BOOLEAN DEFAULT true,
  is_super_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Students
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  age INTEGER,
  nationality TEXT,
  native_language TEXT,
  learning_language TEXT,
  level TEXT,
  subjects JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Curriculums
CREATE TABLE IF NOT EXISTS curriculums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT,
  description TEXT,
  level TEXT,
  lessons JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Student Curriculums
CREATE TABLE IF NOT EXISTS student_curriculums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  curriculum_id UUID NOT NULL REFERENCES curriculums(id) ON DELETE CASCADE,
  progress_percentage INTEGER DEFAULT 0,
  current_lesson_id TEXT,
  completed_lesson_ids JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Lesson Sessions
CREATE TABLE IF NOT EXISTS lesson_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  curriculum_id UUID REFERENCES curriculums(id) ON DELETE SET NULL,
  lesson_title TEXT NOT NULL,
  date TEXT,
  duration_minutes INTEGER,
  attendance_status TEXT,
  objectives JSONB DEFAULT '[]'::jsonb,
  completed_items JSONB DEFAULT '[]'::jsonb,
  teacher_notes TEXT,
  homework TEXT,
  quiz_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Memory Detective Sessions
CREATE TABLE IF NOT EXISTS memory_detective_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date TEXT,
  surah_range TEXT,
  total_questions INTEGER,
  correct_answers INTEGER,
  score_percentage NUMERIC,
  strong_areas JSONB DEFAULT '[]'::jsonb,
  needs_practice JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Saved AI Content
CREATE TABLE IF NOT EXISTS saved_ai_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Schedules
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  curriculum_id UUID REFERENCES curriculums(id) ON DELETE SET NULL,
  lesson_id TEXT,
  subject TEXT,
  title TEXT,
  start_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  recurrence TEXT,
  reminder_minutes INTEGER,
  reminder_enabled BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'Scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT,
  read BOOLEAN DEFAULT false,
  scheduled_time TIMESTAMPTZ,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Progress Records (Unused in frontend, maintained for schema completeness)
CREATE TABLE IF NOT EXISTS progress_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculums ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_curriculums ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_detective_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_ai_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_records ENABLE ROW LEVEL SECURITY;

-- Helper function to check super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM teachers WHERE id = auth.uid() AND is_super_admin = true
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- RLS Policies
CREATE POLICY "Teachers access policy" ON teachers
  FOR ALL USING (id = auth.uid() OR is_super_admin())
  WITH CHECK (id = auth.uid() OR is_super_admin());

CREATE POLICY "Students access policy" ON students
  FOR ALL USING (teacher_id = auth.uid() OR is_super_admin())
  WITH CHECK (teacher_id = auth.uid() OR is_super_admin());

CREATE POLICY "Curriculums access policy" ON curriculums
  FOR ALL USING (teacher_id = auth.uid() OR is_super_admin())
  WITH CHECK (teacher_id = auth.uid() OR is_super_admin());

CREATE POLICY "Student Curriculums access policy" ON student_curriculums
  FOR ALL USING (teacher_id = auth.uid() OR is_super_admin())
  WITH CHECK (teacher_id = auth.uid() OR is_super_admin());

CREATE POLICY "Lesson Sessions access policy" ON lesson_sessions
  FOR ALL USING (teacher_id = auth.uid() OR is_super_admin())
  WITH CHECK (teacher_id = auth.uid() OR is_super_admin());

CREATE POLICY "Memory Detective Sessions access policy" ON memory_detective_sessions
  FOR ALL USING (teacher_id = auth.uid() OR is_super_admin())
  WITH CHECK (teacher_id = auth.uid() OR is_super_admin());

CREATE POLICY "Saved AI Content access policy" ON saved_ai_content
  FOR ALL USING (teacher_id = auth.uid() OR is_super_admin())
  WITH CHECK (teacher_id = auth.uid() OR is_super_admin());

CREATE POLICY "Schedules access policy" ON schedules
  FOR ALL USING (teacher_id = auth.uid() OR is_super_admin())
  WITH CHECK (teacher_id = auth.uid() OR is_super_admin());

CREATE POLICY "Notifications access policy" ON notifications
  FOR ALL USING (teacher_id = auth.uid() OR is_super_admin())
  WITH CHECK (teacher_id = auth.uid() OR is_super_admin());

CREATE POLICY "Progress Records access policy" ON progress_records
  FOR ALL USING (teacher_id = auth.uid() OR is_super_admin())
  WITH CHECK (teacher_id = auth.uid() OR is_super_admin());

-- Enable Realtime publication for tables
ALTER PUBLICATION supabase_realtime ADD TABLE students, curriculums, student_curriculums, lesson_sessions, memory_detective_sessions, saved_ai_content, schedules, notifications;

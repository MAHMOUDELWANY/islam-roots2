-- IslamRoots Educator Supabase Schema & Security Rules

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Teachers
CREATE TABLE IF NOT EXISTS teachers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  name TEXT NOT NULL DEFAULT 'Ustadh',
  email TEXT,
  full_name TEXT,
  display_name TEXT,
  arabic_name TEXT,
  country TEXT,
  teaching_language TEXT,
  gender TEXT,
  years_experience INTEGER,
  specializations JSONB DEFAULT '[]'::jsonb,
  bio TEXT,
  profile_completed BOOLEAN DEFAULT false,
  profile_completed_at TIMESTAMPTZ,
  preferred_language TEXT DEFAULT 'en',
  age INTEGER,
  years_of_experience INTEGER,
  purpose TEXT,
  location TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
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
  recurrence_days JSONB DEFAULT '[]'::jsonb,
  recurrence_end_date DATE,
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
    SELECT 1 FROM public.teachers WHERE id = auth.uid() AND is_super_admin = true
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- RLS Policies


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

DROP TRIGGER IF EXISTS tr_check_teacher_update ON teachers;
CREATE TRIGGER tr_check_teacher_update
BEFORE UPDATE ON teachers
FOR EACH ROW
EXECUTE FUNCTION check_teacher_update();


-- RLS Policies for students
CREATE POLICY "Students select policy" ON students
  FOR SELECT USING (teacher_id = auth.uid() OR is_super_admin());

CREATE POLICY "Students insert policy" ON students
  FOR INSERT WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Students update policy" ON students
  FOR UPDATE USING (teacher_id = auth.uid() OR is_super_admin())
  WITH CHECK (teacher_id = auth.uid() OR is_super_admin());

CREATE POLICY "Students delete policy" ON students
  FOR DELETE USING (teacher_id = auth.uid() OR is_super_admin());

-- RLS Policies for curriculums
CREATE POLICY "Curriculums select policy" ON curriculums
  FOR SELECT USING (teacher_id = auth.uid() OR is_super_admin());

CREATE POLICY "Curriculums insert policy" ON curriculums
  FOR INSERT WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Curriculums update policy" ON curriculums
  FOR UPDATE USING (teacher_id = auth.uid() OR is_super_admin())
  WITH CHECK (teacher_id = auth.uid() OR is_super_admin());

CREATE POLICY "Curriculums delete policy" ON curriculums
  FOR DELETE USING (teacher_id = auth.uid() OR is_super_admin());

-- RLS Policies for student_curriculums
CREATE POLICY "Student_curriculums select policy" ON student_curriculums
  FOR SELECT USING (teacher_id = auth.uid() OR is_super_admin());

CREATE POLICY "Student_curriculums insert policy" ON student_curriculums
  FOR INSERT WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Student_curriculums update policy" ON student_curriculums
  FOR UPDATE USING (teacher_id = auth.uid() OR is_super_admin())
  WITH CHECK (teacher_id = auth.uid() OR is_super_admin());

CREATE POLICY "Student_curriculums delete policy" ON student_curriculums
  FOR DELETE USING (teacher_id = auth.uid() OR is_super_admin());

-- RLS Policies for lesson_sessions
CREATE POLICY "Lesson_sessions select policy" ON lesson_sessions
  FOR SELECT USING (teacher_id = auth.uid() OR is_super_admin());

CREATE POLICY "Lesson_sessions insert policy" ON lesson_sessions
  FOR INSERT WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Lesson_sessions update policy" ON lesson_sessions
  FOR UPDATE USING (teacher_id = auth.uid() OR is_super_admin())
  WITH CHECK (teacher_id = auth.uid() OR is_super_admin());

CREATE POLICY "Lesson_sessions delete policy" ON lesson_sessions
  FOR DELETE USING (teacher_id = auth.uid() OR is_super_admin());

-- RLS Policies for memory_detective_sessions
CREATE POLICY "Memory_detective_sessions select policy" ON memory_detective_sessions
  FOR SELECT USING (teacher_id = auth.uid() OR is_super_admin());

CREATE POLICY "Memory_detective_sessions insert policy" ON memory_detective_sessions
  FOR INSERT WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Memory_detective_sessions update policy" ON memory_detective_sessions
  FOR UPDATE USING (teacher_id = auth.uid() OR is_super_admin())
  WITH CHECK (teacher_id = auth.uid() OR is_super_admin());

CREATE POLICY "Memory_detective_sessions delete policy" ON memory_detective_sessions
  FOR DELETE USING (teacher_id = auth.uid() OR is_super_admin());

-- RLS Policies for saved_ai_content
CREATE POLICY "Saved_ai_content select policy" ON saved_ai_content
  FOR SELECT USING (teacher_id = auth.uid() OR is_super_admin());

CREATE POLICY "Saved_ai_content insert policy" ON saved_ai_content
  FOR INSERT WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Saved_ai_content update policy" ON saved_ai_content
  FOR UPDATE USING (teacher_id = auth.uid() OR is_super_admin())
  WITH CHECK (teacher_id = auth.uid() OR is_super_admin());

CREATE POLICY "Saved_ai_content delete policy" ON saved_ai_content
  FOR DELETE USING (teacher_id = auth.uid() OR is_super_admin());

-- RLS Policies for schedules
CREATE POLICY "Schedules select policy" ON schedules
  FOR SELECT USING (teacher_id = auth.uid() OR is_super_admin());

CREATE POLICY "Schedules insert policy" ON schedules
  FOR INSERT WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Schedules update policy" ON schedules
  FOR UPDATE USING (teacher_id = auth.uid() OR is_super_admin())
  WITH CHECK (teacher_id = auth.uid() OR is_super_admin());

CREATE POLICY "Schedules delete policy" ON schedules
  FOR DELETE USING (teacher_id = auth.uid() OR is_super_admin());

-- RLS Policies for notifications
CREATE POLICY "Notifications select policy" ON notifications
  FOR SELECT USING (teacher_id = auth.uid() OR is_super_admin());

CREATE POLICY "Notifications insert policy" ON notifications
  FOR INSERT WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Notifications update policy" ON notifications
  FOR UPDATE USING (teacher_id = auth.uid() OR is_super_admin())
  WITH CHECK (teacher_id = auth.uid() OR is_super_admin());

CREATE POLICY "Notifications delete policy" ON notifications
  FOR DELETE USING (teacher_id = auth.uid() OR is_super_admin());

-- RLS Policies for progress_records
CREATE POLICY "Progress_records select policy" ON progress_records
  FOR SELECT USING (teacher_id = auth.uid() OR is_super_admin());

CREATE POLICY "Progress_records insert policy" ON progress_records
  FOR INSERT WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Progress_records update policy" ON progress_records
  FOR UPDATE USING (teacher_id = auth.uid() OR is_super_admin())
  WITH CHECK (teacher_id = auth.uid() OR is_super_admin());

CREATE POLICY "Progress_records delete policy" ON progress_records
  FOR DELETE USING (teacher_id = auth.uid() OR is_super_admin());


-- Enable Realtime publication for tables
ALTER PUBLICATION supabase_realtime ADD TABLE students, curriculums, student_curriculums, lesson_sessions, memory_detective_sessions, saved_ai_content, schedules, notifications;


-- SECURITY DEFINER least-privilege grants
-- Trigger-only functions are not exposed as public RPCs. is_super_admin remains
-- executable by authenticated users because RLS policy expressions call it.
REVOKE EXECUTE ON FUNCTION public.check_teacher_update() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_teacher_update() TO service_role, postgres;

-- The live trigger-only set_teacher_username() function is defined by an earlier
-- migration and is hardened with the same least-privilege grants:
-- REVOKE EXECUTE ON FUNCTION public.set_teacher_username() FROM PUBLIC, anon, authenticated;
-- GRANT EXECUTE ON FUNCTION public.set_teacher_username() TO service_role, postgres;

REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, service_role, postgres;

-- Persistent per-user AI rate-limit buckets. Access is service-role-only.
CREATE TABLE IF NOT EXISTS public.ai_rate_limits (
  user_id UUID PRIMARY KEY,
  request_count INTEGER NOT NULL DEFAULT 1 CHECK (request_count >= 0),
  window_start TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ai_rate_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.ai_rate_limits TO service_role, postgres;

CREATE OR REPLACE FUNCTION public.check_and_increment_ai_rate_limit(
  p_user_id UUID,
  p_limit INTEGER,
  p_window_seconds INTEGER
)
RETURNS TABLE (
  allowed BOOLEAN,
  retry_after_seconds INTEGER,
  request_count INTEGER,
  window_start TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
  v_retry_after INTEGER;
BEGIN
  IF p_user_id IS NULL OR p_limit IS NULL OR p_limit < 1 OR p_limit > 1000 OR p_window_seconds IS NULL OR p_window_seconds < 1 OR p_window_seconds > 86400 THEN
    RAISE EXCEPTION 'Invalid rate limit parameters';
  END IF;

  INSERT INTO public.ai_rate_limits (user_id, request_count, window_start)
  VALUES (p_user_id, 0, v_now)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT arl.request_count, arl.window_start
  INTO v_count, v_window_start
  FROM public.ai_rate_limits AS arl
  WHERE arl.user_id = p_user_id
  FOR UPDATE;

  IF v_window_start <= v_now - make_interval(secs => p_window_seconds) THEN
    UPDATE public.ai_rate_limits AS arl
    SET request_count = 1, window_start = v_now
    WHERE arl.user_id = p_user_id;
    RETURN QUERY SELECT TRUE, 0, 1, v_now;
    RETURN;
  END IF;

  IF v_count >= p_limit THEN
    v_retry_after := GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_window_start + make_interval(secs => p_window_seconds) - v_now)))::INTEGER);
    RETURN QUERY SELECT FALSE, v_retry_after, v_count, v_window_start;
    RETURN;
  END IF;

  UPDATE public.ai_rate_limits AS arl
  SET request_count = v_count + 1
  WHERE arl.user_id = p_user_id;
  RETURN QUERY SELECT TRUE, 0, v_count + 1, v_window_start;
END;
$$;

REVOKE ALL ON FUNCTION public.check_and_increment_ai_rate_limit(UUID, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_increment_ai_rate_limit(UUID, INTEGER, INTEGER) TO service_role, postgres;

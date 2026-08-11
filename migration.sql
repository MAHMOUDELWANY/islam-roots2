-- Helper function to check super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teachers WHERE id = auth.uid() AND is_super_admin = true
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

DROP POLICY IF EXISTS "Teachers access policy" ON teachers;
DROP POLICY IF EXISTS "Students access policy" ON students;
DROP POLICY IF EXISTS "Curriculums access policy" ON curriculums;
DROP POLICY IF EXISTS "Student Curriculums access policy" ON student_curriculums;
DROP POLICY IF EXISTS "Lesson Sessions access policy" ON lesson_sessions;
DROP POLICY IF EXISTS "Memory Detective Sessions access policy" ON memory_detective_sessions;
DROP POLICY IF EXISTS "Saved AI Content access policy" ON saved_ai_content;
DROP POLICY IF EXISTS "Schedules access policy" ON schedules;
DROP POLICY IF EXISTS "Notifications access policy" ON notifications;
DROP POLICY IF EXISTS "Progress Records access policy" ON progress_records;

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

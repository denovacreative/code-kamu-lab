-- Fix infinite recursion in class_members RLS policies as well
-- Drop existing problematic policies for class_members
DROP POLICY IF EXISTS "Students can join classes" ON public.class_members;
DROP POLICY IF EXISTS "Students can view their own memberships" ON public.class_members;
DROP POLICY IF EXISTS "Teachers can manage their class members" ON public.class_members;

-- Create new safe RLS policies for class_members
CREATE POLICY "Students can join classes"
ON public.class_members
FOR INSERT
TO authenticated
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can view their own memberships"
ON public.class_members
FOR SELECT
TO authenticated
USING (student_id = auth.uid());

CREATE POLICY "Teachers can view their class members"
ON public.class_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.classes 
    WHERE classes.id = class_members.class_id 
      AND classes.teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can manage their class members"
ON public.class_members
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.classes 
    WHERE classes.id = class_members.class_id 
      AND classes.teacher_id = auth.uid()
  )
);
-- Fix RLS policy for classes to allow students to find classes by code for joining
-- Drop existing problematic policy
DROP POLICY IF EXISTS "Students can view classes they are members of" ON public.classes;

-- Create new policy that allows students to view classes for joining
CREATE POLICY "Students can view classes for joining and their enrolled classes"
ON public.classes
FOR SELECT
TO authenticated
USING (
  auth.uid() = teacher_id OR 
  is_class_member(id, auth.uid()) OR
  (get_user_role(auth.uid()) = 'student' AND is_active = true)
);
-- Fix infinite recursion in classes RLS policies
-- First, drop existing problematic policies
DROP POLICY IF EXISTS "Students can view classes they joined" ON public.classes;
DROP POLICY IF EXISTS "Teachers can create classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can view and manage their classes" ON public.classes;

-- Create security definer function to check if user is a class member
CREATE OR REPLACE FUNCTION public.is_class_member(class_id_param uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.class_members 
    WHERE class_id = class_id_param 
      AND student_id = user_id_param 
      AND is_active = true
  );
$$;

-- Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id_param uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(role, 'student') 
  FROM public.profiles 
  WHERE user_id = user_id_param;
$$;

-- Create new safe RLS policies for classes
CREATE POLICY "Teachers can create classes"
ON public.classes
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = teacher_id AND 
  public.get_user_role(auth.uid()) = 'teacher'
);

CREATE POLICY "Teachers can manage their own classes"
ON public.classes
FOR ALL
TO authenticated
USING (auth.uid() = teacher_id);

CREATE POLICY "Students can view classes they are members of"
ON public.classes
FOR SELECT
TO authenticated
USING (
  auth.uid() = teacher_id OR 
  public.is_class_member(id, auth.uid())
);
-- Update profiles table to support teacher/student roles
ALTER TABLE public.profiles DROP COLUMN role;
ALTER TABLE public.profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin'));

-- Create notebooks table for storing and sharing notebooks
CREATE TABLE public.notebooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_template BOOLEAN DEFAULT false,
  is_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notebook_assignments table for teacher-student assignments
CREATE TABLE public.notebook_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notebook_id UUID NOT NULL REFERENCES public.notebooks(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  student_content JSONB DEFAULT '[]'::jsonb,
  teacher_feedback TEXT,
  grade TEXT,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'submitted', 'graded')),
  UNIQUE(notebook_id, student_id)
);

-- Enable RLS
ALTER TABLE public.notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notebook_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notebooks
CREATE POLICY "Users can view their own notebooks and public notebooks" 
ON public.notebooks 
FOR SELECT 
USING (
  created_by = auth.uid() OR 
  is_shared = true OR 
  id IN (
    SELECT notebook_id FROM public.notebook_assignments 
    WHERE student_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own notebooks" 
ON public.notebooks 
FOR INSERT 
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own notebooks" 
ON public.notebooks 
FOR UPDATE 
USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own notebooks" 
ON public.notebooks 
FOR DELETE 
USING (created_by = auth.uid());

-- RLS Policies for notebook_assignments
CREATE POLICY "Teachers can view assignments they created" 
ON public.notebook_assignments 
FOR SELECT 
USING (teacher_id = auth.uid());

CREATE POLICY "Students can view their own assignments" 
ON public.notebook_assignments 
FOR SELECT 
USING (student_id = auth.uid());

CREATE POLICY "Teachers can create assignments" 
ON public.notebook_assignments 
FOR INSERT 
WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can update assignments they created" 
ON public.notebook_assignments 
FOR UPDATE 
USING (teacher_id = auth.uid());

CREATE POLICY "Students can update their assignment content" 
ON public.notebook_assignments 
FOR UPDATE 
USING (
  student_id = auth.uid() AND 
  status IN ('assigned', 'in_progress')
);

-- Add triggers for timestamp updates
CREATE TRIGGER update_notebooks_updated_at
BEFORE UPDATE ON public.notebooks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create some sample data
-- Sample teacher profile (will be created when user signs up)
-- Sample notebooks and assignments will be created via the app
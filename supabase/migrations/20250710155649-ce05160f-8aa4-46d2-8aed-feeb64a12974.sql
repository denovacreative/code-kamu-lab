-- Create assignment system
CREATE TABLE public.assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL,
  teacher_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  due_date TIMESTAMP WITH TIME ZONE,
  max_score NUMERIC DEFAULT 100,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE public.assignments 
ADD CONSTRAINT assignments_class_id_fkey 
FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for assignments
CREATE POLICY "Teachers can manage assignments in their classes"
ON public.assignments
FOR ALL
TO authenticated
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Students can view published assignments in their classes"
ON public.assignments
FOR SELECT
TO authenticated
USING (
  is_published = true AND
  class_id IN (
    SELECT class_members.class_id
    FROM class_members
    WHERE class_members.student_id = auth.uid() 
      AND class_members.is_active = true
  )
);

-- Create assignment submissions table
CREATE TABLE public.assignment_student_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL,
  student_id UUID NOT NULL,
  submission_content JSONB NOT NULL DEFAULT '[]'::jsonb,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  score NUMERIC,
  feedback TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(assignment_id, student_id)
);

-- Add foreign key constraints
ALTER TABLE public.assignment_student_submissions 
ADD CONSTRAINT assignment_student_submissions_assignment_id_fkey 
FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE public.assignment_student_submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for assignment submissions
CREATE POLICY "Students can manage their own submissions"
ON public.assignment_student_submissions
FOR ALL
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers can view submissions for their assignments"
ON public.assignment_student_submissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.assignments 
    WHERE assignments.id = assignment_student_submissions.assignment_id 
      AND assignments.teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can update scores for their assignments"
ON public.assignment_student_submissions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.assignments 
    WHERE assignments.id = assignment_student_submissions.assignment_id 
      AND assignments.teacher_id = auth.uid()
  )
);

-- Create triggers for timestamps
CREATE TRIGGER update_assignments_updated_at
BEFORE UPDATE ON public.assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assignment_student_submissions_updated_at
BEFORE UPDATE ON public.assignment_student_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
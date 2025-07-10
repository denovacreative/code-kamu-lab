-- Add additional columns to notebooks table for sharing and templates
ALTER TABLE public.notebooks 
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
ADD COLUMN IF NOT EXISTS estimated_time INTEGER, -- in minutes
ADD COLUMN IF NOT EXISTS auto_grade_config JSONB;

-- Create table for assignment submissions with auto-grading
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES public.notebook_assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  submitted_content JSONB NOT NULL DEFAULT '[]'::jsonb,
  submission_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  auto_grade_score DECIMAL(5,2), -- percentage score
  auto_grade_feedback JSONB, -- detailed feedback per cell
  manual_grade_score DECIMAL(5,2),
  manual_feedback TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'needs_review')),
  execution_results JSONB, -- store execution results for each cell
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for notebook sharing and collaboration
CREATE TABLE IF NOT EXISTS public.notebook_collaborators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notebook_id UUID NOT NULL REFERENCES public.notebooks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  permission TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'edit', 'admin')),
  invited_by UUID NOT NULL,
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(notebook_id, user_id)
);

-- Create table for real-time terminal sessions
CREATE TABLE IF NOT EXISTS public.terminal_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  notebook_id UUID REFERENCES public.notebooks(id) ON DELETE CASCADE,
  session_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for auto-grading test cases
CREATE TABLE IF NOT EXISTS public.notebook_test_cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notebook_id UUID NOT NULL REFERENCES public.notebooks(id) ON DELETE CASCADE,
  cell_index INTEGER NOT NULL,
  test_type TEXT NOT NULL CHECK (test_type IN ('output_match', 'code_contains', 'function_exists', 'variable_value')),
  test_config JSONB NOT NULL, -- contains test parameters
  points INTEGER NOT NULL DEFAULT 1,
  is_hidden BOOLEAN NOT NULL DEFAULT false, -- hidden tests students can't see
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for tracking student progress
CREATE TABLE IF NOT EXISTS public.student_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  notebook_id UUID NOT NULL REFERENCES public.notebooks(id) ON DELETE CASCADE,
  cells_completed INTEGER NOT NULL DEFAULT 0,
  total_cells INTEGER NOT NULL DEFAULT 0,
  time_spent INTEGER NOT NULL DEFAULT 0, -- in minutes
  last_accessed TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completion_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  UNIQUE(student_id, notebook_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notebook_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terminal_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notebook_test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assignment_submissions
CREATE POLICY "Students can view their own submissions" 
ON public.assignment_submissions 
FOR SELECT 
USING (student_id = auth.uid());

CREATE POLICY "Students can create their own submissions" 
ON public.assignment_submissions 
FOR INSERT 
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their own submissions" 
ON public.assignment_submissions 
FOR UPDATE 
USING (student_id = auth.uid());

CREATE POLICY "Teachers can view submissions for their assignments" 
ON public.assignment_submissions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.notebook_assignments na 
    WHERE na.id = assignment_id AND na.teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can update submissions for their assignments" 
ON public.assignment_submissions 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.notebook_assignments na 
    WHERE na.id = assignment_id AND na.teacher_id = auth.uid()
  )
);

-- RLS Policies for notebook_collaborators
CREATE POLICY "Users can view collaborations they're part of" 
ON public.notebook_collaborators 
FOR SELECT 
USING (user_id = auth.uid() OR invited_by = auth.uid());

CREATE POLICY "Notebook owners can manage collaborators" 
ON public.notebook_collaborators 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.notebooks n 
    WHERE n.id = notebook_id AND n.created_by = auth.uid()
  )
);

-- RLS Policies for terminal_sessions
CREATE POLICY "Users can manage their own terminal sessions" 
ON public.terminal_sessions 
FOR ALL 
USING (user_id = auth.uid());

-- RLS Policies for notebook_test_cases
CREATE POLICY "Teachers can manage test cases for their notebooks" 
ON public.notebook_test_cases 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.notebooks n 
    WHERE n.id = notebook_id AND n.created_by = auth.uid()
  )
);

CREATE POLICY "Students can view non-hidden test cases for assigned notebooks" 
ON public.notebook_test_cases 
FOR SELECT 
USING (
  NOT is_hidden AND 
  EXISTS (
    SELECT 1 FROM public.notebook_assignments na 
    WHERE na.notebook_id = notebook_test_cases.notebook_id AND na.student_id = auth.uid()
  )
);

-- RLS Policies for student_progress
CREATE POLICY "Students can view their own progress" 
ON public.student_progress 
FOR SELECT 
USING (student_id = auth.uid());

CREATE POLICY "Students can update their own progress" 
ON public.student_progress 
FOR INSERT 
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their own progress" 
ON public.student_progress 
FOR UPDATE 
USING (student_id = auth.uid());

CREATE POLICY "Teachers can view progress for their assigned notebooks" 
ON public.student_progress 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.notebook_assignments na 
    WHERE na.notebook_id = student_progress.notebook_id 
    AND na.teacher_id = auth.uid()
  )
);

-- Create triggers for updated_at
CREATE TRIGGER update_assignment_submissions_updated_at
BEFORE UPDATE ON public.assignment_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function for auto-grading
CREATE OR REPLACE FUNCTION public.auto_grade_submission(submission_id UUID)
RETURNS JSONB
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  submission_record RECORD;
  test_cases RECORD;
  cell_content TEXT;
  grade_result JSONB := '{"total_score": 0, "max_score": 0, "feedback": []}'::jsonb;
  current_score INTEGER := 0;
  max_score INTEGER := 0;
BEGIN
  -- Get submission details
  SELECT * INTO submission_record 
  FROM public.assignment_submissions 
  WHERE id = submission_id;
  
  IF NOT FOUND THEN
    RETURN '{"error": "Submission not found"}'::jsonb;
  END IF;
  
  -- Get test cases for the notebook
  FOR test_cases IN 
    SELECT * FROM public.notebook_test_cases ntc
    INNER JOIN public.notebook_assignments na ON na.notebook_id = ntc.notebook_id
    WHERE na.id = submission_record.assignment_id
    ORDER BY ntc.cell_index, ntc.id
  LOOP
    max_score := max_score + test_cases.points;
    
    -- Extract cell content from submission
    cell_content := submission_record.submitted_content->test_cases.cell_index->>'content';
    
    -- Simple auto-grading logic (can be enhanced)
    IF test_cases.test_type = 'code_contains' THEN
      IF cell_content ILIKE '%' || (test_cases.test_config->>'contains') || '%' THEN
        current_score := current_score + test_cases.points;
      END IF;
    END IF;
  END LOOP;
  
  -- Update the submission with auto-grade results
  UPDATE public.assignment_submissions 
  SET auto_grade_score = (current_score::DECIMAL / NULLIF(max_score, 0)) * 100,
      auto_grade_feedback = grade_result,
      status = 'graded'
  WHERE id = submission_id;
  
  RETURN jsonb_build_object(
    'total_score', current_score,
    'max_score', max_score,
    'percentage', (current_score::DECIMAL / NULLIF(max_score, 0)) * 100
  );
END;
$$;

-- Enable realtime for collaborative features
ALTER TABLE public.terminal_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.student_progress REPLICA IDENTITY FULL;
ALTER TABLE public.notebook_collaborators REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.terminal_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notebook_collaborators;
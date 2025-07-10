-- Create code review comments table
CREATE TABLE public.code_review_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL,
  assignment_id UUID NOT NULL,
  author_id UUID NOT NULL,
  line_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'suggestion' CHECK (type IN ('suggestion', 'question', 'issue', 'praise')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.code_review_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for code review comments
CREATE POLICY "Authors can manage their own comments"
ON public.code_review_comments
FOR ALL
USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());

CREATE POLICY "Students can view comments on their submissions"
ON public.code_review_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.assignment_student_submissions
    WHERE id = code_review_comments.submission_id
    AND student_id = auth.uid()
  )
);

CREATE POLICY "Teachers can manage comments on their assignments"
ON public.code_review_comments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.assignments
    WHERE id = code_review_comments.assignment_id
    AND teacher_id = auth.uid()
  )
);

-- Create indexes for better performance
CREATE INDEX idx_code_review_comments_submission_id ON public.code_review_comments(submission_id);
CREATE INDEX idx_code_review_comments_assignment_id ON public.code_review_comments(assignment_id);
CREATE INDEX idx_code_review_comments_line_number ON public.code_review_comments(line_number);

-- Create function to update timestamps
CREATE TRIGGER update_code_review_comments_updated_at
BEFORE UPDATE ON public.code_review_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
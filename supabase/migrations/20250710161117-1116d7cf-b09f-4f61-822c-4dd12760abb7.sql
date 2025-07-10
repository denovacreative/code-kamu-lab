-- Create storage bucket for assignment submissions
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assignment-files', 'assignment-files', false);

-- Create storage policies for assignment files
CREATE POLICY "Students can upload their assignment files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assignment-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Students can view their own assignment files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'assignment-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Teachers can view all assignment files in their classes"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'assignment-files' AND
  EXISTS (
    SELECT 1 FROM public.assignments a
    JOIN public.assignment_student_submissions ass ON a.id = ass.assignment_id
    WHERE a.teacher_id = auth.uid()
      AND name LIKE (ass.student_id || '/%')
  )
);

CREATE POLICY "Students can update their own assignment files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'assignment-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Students can delete their own assignment files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'assignment-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add file uploads to assignment submissions
ALTER TABLE public.assignment_student_submissions 
ADD COLUMN IF NOT EXISTS submitted_files JSONB DEFAULT '[]'::jsonb;

-- Add assignment type to assignments table
ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS assignment_type TEXT DEFAULT 'notebook',
ADD COLUMN IF NOT EXISTS instructions TEXT,
ADD COLUMN IF NOT EXISTS allowed_file_types TEXT[] DEFAULT ARRAY['py', 'ipynb', 'txt', 'pdf', 'zip'];

-- Update assignment submission status
ALTER TABLE public.assignment_student_submissions 
ALTER COLUMN status SET DEFAULT 'draft';
-- Add start_date column to assignments table
ALTER TABLE public.assignments 
ADD COLUMN start_date TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add is_open column to classes table for open/closed class feature
ALTER TABLE public.classes 
ADD COLUMN is_open BOOLEAN NOT NULL DEFAULT true;
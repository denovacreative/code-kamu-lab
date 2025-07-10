-- Create classroom management system
CREATE TABLE public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  class_code TEXT NOT NULL UNIQUE,
  teacher_id UUID NOT NULL,
  notebook_content JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.class_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(class_id, student_id)
);

CREATE TABLE public.class_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  session_data JSONB DEFAULT '{}'::jsonb,
  cursor_position JSONB,
  active_cell TEXT,
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_online BOOLEAN DEFAULT true
);

CREATE TABLE public.class_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL, -- 'cell_execute', 'cell_create', 'cell_edit', 'join', 'leave'
  cell_id TEXT,
  content TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for classes
CREATE POLICY "Teachers can create classes" 
ON public.classes 
FOR INSERT 
WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can view and manage their classes" 
ON public.classes 
FOR ALL 
USING (auth.uid() = teacher_id);

CREATE POLICY "Students can view classes they joined" 
ON public.classes 
FOR SELECT 
USING (id IN (
  SELECT class_id FROM public.class_members 
  WHERE student_id = auth.uid() AND is_active = true
));

-- RLS Policies for class_members
CREATE POLICY "Teachers can manage their class members" 
ON public.class_members 
FOR ALL 
USING (class_id IN (
  SELECT id FROM public.classes WHERE teacher_id = auth.uid()
));

CREATE POLICY "Students can view their own memberships" 
ON public.class_members 
FOR SELECT 
USING (student_id = auth.uid());

CREATE POLICY "Students can join classes" 
ON public.class_members 
FOR INSERT 
WITH CHECK (student_id = auth.uid());

-- RLS Policies for class_sessions
CREATE POLICY "Users can manage their own sessions" 
ON public.class_sessions 
FOR ALL 
USING (user_id = auth.uid());

CREATE POLICY "Class members can view sessions in their classes" 
ON public.class_sessions 
FOR SELECT 
USING (
  class_id IN (
    SELECT class_id FROM public.class_members 
    WHERE student_id = auth.uid() AND is_active = true
  ) OR 
  class_id IN (
    SELECT id FROM public.classes WHERE teacher_id = auth.uid()
  )
);

-- RLS Policies for class_activities
CREATE POLICY "Users can create their own activities" 
ON public.class_activities 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Class members can view activities in their classes" 
ON public.class_activities 
FOR SELECT 
USING (
  class_id IN (
    SELECT class_id FROM public.class_members 
    WHERE student_id = auth.uid() AND is_active = true
  ) OR 
  class_id IN (
    SELECT id FROM public.classes WHERE teacher_id = auth.uid()
  )
);

-- Create function to generate unique class codes
CREATE OR REPLACE FUNCTION generate_class_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Generate a 6-character code with letters and numbers
    code := upper(substring(md5(random()::text) from 1 for 6));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.classes WHERE class_code = code) INTO exists_check;
    
    -- Exit loop if code is unique
    IF NOT exists_check THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add indexes for performance
CREATE INDEX idx_classes_teacher_id ON public.classes(teacher_id);
CREATE INDEX idx_classes_class_code ON public.classes(class_code);
CREATE INDEX idx_class_members_class_id ON public.class_members(class_id);
CREATE INDEX idx_class_members_student_id ON public.class_members(student_id);
CREATE INDEX idx_class_sessions_class_id ON public.class_sessions(class_id);
CREATE INDEX idx_class_sessions_user_id ON public.class_sessions(user_id);
CREATE INDEX idx_class_activities_class_id ON public.class_activities(class_id);
CREATE INDEX idx_class_activities_timestamp ON public.class_activities(timestamp DESC);
-- Create real-time chat system
CREATE TABLE public.class_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_deleted BOOLEAN NOT NULL DEFAULT false
);

-- Add foreign key constraints
ALTER TABLE public.class_messages 
ADD CONSTRAINT class_messages_class_id_fkey 
FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE public.class_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for chat messages
CREATE POLICY "Class members can view messages in their classes"
ON public.class_messages
FOR SELECT
TO authenticated
USING (
  class_id IN (
    SELECT class_members.class_id
    FROM class_members
    WHERE class_members.student_id = auth.uid() 
      AND class_members.is_active = true
  ) OR 
  class_id IN (
    SELECT classes.id
    FROM classes
    WHERE classes.teacher_id = auth.uid()
  )
);

CREATE POLICY "Class members can send messages in their classes"
ON public.class_messages
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  (class_id IN (
    SELECT class_members.class_id
    FROM class_members
    WHERE class_members.student_id = auth.uid() 
      AND class_members.is_active = true
  ) OR 
  class_id IN (
    SELECT classes.id
    FROM classes
    WHERE classes.teacher_id = auth.uid()
  ))
);

CREATE POLICY "Users can update their own messages"
ON public.class_messages
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Enable realtime for chat
ALTER TABLE public.class_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.class_messages;

-- Create function to update timestamps
CREATE TRIGGER update_class_messages_updated_at
BEFORE UPDATE ON public.class_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
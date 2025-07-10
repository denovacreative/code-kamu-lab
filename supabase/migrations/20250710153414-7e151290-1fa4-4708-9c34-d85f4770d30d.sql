-- Insert sample teacher data
-- First, we need to check if teacher user already exists
-- Let's create a sample teacher profile

INSERT INTO public.profiles (user_id, display_name, role, avatar_url)
VALUES 
  ('66230b06-2212-47ae-9198-53f3920e44f7', 'Sample Teacher', 'teacher', NULL)
ON CONFLICT (user_id) DO UPDATE SET 
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role;

-- Create a sample class for the teacher
INSERT INTO public.classes (name, description, class_code, teacher_id, notebook_content)
VALUES 
  ('Introduction to Python', 'Learn Python programming basics with interactive exercises', 'PY2024', '66230b06-2212-47ae-9198-53f3920e44f7', '[{"id":"cell-1","type":"code","content":"# Welcome to Python Programming!\nprint(\"Hello, World!\")","output":""}]'::jsonb);

-- Create sample notebook for assignments
INSERT INTO public.notebooks (title, description, content, created_by, is_template, difficulty, estimated_time)
VALUES 
  ('Python Basics Assignment', 'Complete these Python exercises to test your understanding', '[{"id":"cell-1","type":"markdown","content":"# Python Basics Assignment\n\nComplete the following exercises:"},{"id":"cell-2","type":"code","content":"# Exercise 1: Variables and Data Types\n# Create variables for name, age, and grade\nname = \"\"\nage = 0\ngrade = 0.0\n\nprint(f\"Name: {name}, Age: {age}, Grade: {grade}\")","output":""},{"id":"cell-3","type":"markdown","content":"## Exercise 2: Functions"},{"id":"cell-4","type":"code","content":"# Create a function that calculates the area of a rectangle\ndef calculate_area(length, width):\n    # Your code here\n    pass\n\n# Test your function\nresult = calculate_area(5, 3)\nprint(f\"Area: {result}\")","output":""}]'::jsonb, '66230b06-2212-47ae-9198-53f3920e44f7', true, 'beginner', 30);
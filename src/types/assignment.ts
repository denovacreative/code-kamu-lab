export interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions: string;
  assignment_type: 'notebook' | 'file_upload' | 'code_editor';
  due_date: string | null;
  max_score: number;
  allowed_file_types: string[];
  is_published: boolean;
  created_at: string;
  content: any[];
  submission_count?: number;
  my_submission?: {
    id: string;
    score: number | null;
    status: string;
    submitted_at: string;
  };
}

export interface ClassAssignmentsProps {
  classId: string;
  userRole: 'teacher' | 'student';
  className?: string;
}

export type ViewMode = 'list' | 'editor' | 'submission' | 'grading';
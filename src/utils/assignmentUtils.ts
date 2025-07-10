import { Assignment } from '@/types/assignment';
import { 
  BookOpen,
  Upload,
  Code,
  FileText
} from 'lucide-react';

export const formatDueDate = (dueDate: string | null) => {
  if (!dueDate) return 'No due date';
  const date = new Date(dueDate);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  return `Due in ${diffDays} days`;
};

export const getStatusColor = (assignment: Assignment, userRole: 'teacher' | 'student') => {
  if (userRole === 'student' && assignment.my_submission) {
    if (assignment.my_submission.score !== null) return 'bg-green-500';
    return 'bg-blue-500';
  }
  if (assignment.due_date && new Date(assignment.due_date) < new Date()) return 'bg-red-500';
  return 'bg-yellow-500';
};

export const getStatusText = (assignment: Assignment, userRole: 'teacher' | 'student') => {
  if (userRole === 'student' && assignment.my_submission) {
    if (assignment.my_submission.score !== null) return 'Graded';
    return 'Submitted';
  }
  if (assignment.due_date && new Date(assignment.due_date) < new Date()) return 'Overdue';
  return 'Active';
};

export const getAssignmentTypeIcon = (type: string) => {
  switch (type) {
    case 'notebook': return BookOpen;
    case 'file_upload': return Upload;
    case 'code_editor': return Code;
    default: return FileText;
  }
};

export const getAssignmentTypeLabel = (type: string) => {
  switch (type) {
    case 'notebook': return 'Notebook';
    case 'file_upload': return 'File Upload';
    case 'code_editor': return 'Code Editor';
    default: return 'Assignment';
  }
};
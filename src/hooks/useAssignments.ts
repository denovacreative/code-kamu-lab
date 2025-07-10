import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Assignment } from '@/types/assignment';

export const useAssignments = (classId: string, userRole: 'teacher' | 'student') => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAssignments = async () => {
    try {
      setIsLoading(true);
      
      if (userRole === 'teacher') {
        // Teacher view - get all assignments with submission counts
        const { data: assignmentsData, error } = await supabase
          .from('assignments')
          .select(`
            *,
            assignment_student_submissions(count)
          `)
          .eq('class_id', classId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const assignmentsWithCounts = assignmentsData?.map(assignment => ({
          id: assignment.id,
          title: assignment.title || '',
          description: assignment.description || '',
          instructions: assignment.instructions || '',
          assignment_type: (assignment.assignment_type as 'notebook' | 'file_upload' | 'code_editor') || 'notebook',
          due_date: assignment.due_date,
          max_score: assignment.max_score || 100,
          allowed_file_types: assignment.allowed_file_types || ['py', 'ipynb', 'txt'],
          is_published: assignment.is_published || false,
          created_at: assignment.created_at,
          content: Array.isArray(assignment.content) ? assignment.content : [],
          submission_count: assignment.assignment_student_submissions?.[0]?.count || 0
        })) || [];

        setAssignments(assignmentsWithCounts);
      } else {
        // Student view - get published assignments with their submissions (if any)
        const { data: assignmentsData, error } = await supabase
          .from('assignments')
          .select(`
            *,
            assignment_student_submissions!assignment_student_submissions_assignment_id_fkey(
              id,
              score,
              status,
              submitted_at
            )
          `)
          .eq('class_id', classId)
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Filter assignments to get user's submissions manually
        const filteredAssignments = assignmentsData?.map(assignment => {
          const userSubmission = assignment.assignment_student_submissions?.find(
            (sub: any) => sub.student_id === user?.id
          );
          return {
            ...assignment,
            assignment_student_submissions: userSubmission ? [userSubmission] : []
          };
        }) || [];

        const assignmentsWithSubmissions = filteredAssignments?.map(assignment => ({
          id: assignment.id,
          title: assignment.title || '',
          description: assignment.description || '',
          instructions: assignment.instructions || '',
          assignment_type: (assignment.assignment_type as 'notebook' | 'file_upload' | 'code_editor') || 'notebook',
          due_date: assignment.due_date,
          max_score: assignment.max_score || 100,
          allowed_file_types: assignment.allowed_file_types || ['py', 'ipynb', 'txt'],
          is_published: assignment.is_published || false,
          created_at: assignment.created_at,
          content: Array.isArray(assignment.content) ? assignment.content : [],
          my_submission: assignment.assignment_student_submissions?.[0] || null
        })) || [];

        setAssignments(assignmentsWithSubmissions);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast({
        title: "Error",
        description: "Failed to load assignments",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePublishAssignment = async (assignmentId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('assignments')
        .update({ is_published: !currentStatus })
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Assignment ${!currentStatus ? 'published' : 'unpublished'} successfully`
      });

      fetchAssignments();
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast({
        title: "Error",
        description: "Failed to update assignment",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [classId]);

  return {
    assignments,
    isLoading,
    fetchAssignments,
    togglePublishAssignment
  };
};
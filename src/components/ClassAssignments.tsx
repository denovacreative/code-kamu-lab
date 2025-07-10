import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AssignmentEditor from './AssignmentEditor';
import AssignmentSubmission from './AssignmentSubmission';
import { 
  ClipboardList, 
  Plus, 
  Calendar, 
  Clock, 
  Users, 
  Eye,
  Edit,
  CheckCircle,
  AlertCircle,
  Trophy,
  Upload,
  Code,
  BookOpen,
  FileText
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Assignment {
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

interface ClassAssignmentsProps {
  classId: string;
  userRole: 'teacher' | 'student';
  className?: string;
}

type ViewMode = 'list' | 'editor' | 'submission';

const ClassAssignments = ({ classId, userRole, className = "" }: ClassAssignmentsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewMode>('list');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    assignment_type: 'notebook' as 'notebook' | 'file_upload' | 'code_editor',
    due_date: '',
    max_score: 100
  });

  useEffect(() => {
    fetchAssignments();
  }, [classId]);

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
        // Student view - get published assignments with own submissions
        const { data: assignmentsData, error } = await supabase
          .from('assignments')
          .select(`
            *,
            assignment_student_submissions!inner(
              id,
              score,
              status,
              submitted_at
            )
          `)
          .eq('class_id', classId)
          .eq('is_published', true)
          .eq('assignment_student_submissions.student_id', user?.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const assignmentsWithSubmissions = assignmentsData?.map(assignment => ({
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

  const createAssignment = async () => {
    if (!newAssignment.title.trim()) {
      toast({
        title: "Error",
        description: "Assignment title is required",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('assignments')
        .insert({
          class_id: classId,
          teacher_id: user?.id,
          title: newAssignment.title.trim(),
          description: newAssignment.description.trim(),
          due_date: newAssignment.due_date || null,
          max_score: newAssignment.max_score,
          is_published: false
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Assignment created successfully"
      });

      setNewAssignment({
        title: '',
        description: '',
        assignment_type: 'notebook',
        due_date: '',
        max_score: 100
      });
      setShowCreateDialog(false);
      fetchAssignments();
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast({
        title: "Error",
        description: "Failed to create assignment",
        variant: "destructive"
      });
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

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return 'No due date';
    const date = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
  };

  const getStatusColor = (assignment: Assignment) => {
    if (userRole === 'student' && assignment.my_submission) {
      if (assignment.my_submission.score !== null) return 'bg-green-500';
      return 'bg-blue-500';
    }
    if (assignment.due_date && new Date(assignment.due_date) < new Date()) return 'bg-red-500';
    return 'bg-yellow-500';
  };

  const getStatusText = (assignment: Assignment) => {
    if (userRole === 'student' && assignment.my_submission) {
      if (assignment.my_submission.score !== null) return 'Graded';
      return 'Submitted';
    }
    if (assignment.due_date && new Date(assignment.due_date) < new Date()) return 'Overdue';
    return 'Active';
  };

  // Handle view changes
  const handleEditAssignment = (assignment: Assignment) => {
    setEditingAssignmentId(assignment.id);
    setCurrentView('editor');
  };

  const handleViewSubmission = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setCurrentView('submission');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedAssignment(null);
    setEditingAssignmentId(null);
    fetchAssignments(); // Refresh the list
  };

  const getAssignmentTypeIcon = (type: string) => {
    switch (type) {
      case 'notebook': return <BookOpen className="h-4 w-4" />;
      case 'file_upload': return <Upload className="h-4 w-4" />;
      case 'code_editor': return <Code className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getAssignmentTypeLabel = (type: string) => {
    switch (type) {
      case 'notebook': return 'Notebook';
      case 'file_upload': return 'File Upload';
      case 'code_editor': return 'Code Editor';
      default: return 'Assignment';
    }
  };

  // Render different views
  if (currentView === 'editor') {
    return (
      <AssignmentEditor
        assignmentId={editingAssignmentId || undefined}
        classId={classId}
        onBack={handleBackToList}
      />
    );
  }

  if (currentView === 'submission' && selectedAssignment) {
    return (
      <AssignmentSubmission
        assignment={selectedAssignment}
        onBack={handleBackToList}
      />
    );
  }

  if (isLoading) {
    return (
      <Card className={`h-full ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <ClipboardList className="h-5 w-5 mr-2 text-orange-600" />
            Assignments
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading assignments...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`h-full ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg">
            <ClipboardList className="h-5 w-5 mr-2 text-orange-600" />
            Assignments
          </CardTitle>
          
          {userRole === 'teacher' && (
            <Button 
              size="sm" 
              className="flex items-center"
              onClick={() => {
                setEditingAssignmentId(null);
                setCurrentView('editor');
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Create
            </Button>
          )}
        </div>
        
        <div className="text-sm text-muted-foreground">
          {assignments.length} assignment{assignments.length !== 1 ? 's' : ''} found
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {assignments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No assignments yet</p>
            {userRole === 'teacher' && (
              <p className="text-xs mt-1">Create your first assignment to get started</p>
            )}
          </div>
        ) : (
          assignments.map((assignment) => (
            <Card key={assignment.id} className="border-l-4 border-l-orange-500">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900 truncate">
                        {assignment.title}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {getAssignmentTypeIcon(assignment.assignment_type)}
                        <span className="ml-1">{getAssignmentTypeLabel(assignment.assignment_type)}</span>
                      </Badge>
                    </div>
                    {assignment.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {assignment.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Badge className={`text-white ${getStatusColor(assignment)}`}>
                      {getStatusText(assignment)}
                    </Badge>
                    
                    {userRole === 'teacher' && (
                      <Button
                        size="sm"
                        variant={assignment.is_published ? "default" : "outline"}
                        onClick={() => togglePublishAssignment(assignment.id, assignment.is_published)}
                        className="h-6 text-xs"
                      >
                        {assignment.is_published ? 'Published' : 'Draft'}
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500 mt-3">
                  <div className="flex items-center space-x-4">
                    {assignment.due_date && (
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDueDate(assignment.due_date)}
                      </span>
                    )}
                    
                    <span className="flex items-center">
                      <Trophy className="h-3 w-3 mr-1" />
                      {assignment.max_score} pts
                    </span>
                    
                    {userRole === 'teacher' && (
                      <span className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {assignment.submission_count} submission{assignment.submission_count !== 1 ? 's' : ''}
                      </span>
                    )}
                    
                    {userRole === 'student' && assignment.my_submission && assignment.my_submission.score !== null && (
                      <span className="flex items-center text-green-600 font-medium">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Score: {assignment.my_submission.score}/{assignment.max_score}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {userRole === 'student' ? (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 w-16 text-xs"
                        onClick={() => handleViewSubmission(assignment)}
                      >
                        {assignment.my_submission ? 'View' : 'Submit'}
                      </Button>
                    ) : (
                      <>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 w-6 p-0"
                          onClick={() => handleViewSubmission(assignment)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 w-6 p-0"
                          onClick={() => handleEditAssignment(assignment)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default ClassAssignments;
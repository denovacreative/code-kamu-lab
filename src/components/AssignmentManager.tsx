import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  Send, 
  Eye,
  Edit,
  Trash2,
  Plus,
  GraduationCap,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Assignment {
  id: string;
  notebook_id: string;
  teacher_id: string;
  student_id: string;
  status: string;
  assigned_at: string;
  submitted_at?: string;
  grade?: string;
  teacher_feedback?: string;
  notebooks: {
    title: string;
    description?: string;
    difficulty?: string;
    estimated_time?: number;
  };
}

interface Notebook {
  id: string;
  title: string;
  description?: string;
  difficulty?: string;
  estimated_time?: number;
}

interface Student {
  user_id: string;
  display_name?: string;
}

const AssignmentManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedNotebook, setSelectedNotebook] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (user) {
      fetchAssignments();
      fetchNotebooks();
      fetchStudents();
    }
  }, [user]);

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('notebook_assignments')
        .select(`
          *,
          notebooks (title, description, difficulty, estimated_time)
        `)
        .eq('teacher_id', user?.id)
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch assignments",
        variant: "destructive"
      });
    }
  };

  const fetchNotebooks = async () => {
    try {
      const { data, error } = await supabase
        .from('notebooks')
        .select('id, title, description, difficulty, estimated_time')
        .eq('created_by', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotebooks(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch notebooks",
        variant: "destructive"
      });
    }
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .eq('role', 'student');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch students",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createAssignment = async () => {
    if (!selectedNotebook || selectedStudents.length === 0) {
      toast({
        title: "Error",
        description: "Please select a notebook and at least one student",
        variant: "destructive"
      });
      return;
    }

    try {
      const assignments = selectedStudents.map(studentId => ({
        notebook_id: selectedNotebook,
        teacher_id: user?.id,
        student_id: studentId,
        status: 'assigned'
      }));

      const { error } = await supabase
        .from('notebook_assignments')
        .insert(assignments);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Assignment created for ${selectedStudents.length} student(s)`,
      });

      setShowCreateForm(false);
      setSelectedNotebook('');
      setSelectedStudents([]);
      setDueDate('');
      fetchAssignments();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create assignment",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      assigned: { color: 'bg-blue-100 text-blue-700', icon: BookOpen },
      in_progress: { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
      submitted: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
      graded: { color: 'bg-purple-100 text-purple-700', icon: GraduationCap },
      overdue: { color: 'bg-red-100 text-red-700', icon: AlertCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.assigned;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Assignment Management</h2>
          <p className="text-gray-600">Create and manage assignments for your students</p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-[hsl(var(--pictoblox-purple))] hover:bg-[hsl(var(--pictoblox-purple-dark))]"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Assignment
        </Button>
      </div>

      {/* Create Assignment Form */}
      {showCreateForm && (
        <Card className="border-2 border-[hsl(var(--pictoblox-purple))] animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Send className="h-5 w-5 mr-2" />
              Create New Assignment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Select Notebook
              </label>
              <Select value={selectedNotebook} onValueChange={setSelectedNotebook}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a notebook..." />
                </SelectTrigger>
                <SelectContent>
                  {notebooks.map((notebook) => (
                    <SelectItem key={notebook.id} value={notebook.id}>
                      <div className="flex items-center space-x-2">
                        <BookOpen className="h-4 w-4" />
                        <span>{notebook.title}</span>
                        {notebook.difficulty && (
                          <Badge variant="secondary" className="text-xs">
                            {notebook.difficulty}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Select Students ({selectedStudents.length} selected)
              </label>
              <div className="max-h-48 overflow-y-auto border rounded-md p-3 space-y-2">
                {students.map((student) => (
                  <label key={student.user_id} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.user_id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudents([...selectedStudents, student.user_id]);
                        } else {
                          setSelectedStudents(selectedStudents.filter(id => id !== student.user_id));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{student.display_name || 'Unknown Student'}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex space-x-3">
              <Button 
                onClick={createAssignment}
                className="bg-[hsl(var(--pictoblox-blue))] hover:bg-[hsl(var(--pictoblox-blue))/80]"
              >
                <Send className="h-4 w-4 mr-2" />
                Assign to Students
              </Button>
              <Button 
                onClick={() => setShowCreateForm(false)}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assignments List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignments.map((assignment) => (
          <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                    {assignment.notebooks.title}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mb-2">
                    Student: Unknown Student
                  </p>
                </div>
                {getStatusBadge(assignment.status)}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
                </div>
                
                {assignment.notebooks.difficulty && (
                  <div className="flex items-center text-sm text-gray-600">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Difficulty: {assignment.notebooks.difficulty}
                  </div>
                )}

                {assignment.notebooks.estimated_time && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    Est. Time: {assignment.notebooks.estimated_time} min
                  </div>
                )}

                {assignment.submitted_at && (
                  <div className="flex items-center text-sm text-green-600">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submitted: {new Date(assignment.submitted_at).toLocaleDateString()}
                  </div>
                )}

                {assignment.grade && (
                  <div className="p-2 bg-green-50 rounded border border-green-200">
                    <div className="text-sm font-medium text-green-800">
                      Grade: {assignment.grade}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-2 mt-4">
                <Button size="sm" variant="outline" className="flex-1">
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Edit className="h-3 w-3 mr-1" />
                  Grade
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {assignments.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments yet</h3>
          <p className="text-gray-600 mb-4">Create your first assignment to get started</p>
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="bg-[hsl(var(--pictoblox-purple))] hover:bg-[hsl(var(--pictoblox-purple-dark))]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Assignment
          </Button>
        </div>
      )}
    </div>
  );
};

export default AssignmentManager;
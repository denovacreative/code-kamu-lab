import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Save, 
  Eye, 
  FileText, 
  Code, 
  Upload, 
  Calendar,
  Trophy,
  ArrowLeft,
  BookOpen
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Assignment {
  id?: string;
  title: string;
  description: string;
  instructions: string;
  assignment_type: 'notebook' | 'file_upload' | 'code_editor';
  due_date: string | null;
  max_score: number;
  allowed_file_types: string[];
  is_published: boolean;
  content: any[];
}

interface AssignmentEditorProps {
  assignmentId?: string;
  classId: string;
  onBack: () => void;
  onSave?: (assignment: Assignment) => void;
}

const AssignmentEditor = ({ assignmentId, classId, onBack, onSave }: AssignmentEditorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignment, setAssignment] = useState<Assignment>({
    title: '',
    description: '',
    instructions: '',
    assignment_type: 'notebook',
    due_date: null,
    max_score: 100,
    allowed_file_types: ['py', 'ipynb', 'txt'],
    is_published: false,
    content: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (assignmentId) {
      loadAssignment();
    }
  }, [assignmentId]);

  const loadAssignment = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', assignmentId)
        .single();

      if (error) throw error;
      
      setAssignment({
        id: data.id,
        title: data.title || '',
        description: data.description || '',
        instructions: data.instructions || '',
        assignment_type: (data.assignment_type as 'notebook' | 'file_upload' | 'code_editor') || 'notebook',
        due_date: data.due_date ? new Date(data.due_date).toISOString().slice(0, 16) : null,
        max_score: data.max_score || 100,
        allowed_file_types: data.allowed_file_types || ['py', 'ipynb', 'txt'],
        is_published: data.is_published || false,
        content: Array.isArray(data.content) ? data.content : []
      });
    } catch (error) {
      console.error('Error loading assignment:', error);
      toast({
        title: "Error",
        description: "Failed to load assignment",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveAssignment = async () => {
    if (!assignment.title.trim()) {
      toast({
        title: "Error",
        description: "Assignment title is required",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSaving(true);
      
      const assignmentData = {
        class_id: classId,
        teacher_id: user?.id,
        title: assignment.title.trim(),
        description: assignment.description.trim(),
        instructions: assignment.instructions.trim(),
        assignment_type: assignment.assignment_type,
        due_date: assignment.due_date || null,
        max_score: assignment.max_score,
        allowed_file_types: assignment.allowed_file_types,
        is_published: assignment.is_published,
        content: assignment.content
      };

      let result;
      if (assignmentId) {
        result = await supabase
          .from('assignments')
          .update(assignmentData)
          .eq('id', assignmentId)
          .select()
          .single();
      } else {
        result = await supabase
          .from('assignments')
          .insert(assignmentData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      toast({
        title: "Success",
        description: `Assignment ${assignmentId ? 'updated' : 'created'} successfully`
      });

      if (onSave) {
        onSave(result.data);
      } else {
        onBack();
      }
    } catch (error) {
      console.error('Error saving assignment:', error);
      toast({
        title: "Error",
        description: `Failed to ${assignmentId ? 'update' : 'create'} assignment`,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const togglePublish = async () => {
    if (!assignmentId) return;
    
    try {
      const { error } = await supabase
        .from('assignments')
        .update({ is_published: !assignment.is_published })
        .eq('id', assignmentId);

      if (error) throw error;

      setAssignment(prev => ({ ...prev, is_published: !prev.is_published }));
      
      toast({
        title: "Success",
        description: `Assignment ${!assignment.is_published ? 'published' : 'unpublished'} successfully`
      });
    } catch (error) {
      console.error('Error toggling publish status:', error);
      toast({
        title: "Error",
        description: "Failed to update publish status",
        variant: "destructive"
      });
    }
  };

  const addFileType = (type: string) => {
    if (!assignment.allowed_file_types.includes(type)) {
      setAssignment(prev => ({
        ...prev,
        allowed_file_types: [...prev.allowed_file_types, type]
      }));
    }
  };

  const removeFileType = (type: string) => {
    setAssignment(prev => ({
      ...prev,
      allowed_file_types: prev.allowed_file_types.filter(t => t !== type)
    }));
  };

  if (isLoading) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading assignment...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack} className="text-white hover:bg-white/20">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-bold text-white">
            {assignmentId ? 'Edit Assignment' : 'Create Assignment'}
          </h1>
        </div>
        
        <div className="flex items-center space-x-2">
          {assignmentId && (
            <Button
              variant={assignment.is_published ? "default" : "outline"}
              onClick={togglePublish}
              className="text-white"
            >
              <Eye className="h-4 w-4 mr-2" />
              {assignment.is_published ? 'Published' : 'Draft'}
            </Button>
          )}
          
          <Button 
            onClick={saveAssignment} 
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Main Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-blue-600" />
            Assignment Details
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title*</label>
              <Input
                value={assignment.title}
                onChange={(e) => setAssignment(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Assignment title"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select 
                value={assignment.assignment_type} 
                onValueChange={(value: 'notebook' | 'file_upload' | 'code_editor') => 
                  setAssignment(prev => ({ ...prev, assignment_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="notebook">
                    <div className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Notebook (Interactive Coding)
                    </div>
                  </SelectItem>
                  <SelectItem value="file_upload">
                    <div className="flex items-center">
                      <Upload className="h-4 w-4 mr-2" />
                      File Upload (Project)
                    </div>
                  </SelectItem>
                  <SelectItem value="code_editor">
                    <div className="flex items-center">
                      <Code className="h-4 w-4 mr-2" />
                      Code Editor (Online Coding)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={assignment.description}
              onChange={(e) => setAssignment(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the assignment"
              rows={3}
            />
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Instructions</label>
            <Textarea
              value={assignment.instructions}
              onChange={(e) => setAssignment(prev => ({ ...prev, instructions: e.target.value }))}
              placeholder="Detailed instructions for students"
              rows={6}
            />
          </div>

          {/* Due Date and Score */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Due Date
              </label>
              <Input
                type="datetime-local"
                value={assignment.due_date || ''}
                onChange={(e) => setAssignment(prev => ({ ...prev, due_date: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center">
                <Trophy className="h-4 w-4 mr-1" />
                Max Score
              </label>
              <Input
                type="number"
                value={assignment.max_score}
                onChange={(e) => setAssignment(prev => ({ ...prev, max_score: parseInt(e.target.value) || 100 }))}
                min="1"
                max="1000"
              />
            </div>
          </div>

          {/* File Types (for file upload assignments) */}
          {assignment.assignment_type === 'file_upload' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Allowed File Types</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {assignment.allowed_file_types.map((type) => (
                  <Badge key={type} variant="secondary" className="cursor-pointer" onClick={() => removeFileType(type)}>
                    .{type} ×
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {['py', 'ipynb', 'txt', 'pdf', 'zip', 'js', 'html', 'css', 'json'].map((type) => (
                  !assignment.allowed_file_types.includes(type) && (
                    <Badge key={type} variant="outline" className="cursor-pointer" onClick={() => addFileType(type)}>
                      + .{type}
                    </Badge>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Assignment Preview */}
          {assignment.title && (
            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Preview:</h3>
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-lg">{assignment.title}</h4>
                  {assignment.description && (
                    <p className="text-gray-600 mt-1">{assignment.description}</p>
                  )}
                  <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                    <span>Type: {assignment.assignment_type.replace('_', ' ')}</span>
                    <span>Max Score: {assignment.max_score}</span>
                    {assignment.due_date && (
                      <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AssignmentEditor;
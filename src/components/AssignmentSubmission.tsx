import { useState, useEffect, useRef } from 'react';
import { useAutoSave } from '@/hooks/useAutoSave';
import CodeReview from './CodeReview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Upload, 
  FileText, 
  Code, 
  Send, 
  Save, 
  Download,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
  Play
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
  content: any[];
}

interface Submission {
  id?: string;
  assignment_id: string;
  student_id: string;
  submission_content: any[];
  submitted_files: { name: string; url: string; size: number }[];
  submitted_at: string;
  score: number | null;
  feedback: string | null;
  status: 'draft' | 'submitted' | 'graded';
}

interface AssignmentSubmissionProps {
  assignment: Assignment;
  onBack: () => void;
}

const AssignmentSubmission = ({ assignment, onBack }: AssignmentSubmissionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [submission, setSubmission] = useState<Submission>({
    assignment_id: assignment.id,
    student_id: user?.id || '',
    submission_content: [],
    submitted_files: [],
    submitted_at: new Date().toISOString(),
    score: null,
    feedback: null,
    status: 'draft'
  });
  
  const [codeContent, setCodeContent] = useState('# Write your code here\nprint("Hello, World!")');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCodeReview, setShowCodeReview] = useState(false);

  // Auto-save functionality
  const { isSaving, lastSavedText, saveNow } = useAutoSave({
    data: { codeContent, submission },
    onSave: async (data) => {
      if (submission.id && data.codeContent !== '') {
        await saveSubmission('draft'); // Auto-save as draft
      }
    },
    delay: 3000, // Save every 3 seconds
    enabled: assignment.assignment_type === 'code_editor'
  });

  useEffect(() => {
    loadExistingSubmission();
  }, [assignment.id]);

  const loadExistingSubmission = async () => {
    try {
      const { data, error } = await supabase
        .from('assignment_student_submissions')
        .select('*')
        .eq('assignment_id', assignment.id)
        .eq('student_id', user?.id)
        .single();

      if (data) {
        setSubmission({
          id: data.id,
          assignment_id: data.assignment_id,
          student_id: data.student_id,
          submission_content: Array.isArray(data.submission_content) ? data.submission_content : [],
          submitted_files: Array.isArray(data.submitted_files) 
            ? (data.submitted_files as { name: string; url: string; size: number }[])
            : [],
          submitted_at: data.submitted_at,
          score: data.score,
          feedback: data.feedback,
          status: data.status as 'draft' | 'submitted' | 'graded'
        });
        
        // Load code content if it's a code assignment
        if (assignment.assignment_type === 'code_editor' && data.submission_content?.[0]?.content) {
          setCodeContent(data.submission_content[0].content);
        }
      }
    } catch (error) {
      console.log('No existing submission found');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const uploadedFiles = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        
        if (!assignment.allowed_file_types.includes(fileExt || '')) {
          toast({
            title: "File Type Not Allowed",
            description: `${file.name} is not an allowed file type`,
            variant: "destructive"
          });
          continue;
        }
        
        const fileName = `${user?.id}/${assignment.id}/${Date.now()}-${file.name}`;
        
        const { data, error } = await supabase.storage
          .from('assignment-files')
          .upload(fileName, file);
          
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
          .from('assignment-files')
          .getPublicUrl(fileName);
          
        uploadedFiles.push({
          name: file.name,
          url: publicUrl,
          size: file.size
        });
        
        setUploadProgress(((i + 1) / files.length) * 100);
      }
      
      setSubmission(prev => ({
        ...prev,
        submitted_files: [...prev.submitted_files, ...uploadedFiles]
      }));
      
      toast({
        title: "Files Uploaded",
        description: `${uploadedFiles.length} file(s) uploaded successfully`
      });
      
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload files",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const removeFile = async (fileIndex: number) => {
    const file = submission.submitted_files[fileIndex];
    
    try {
      // Extract file path from URL
      const fileName = `${user?.id}/${assignment.id}/${file.name}`;
      
      const { error } = await supabase.storage
        .from('assignment-files')
        .remove([fileName]);
        
      if (error) throw error;
      
      setSubmission(prev => ({
        ...prev,
        submitted_files: prev.submitted_files.filter((_, i) => i !== fileIndex)
      }));
      
      toast({
        title: "File Removed",
        description: "File removed successfully"
      });
    } catch (error) {
      console.error('Error removing file:', error);
      toast({
        title: "Remove Failed",
        description: "Failed to remove file",
        variant: "destructive"
      });
    }
  };

  const saveSubmission = async (status: 'draft' | 'submitted' = 'draft') => {
    try {
      setIsSubmitting(true);
      
      let submissionContent = submission.submission_content;
      
      if (assignment.assignment_type === 'code_editor') {
        submissionContent = [{
          type: 'code',
          content: codeContent,
          language: 'python'
        }];
      }
      
      const submissionData = {
        assignment_id: assignment.id,
        student_id: user?.id,
        submission_content: submissionContent,
        submitted_files: submission.submitted_files,
        status,
        submitted_at: status === 'submitted' ? new Date().toISOString() : submission.submitted_at
      };
      
      let result;
      if (submission.id) {
        result = await supabase
          .from('assignment_student_submissions')
          .update(submissionData)
          .eq('id', submission.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('assignment_student_submissions')
          .insert(submissionData)
          .select()
          .single();
      }
      
      if (result.error) throw result.error;
      
      setSubmission(prev => ({
        ...prev,
        id: result.data.id,
        status,
        submitted_at: result.data.submitted_at
      }));
      
      toast({
        title: "Success",
        description: status === 'submitted' ? "Assignment submitted successfully!" : "Draft saved"
      });
      
    } catch (error) {
      console.error('Error saving submission:', error);
      toast({
        title: "Error",
        description: "Failed to save submission",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isOverdue = assignment.due_date && new Date(assignment.due_date) < new Date();
  const canSubmit = !isOverdue && submission.status !== 'submitted';

  const getSubmitButtonText = () => {
    if (isSubmitting) return 'Submitting...';
    if (submission.status === 'submitted') return 'Submitted';
    return 'Submit Assignment';
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
          <h1 className="text-xl font-bold text-white">{assignment.title}</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant={submission.status === 'graded' ? 'default' : submission.status === 'submitted' ? 'secondary' : 'outline'}>
            {submission.status === 'graded' && <CheckCircle className="h-3 w-3 mr-1" />}
            {submission.status === 'submitted' && <Clock className="h-3 w-3 mr-1" />}
            {submission.status === 'draft' && <FileText className="h-3 w-3 mr-1" />}
            {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
          </Badge>
          
          {assignment.due_date && (
            <Badge variant={isOverdue ? "destructive" : "outline"}>
              {isOverdue ? (
                <>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Overdue
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3 mr-1" />
                  Due: {new Date(assignment.due_date).toLocaleDateString()}
                </>
              )}
            </Badge>
          )}
        </div>
      </div>

      {/* Assignment Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg">
            {assignment.title}
            {assignment.assignment_type === 'code_editor' && (
              <div className="flex items-center space-x-2 text-sm font-normal">
                <span className={`text-xs ${isSaving ? 'text-blue-600' : 'text-green-600'}`}>
                  {isSaving ? 'Saving...' : `Last saved: ${lastSavedText}`}
                </span>
                <Button size="sm" variant="outline" onClick={saveNow}>
                  Save Now
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {assignment.description && (
            <p className="text-gray-700">{assignment.description}</p>
          )}
          
          {assignment.instructions && (
            <div className="border-l-4 border-l-blue-500 pl-4 bg-blue-50 p-3 rounded-r">
              <h4 className="font-medium mb-2">Instructions:</h4>
              <pre className="whitespace-pre-wrap text-sm text-gray-700">{assignment.instructions}</pre>
            </div>
          )}
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Type: {assignment.assignment_type.replace('_', ' ')}</span>
            <span>Max Score: {assignment.max_score} points</span>
            {assignment.assignment_type === 'file_upload' && (
              <span>Allowed: {assignment.allowed_file_types.map(t => `.${t}`).join(', ')}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submission Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            {assignment.assignment_type === 'code_editor' ? (
              <Code className="h-5 w-5 mr-2 text-green-600" />
            ) : (
              <Upload className="h-5 w-5 mr-2 text-orange-600" />
            )}
            Your Submission
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Code Editor Interface */}
          {assignment.assignment_type === 'code_editor' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Code:</label>
                <Button size="sm" variant="outline" disabled={!canSubmit}>
                  <Play className="h-3 w-3 mr-1" />
                  Run Code
                </Button>
              </div>
              
              <Textarea
                value={codeContent}
                onChange={(e) => setCodeContent(e.target.value)}
                placeholder="Write your code here..."
                className="font-mono text-sm h-64 resize-none"
                disabled={!canSubmit}
              />
            </div>
          )}

          {/* File Upload Interface */}
          {assignment.assignment_type === 'file_upload' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Upload Files:</label>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!canSubmit || isUploading}
                >
                  <Upload className="h-3 w-3 mr-1" />
                  {isUploading ? 'Uploading...' : 'Choose Files'}
                </Button>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={assignment.allowed_file_types.map(t => `.${t}`).join(',')}
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
              
              {isUploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} />
                  <p className="text-sm text-gray-600">Uploading... {uploadProgress.toFixed(0)}%</p>
                </div>
              )}
              
              {/* Uploaded Files */}
              {submission.submitted_files.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Uploaded Files:</h4>
                  {submission.submitted_files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="ghost" onClick={() => window.open(file.url, '_blank')}>
                          <Download className="h-3 w-3" />
                        </Button>
                        {canSubmit && (
                          <Button size="sm" variant="ghost" onClick={() => removeFile(index)}>
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-600">
              {submission.status === 'submitted' && (
                <span>Submitted on {new Date(submission.submitted_at).toLocaleString()}</span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {canSubmit && (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => saveSubmission('draft')}
                    disabled={isSubmitting}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </Button>
                  
                  <div className="flex space-x-2">
                    {submission.id && assignment.assignment_type === 'code_editor' && (
                      <Button
                        variant="outline"
                        onClick={() => setShowCodeReview(!showCodeReview)}
                      >
                        {showCodeReview ? 'Hide' : 'Show'} Code Review
                      </Button>
                    )}
                    <Button 
                      onClick={() => saveSubmission('submitted')}
                      disabled={isSubmitting}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {getSubmitButtonText()}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback & Grade */}
      {submission.status === 'graded' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              Feedback & Grade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">Your Score:</span>
              <Badge variant="default" className="text-lg px-4 py-2">
                {submission.score}/{assignment.max_score} points
              </Badge>
            </div>
            
            {submission.feedback && (
              <div className="border-l-4 border-l-green-500 pl-4 bg-green-50 p-3 rounded-r">
                <h4 className="font-medium mb-2">Teacher Feedback:</h4>
                <p className="text-gray-700">{submission.feedback}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Code Review Section */}
      {showCodeReview && submission.id && assignment.assignment_type === 'code_editor' && (
        <CodeReview
          assignmentId={assignment.id}
          submissionId={submission.id}
          code={codeContent}
          readOnly={submission.status === 'submitted'}
        />
      )}
    </div>
  );
};

export default AssignmentSubmission;
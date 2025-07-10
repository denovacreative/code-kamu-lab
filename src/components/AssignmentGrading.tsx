import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Trophy,
  MessageSquare,
  ArrowLeft,
  Clock
} from 'lucide-react';
import { Assignment } from '@/types/assignment';

interface AssignmentGradingProps {
  assignment: Assignment;
  onBack: () => void;
}

interface Submission {
  id: string;
  student_id: string;
  student_name: string;
  submitted_at: string;
  status: string;
  score: number | null;
  feedback: string | null;
  submission_content: any;
  submitted_files: any;
}

const AssignmentGrading = ({ assignment, onBack }: AssignmentGradingProps) => {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const loadSubmissions = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('assignment_student_submissions')
        .select(`
          *,
          profiles!assignment_student_submissions_student_id_fkey (
            display_name
          )
        `)
        .eq('assignment_id', assignment.id);

      if (error) throw error;

      const formattedSubmissions = (data || []).map(sub => ({
        id: sub.id,
        student_id: sub.student_id,
        student_name: (sub.profiles as any)?.display_name || 'Unknown Student',
        submitted_at: sub.submitted_at,
        status: sub.status,
        score: sub.score,
        feedback: sub.feedback,
        submission_content: sub.submission_content,
        submitted_files: sub.submitted_files
      }));

      setSubmissions(formattedSubmissions);
    } catch (error) {
      console.error('Error loading submissions:', error);
      toast({
        title: "Error",
        description: "Failed to load submissions",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const gradeSubmission = async () => {
    if (!selectedSubmission) return;

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('assignment_student_submissions')
        .update({
          score: score,
          feedback: feedback,
          status: 'graded'
        })
        .eq('id', selectedSubmission.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Submission graded successfully"
      });

      loadSubmissions();
      setSelectedSubmission(null);
      setScore(0);
      setFeedback('');
    } catch (error) {
      console.error('Error grading submission:', error);
      toast({
        title: "Error",
        description: "Failed to grade submission",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, [assignment.id]);

  const getStatusBadge = (status: string, score: number | null) => {
    if (score !== null) {
      return <Badge className="bg-green-500 text-white">Graded</Badge>;
    }
    switch (status) {
      case 'submitted':
        return <Badge className="bg-blue-500 text-white">Submitted</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack} className="text-white hover:bg-white/20">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-bold text-white">
            Grading: {assignment.title}
          </h1>
        </div>
        
        <Badge variant="outline" className="text-white border-white/30">
          {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Assignment Info */}
      <Card className="bg-white/95 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{assignment.title}</h3>
              {assignment.description && (
                <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
              )}
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              {assignment.due_date && (
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Due: {new Date(assignment.due_date).toLocaleDateString()}
                </span>
              )}
              <span className="flex items-center">
                <Trophy className="h-4 w-4 mr-1" />
                {assignment.max_score} points
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions List */}
      <div className="grid gap-4">
        {isLoading ? (
          <Card className="bg-white/95 backdrop-blur-sm">
            <CardContent className="flex items-center justify-center h-32">
              <div className="animate-pulse text-muted-foreground">Loading submissions...</div>
            </CardContent>
          </Card>
        ) : submissions.length === 0 ? (
          <Card className="bg-white/95 backdrop-blur-sm">
            <CardContent className="text-center py-8">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-muted-foreground">No submissions yet</p>
            </CardContent>
          </Card>
        ) : (
          submissions.map((submission) => (
            <Card key={submission.id} className="bg-white/95 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h4 className="font-medium">{submission.student_name}</h4>
                      <p className="text-sm text-gray-600">
                        Submitted: {new Date(submission.submitted_at).toLocaleString()}
                      </p>
                    </div>
                    {getStatusBadge(submission.status, submission.score)}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {submission.score !== null && (
                      <Badge variant="outline">
                        Score: {submission.score}/{assignment.max_score}
                      </Badge>
                    )}
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setScore(submission.score || 0);
                            setFeedback(submission.feedback || '');
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {submission.score !== null ? 'Review' : 'Grade'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>
                            Grade Submission - {submission.student_name}
                          </DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          {/* Submission Content */}
                          <div>
                            <label className="text-sm font-medium">Submission:</label>
                            <div className="mt-2 p-3 bg-gray-50 rounded border max-h-40 overflow-y-auto">
                              <pre className="text-sm whitespace-pre-wrap">
                                {JSON.stringify(submission.submission_content, null, 2)}
                              </pre>
                            </div>
                          </div>
                          
                          {/* Grading Form */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">Score</label>
                              <input
                                type="number"
                                min="0"
                                max={assignment.max_score}
                                value={score}
                                onChange={(e) => setScore(Number(e.target.value))}
                                className="mt-1 w-full p-2 border rounded"
                                placeholder="Enter score"
                              />
                              <p className="text-xs text-gray-600 mt-1">
                                Max: {assignment.max_score} points
                              </p>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium">Grade</label>
                              <div className="mt-1 p-2 bg-gray-50 border rounded">
                                {((score / assignment.max_score) * 100).toFixed(1)}%
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium">Feedback</label>
                            <textarea
                              value={feedback}
                              onChange={(e) => setFeedback(e.target.value)}
                              className="mt-1 w-full p-2 border rounded"
                              rows={4}
                              placeholder="Provide feedback to the student..."
                            />
                          </div>
                          
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setSelectedSubmission(null)}>
                              Cancel
                            </Button>
                            <Button onClick={gradeSubmission} disabled={isLoading}>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Save Grade
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                
                {submission.feedback && (
                  <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                    <p className="text-sm font-medium text-blue-800">Feedback:</p>
                    <p className="text-sm text-blue-700">{submission.feedback}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AssignmentGrading;
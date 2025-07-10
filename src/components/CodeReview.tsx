import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  Eye, 
  Clock,
  User,
  Code
} from 'lucide-react';

interface Comment {
  id: string;
  line_number: number;
  content: string;
  author_name: string;
  created_at: string;
  type: 'suggestion' | 'question' | 'issue' | 'praise';
}

interface CodeReviewProps {
  assignmentId: string;
  submissionId: string;
  code: string;
  readOnly?: boolean;
  onCommentAdd?: (comment: Comment) => void;
}

const CodeReview = ({ 
  assignmentId, 
  submissionId, 
  code, 
  readOnly = false,
  onCommentAdd 
}: CodeReviewProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [commentType, setCommentType] = useState<'suggestion' | 'question' | 'issue' | 'praise'>('suggestion');
  const [showCommentForm, setShowCommentForm] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [submissionId]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('code_review_comments')
        .select(`
          *,
          profiles!code_review_comments_author_id_fkey(display_name)
        `)
        .eq('submission_id', submissionId)
        .order('line_number', { ascending: true });

      if (error) throw error;

      const formattedComments = (data || []).map(comment => ({
        id: comment.id,
        line_number: comment.line_number,
        content: comment.content,
        author_name: (comment.profiles as any)?.display_name || 'Unknown',
        created_at: comment.created_at,
        type: comment.type
      }));

      setComments(formattedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || selectedLine === null) return;

    try {
      const { data, error } = await supabase
        .from('code_review_comments')
        .insert({
          submission_id: submissionId,
          assignment_id: assignmentId,
          author_id: user?.id,
          line_number: selectedLine,
          content: newComment.trim(),
          type: commentType
        })
        .select(`
          *,
          profiles!code_review_comments_author_id_fkey(display_name)
        `)
        .single();

      if (error) throw error;

      const newCommentObj: Comment = {
        id: data.id,
        line_number: data.line_number,
        content: data.content,
        author_name: (data.profiles as any)?.display_name || 'Unknown',
        created_at: data.created_at,
        type: data.type
      };

      setComments(prev => [...prev, newCommentObj]);
      setNewComment('');
      setSelectedLine(null);
      setShowCommentForm(false);
      
      if (onCommentAdd) {
        onCommentAdd(newCommentObj);
      }

      toast({
        title: "Comment Added",
        description: "Your review comment has been added successfully."
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      });
    }
  };

  const getCommentIcon = (type: string) => {
    switch (type) {
      case 'praise': return <ThumbsUp className="h-4 w-4 text-green-600" />;
      case 'issue': return <ThumbsDown className="h-4 w-4 text-red-600" />;
      case 'question': return <MessageSquare className="h-4 w-4 text-blue-600" />;
      case 'suggestion': return <Eye className="h-4 w-4 text-yellow-600" />;
      default: return <MessageSquare className="h-4 w-4 text-gray-600" />;
    }
  };

  const getCommentBadgeColor = (type: string) => {
    switch (type) {
      case 'praise': return 'bg-green-100 text-green-700';
      case 'issue': return 'bg-red-100 text-red-700';
      case 'question': return 'bg-blue-100 text-blue-700';
      case 'suggestion': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const codeLines = code.split('\n');
  const lineComments = comments.reduce((acc, comment) => {
    acc[comment.line_number] = acc[comment.line_number] || [];
    acc[comment.line_number].push(comment);
    return acc;
  }, {} as Record<number, Comment[]>);

  return (
    <div className="space-y-6">
      {/* Code Display with Line Numbers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Code className="h-5 w-5 mr-2" />
            Code Review
            <Badge className="ml-2 bg-blue-100 text-blue-700">
              {comments.length} comment{comments.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
            {codeLines.map((line, index) => {
              const lineNumber = index + 1;
              const hasComments = lineComments[lineNumber]?.length > 0;
              
              return (
                <div key={lineNumber} className="group">
                  <div 
                    className={`flex items-start hover:bg-gray-100 ${
                      selectedLine === lineNumber ? 'bg-blue-50' : ''
                    } ${hasComments ? 'bg-yellow-50' : ''}`}
                  >
                    <div 
                      className={`w-12 text-right pr-4 py-1 text-gray-500 select-none cursor-pointer ${
                        !readOnly ? 'hover:text-blue-600' : ''
                      }`}
                      onClick={() => {
                        if (!readOnly) {
                          setSelectedLine(lineNumber);
                          setShowCommentForm(true);
                        }
                      }}
                    >
                      {lineNumber}
                    </div>
                    <div className="flex-1 py-1 whitespace-pre-wrap break-all">
                      {line || ' '}
                    </div>
                    {hasComments && (
                      <div className="flex items-center space-x-1 px-2">
                        {lineComments[lineNumber].map(comment => (
                          <div key={comment.id} className="text-xs">
                            {getCommentIcon(comment.type)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Comments for this line */}
                  {hasComments && (
                    <div className="ml-12 mt-2 space-y-2">
                      {lineComments[lineNumber].map(comment => (
                        <div key={comment.id} className="bg-white border rounded-lg p-3 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-gray-600" />
                              <span className="text-sm font-medium">{comment.author_name}</span>
                              <Badge className={`text-xs ${getCommentBadgeColor(comment.type)}`}>
                                {comment.type}
                              </Badge>
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(comment.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <p className="text-sm text-gray-700">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Comment Form */}
      {!readOnly && showCommentForm && selectedLine !== null && (
        <Card>
          <CardHeader>
            <CardTitle>Add Comment for Line {selectedLine}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              {(['suggestion', 'question', 'issue', 'praise'] as const).map(type => (
                <Button
                  key={type}
                  variant={commentType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCommentType(type)}
                  className="capitalize"
                >
                  {getCommentIcon(type)}
                  <span className="ml-1">{type}</span>
                </Button>
              ))}
            </div>
            
            <Textarea
              placeholder="Enter your review comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCommentForm(false);
                  setSelectedLine(null);
                  setNewComment('');
                }}
              >
                Cancel
              </Button>
              <Button onClick={addComment} disabled={!newComment.trim()}>
                Add Comment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {!readOnly && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">
              Click on any line number to add a review comment. Use different comment types to provide specific feedback.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CodeReview;
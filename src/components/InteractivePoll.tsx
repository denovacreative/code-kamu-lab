import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart3, 
  Plus, 
  Vote, 
  Users, 
  Clock, 
  CheckCircle,
  XCircle,
  Play,
  Square
} from 'lucide-react';

interface PollOption {
  id: string;
  text: string;
  votes: number;
  voters: string[];
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  totalVotes: number;
  allowMultiple?: boolean;
  showResults?: boolean;
}

interface InteractivePollProps {
  classId: string;
  userRole: 'teacher' | 'student';
}

const InteractivePoll = ({ classId, userRole }: InteractivePollProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [polls, setPolls] = useState<Poll[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptions, setNewPollOptions] = useState(['', '']);
  const [myVotes, setMyVotes] = useState<Record<string, string[]>>({});
  const [liveResults, setLiveResults] = useState<Record<string, PollOption[]>>({});

  useEffect(() => {
    loadPolls();
    setupRealtimeSubscription();
  }, [classId]);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`polls-${classId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'class_activities',
          filter: `class_id=eq.${classId}`
        },
        (payload) => {
          if (payload.new && (payload.new as any).activity_type === 'poll') {
            loadPolls();
          }
        }
      )
      .on('broadcast', { event: 'poll_vote' }, ({ payload }) => {
        updatePollResults(payload.pollId, payload.optionId, payload.userId, payload.action);
      })
      .on('broadcast', { event: 'poll_status' }, ({ payload }) => {
        updatePollStatus(payload.pollId, payload.isActive);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadPolls = async () => {
    try {
      const { data, error } = await supabase
        .from('class_activities')
        .select('*')
        .eq('class_id', classId)
        .eq('activity_type', 'poll')
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const pollsData = data?.map(activity => {
        const poll = JSON.parse(activity.content);
        return {
          ...poll,
          id: activity.id,
          createdAt: activity.timestamp
        };
      }) || [];

      setPolls(pollsData);

      // Load my votes
      const { data: voteData, error: voteError } = await supabase
        .from('class_activities')
        .select('*')
        .eq('class_id', classId)
        .eq('activity_type', 'poll_vote')
        .eq('user_id', user?.id);

      if (!voteError && voteData) {
        const votes: Record<string, string[]> = {};
        voteData.forEach(vote => {
          const voteContent = JSON.parse(vote.content);
          if (!votes[voteContent.pollId]) {
            votes[voteContent.pollId] = [];
          }
          votes[voteContent.pollId].push(voteContent.optionId);
        });
        setMyVotes(votes);
      }
    } catch (error) {
      console.error('Error loading polls:', error);
    }
  };

  const createPoll = async () => {
    if (!newPollQuestion.trim() || newPollOptions.some(opt => !opt.trim())) {
      toast({
        title: "Error",
        description: "Please fill in the question and all options",
        variant: "destructive"
      });
      return;
    }

    const poll: Omit<Poll, 'id' | 'createdAt'> = {
      question: newPollQuestion,
      options: newPollOptions.filter(opt => opt.trim()).map((option, index) => ({
        id: `option_${index}`,
        text: option.trim(),
        votes: 0,
        voters: []
      })),
      isActive: true,
      createdBy: user?.id || '',
      totalVotes: 0,
      allowMultiple: false,
      showResults: false
    };

    try {
      const { error } = await supabase
        .from('class_activities')
        .insert({
          class_id: classId,
          user_id: user?.id,
          activity_type: 'poll',
          content: JSON.stringify(poll),
          timestamp: new Date().toISOString()
        });

      if (error) throw error;

      setNewPollQuestion('');
      setNewPollOptions(['', '']);
      setShowCreateForm(false);
      loadPolls();
      
      toast({
        title: "Poll Created",
        description: "Your poll has been created and is now active"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create poll",
        variant: "destructive"
      });
    }
  };

  const vote = async (pollId: string, optionId: string) => {
    const existingVotes = myVotes[pollId] || [];
    
    if (existingVotes.includes(optionId)) {
      // Remove vote
      const newVotes = existingVotes.filter(v => v !== optionId);
      setMyVotes(prev => ({ ...prev, [pollId]: newVotes }));
      
      // Delete vote from database
      await supabase
        .from('class_activities')
        .delete()
        .eq('class_id', classId)
        .eq('activity_type', 'poll_vote')
        .eq('user_id', user?.id)
        .eq('content', JSON.stringify({ pollId, optionId }));

      // Broadcast vote removal
      const channel = supabase.channel(`polls-${classId}`);
      channel.send({
        type: 'broadcast',
        event: 'poll_vote',
        payload: {
          pollId,
          optionId,
          userId: user?.id,
          action: 'remove'
        }
      });
    } else {
      // Add vote
      const newVotes = [...existingVotes, optionId];
      setMyVotes(prev => ({ ...prev, [pollId]: newVotes }));

      // Save vote to database
      await supabase
        .from('class_activities')
        .insert({
          class_id: classId,
          user_id: user?.id,
          activity_type: 'poll_vote',
          content: JSON.stringify({ pollId, optionId }),
          timestamp: new Date().toISOString()
        });

      // Broadcast new vote
      const channel = supabase.channel(`polls-${classId}`);
      channel.send({
        type: 'broadcast',
        event: 'poll_vote',
        payload: {
          pollId,
          optionId,
          userId: user?.id,
          action: 'add'
        }
      });
    }
  };

  const togglePollStatus = async (pollId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    
    try {
      // Update poll status in database
      const { error } = await supabase
        .from('class_activities')
        .update({
          content: JSON.stringify({
            ...polls.find(p => p.id === pollId),
            isActive: newStatus
          })
        })
        .eq('id', pollId);

      if (error) throw error;

      // Broadcast status change
      const channel = supabase.channel(`polls-${classId}`);
      channel.send({
        type: 'broadcast',
        event: 'poll_status',
        payload: {
          pollId,
          isActive: newStatus
        }
      });

      loadPolls();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update poll status",
        variant: "destructive"
      });
    }
  };

  const updatePollResults = (pollId: string, optionId: string, userId: string, action: 'add' | 'remove') => {
    setLiveResults(prev => {
      const current = prev[pollId] || [];
      const updated = current.map(option => {
        if (option.id === optionId) {
          if (action === 'add' && !option.voters.includes(userId)) {
            return {
              ...option,
              votes: option.votes + 1,
              voters: [...option.voters, userId]
            };
          } else if (action === 'remove' && option.voters.includes(userId)) {
            return {
              ...option,
              votes: option.votes - 1,
              voters: option.voters.filter(v => v !== userId)
            };
          }
        }
        return option;
      });
      
      return { ...prev, [pollId]: updated };
    });
  };

  const updatePollStatus = (pollId: string, isActive: boolean) => {
    setPolls(prev => prev.map(poll => 
      poll.id === pollId ? { ...poll, isActive } : poll
    ));
  };

  const addOption = () => {
    setNewPollOptions([...newPollOptions, '']);
  };

  const removeOption = (index: number) => {
    if (newPollOptions.length > 2) {
      setNewPollOptions(newPollOptions.filter((_, i) => i !== index));
    }
  };

  const getVotePercentage = (votes: number, total: number) => {
    return total === 0 ? 0 : Math.round((votes / total) * 100);
  };

  return (
    <div className="space-y-4">
      {/* Create Poll Form (Teacher Only) */}
      {userRole === 'teacher' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center text-lg">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                Interactive Polls
              </CardTitle>
              <Button
                onClick={() => setShowCreateForm(!showCreateForm)}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Create Poll
              </Button>
            </div>
          </CardHeader>
          
          {showCreateForm && (
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Question</label>
                <Textarea
                  value={newPollQuestion}
                  onChange={(e) => setNewPollQuestion(e.target.value)}
                  placeholder="Enter your poll question..."
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Options</label>
                <div className="space-y-2 mt-1">
                  {newPollOptions.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={option}
                        onChange={(e) => {
                          const updated = [...newPollOptions];
                          updated[index] = e.target.value;
                          setNewPollOptions(updated);
                        }}
                        placeholder={`Option ${index + 1}`}
                      />
                      {newPollOptions.length > 2 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeOption(index)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Option
                  </Button>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={createPoll}>
                  Create Poll
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Active Polls */}
      <div className="space-y-4">
        {polls.map((poll) => {
          const myPollVotes = myVotes[poll.id] || [];
          const totalVotes = poll.options.reduce((sum, opt) => sum + (liveResults[poll.id]?.find(lr => lr.id === opt.id)?.votes || opt.votes), 0);
          
          return (
            <Card key={poll.id} className={`${poll.isActive ? 'border-green-200 bg-green-50/50' : 'border-gray-200'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Vote className="h-4 w-4 text-blue-600" />
                      <Badge variant={poll.isActive ? "default" : "secondary"}>
                        {poll.isActive ? 'Active' : 'Closed'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        {totalVotes} votes
                      </Badge>
                    </div>
                    <h3 className="font-medium text-gray-900">{poll.question}</h3>
                  </div>
                  
                  {userRole === 'teacher' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePollStatus(poll.id, poll.isActive)}
                    >
                      {poll.isActive ? (
                        <>
                          <Square className="h-4 w-4 mr-1" />
                          Close
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-1" />
                          Reopen
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {poll.options.map((option) => {
                  const liveOption = liveResults[poll.id]?.find(lr => lr.id === option.id);
                  const votes = liveOption?.votes || option.votes;
                  const percentage = getVotePercentage(votes, totalVotes);
                  const hasVoted = myPollVotes.includes(option.id);
                  
                  return (
                    <div key={option.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-1">
                          <Button
                            variant={hasVoted ? "default" : "outline"}
                            size="sm"
                            onClick={() => vote(poll.id, option.id)}
                            disabled={!poll.isActive}
                            className="flex items-center space-x-2"
                          >
                            {hasVoted && <CheckCircle className="h-4 w-4" />}
                            <span>{option.text}</span>
                          </Button>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>{votes} votes</span>
                          <span>({percentage}%)</span>
                        </div>
                      </div>
                      
                      {(poll.showResults || !poll.isActive || hasVoted) && (
                        <Progress value={percentage} className="h-2" />
                      )}
                    </div>
                  );
                })}
                
                {!poll.isActive && (
                  <div className="text-xs text-gray-500 flex items-center mt-3">
                    <Clock className="h-3 w-3 mr-1" />
                    Poll closed on {new Date(poll.createdAt).toLocaleDateString()}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        
        {polls.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No polls yet</p>
              {userRole === 'teacher' && (
                <p className="text-sm text-gray-400 mt-1">Create your first poll to engage with students</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InteractivePoll;
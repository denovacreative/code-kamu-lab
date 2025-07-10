import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Terminal, 
  Users, 
  Send,
  Minimize2,
  Maximize2,
  Play,
  User,
  Circle
} from 'lucide-react';

interface TerminalMessage {
  id: string;
  user_id: string;
  username: string;
  message: string;
  type: 'command' | 'output' | 'system';
  timestamp: string;
}

interface LiveTerminalProps {
  notebookId?: string;
  isVisible: boolean;
  onToggle: () => void;
}

const LiveTerminal = ({ notebookId, isVisible, onToggle }: LiveTerminalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<TerminalMessage[]>([]);
  const [input, setInput] = useState('');
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (isVisible && user) {
      initializeTerminalSession();
      setupRealtimeSubscription();
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [isVisible, user, notebookId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeTerminalSession = async () => {
    try {
      // Create or get existing terminal session
      const { data: existingSession } = await supabase
        .from('terminal_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('notebook_id', notebookId)
        .eq('is_active', true)
        .single();

      if (existingSession) {
        setSessionId(existingSession.id);
        loadSessionHistory(existingSession.id);
      } else {
        const { data: newSession, error } = await supabase
          .from('terminal_sessions')
          .insert({
            user_id: user?.id,
            notebook_id: notebookId,
            session_data: { messages: [] },
            is_active: true
          })
          .select()
          .single();

        if (error) throw error;
        setSessionId(newSession.id);
        
        // Add welcome message
        addSystemMessage('Terminal session started. You can execute Python commands here.');
      }
    } catch (error) {
      console.error('Error initializing terminal session:', error);
      toast({
        title: "Error",
        description: "Failed to initialize terminal session",
        variant: "destructive"
      });
    }
  };

  const loadSessionHistory = (sessionId: string) => {
    // In a real implementation, you'd load chat history from the database
    // For now, start with a welcome message
    addSystemMessage('Terminal session resumed. Continue your Python commands.');
  };

  const setupRealtimeSubscription = () => {
    const channelName = notebookId ? `terminal:${notebookId}` : `terminal:global`;
    
    channelRef.current = supabase
      .channel(channelName)
      .on('presence', { event: 'sync' }, () => {
        const newState = channelRef.current.presenceState();
        const users = Object.values(newState).flat();
        setActiveUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', leftPresences);
      })
      .on('broadcast', { event: 'terminal_message' }, ({ payload }) => {
        setMessages(prev => [...prev, payload]);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const presenceTrackStatus = await channelRef.current.track({
            user_id: user?.id,
            username: user?.email?.split('@')[0] || 'Anonymous',
            online_at: new Date().toISOString(),
          });
          console.log('Presence track status:', presenceTrackStatus);
        }
      });
  };

  const addSystemMessage = (content: string) => {
    const message: TerminalMessage = {
      id: Date.now().toString(),
      user_id: 'system',
      username: 'System',
      message: content,
      type: 'system',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, message]);
  };

  const executeCommand = async (command: string) => {
    // Add command to messages
    const commandMessage: TerminalMessage = {
      id: Date.now().toString(),
      user_id: user?.id || '',
      username: user?.email?.split('@')[0] || 'You',
      message: command,
      type: 'command',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, commandMessage]);

    // Broadcast to other users
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'terminal_message',
        payload: commandMessage
      });
    }

    try {
      // Execute Python command
      const { data, error } = await supabase.functions.invoke('python-compiler', {
        body: { code: command }
      });

      const output = data?.output || data?.error || 'No output';
      
      const outputMessage: TerminalMessage = {
        id: (Date.now() + 1).toString(),
        user_id: 'system',
        username: 'Python',
        message: output,
        type: 'output',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, outputMessage]);

      // Broadcast output to other users
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'terminal_message',
          payload: outputMessage
        });
      }

      // Update session data
      if (sessionId) {
        await supabase
          .from('terminal_sessions')
          .update({
            last_activity: new Date().toISOString(),
            session_data: { 
              messages: messages.concat([commandMessage, outputMessage]).slice(-50) // Keep last 50 messages
            }
          })
          .eq('id', sessionId);
      }

    } catch (error) {
      const errorMessage: TerminalMessage = {
        id: (Date.now() + 1).toString(),
        user_id: 'system',
        username: 'Error',
        message: `Error: ${error.message}`,
        type: 'output',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      executeCommand(input.trim());
      setInput('');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'command': return 'text-blue-400';
      case 'output': return 'text-green-400';
      case 'system': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  if (!isVisible) return null;

  return (
    <Card className={`${isFullscreen ? 'fixed inset-4 z-50' : 'h-full'} bg-gray-900 text-green-400 border-gray-700`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CardTitle className="text-lg flex items-center text-green-400">
              <Terminal className="h-4 w-4 mr-2" />
              Live Python Terminal
            </CardTitle>
            {activeUsers.length > 0 && (
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-400" />
                <Badge variant="outline" className="text-xs text-blue-400 border-blue-400">
                  {activeUsers.length} online
                </Badge>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="text-green-400 hover:text-green-300 hover:bg-gray-800"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="text-green-400 hover:text-green-300 hover:bg-gray-800"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Active Users */}
        {activeUsers.length > 0 && (
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-gray-400">Active users:</span>
            {activeUsers.slice(0, 5).map((activeUser, index) => (
              <div key={index} className="flex items-center space-x-1">
                <Circle className="h-2 w-2 fill-green-400 text-green-400" />
                <span className="text-blue-400">{activeUser.username}</span>
              </div>
            ))}
            {activeUsers.length > 5 && (
              <span className="text-gray-400">+{activeUsers.length - 5} more</span>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Terminal Messages */}
        <div 
          className="bg-black rounded-md p-3 font-mono text-sm overflow-y-auto mb-3"
          style={{ height: isFullscreen ? '60vh' : '16rem' }}
        >
          {messages.map((message) => (
            <div key={message.id} className={`mb-1 ${getMessageTypeColor(message.type)}`}>
              <span className="text-gray-500 text-xs">
                [{new Date(message.timestamp).toLocaleTimeString()}]
              </span>
              {message.type === 'command' && (
                <span className="text-blue-400 ml-2">{message.username}@python:</span>
              )}
              {message.type === 'system' && (
                <span className="text-yellow-400 ml-2">[{message.username}]</span>
              )}
              {message.type === 'output' && (
                <span className="text-gray-400 ml-2">out:</span>
              )}
              <span className="ml-1">{message.message}</span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex items-center space-x-2">
          <span className="text-blue-400">{'>>>'}</span>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type Python code here..."
            className="bg-gray-800 border-gray-600 text-green-400 font-mono text-sm flex-1"
          />
          <Button
            onClick={() => {
              if (input.trim()) {
                executeCommand(input.trim());
                setInput('');
              }
            }}
            size="sm"
            variant="outline"
            className="text-green-400 border-green-400 hover:bg-green-400 hover:text-black"
          >
            <Send className="h-3 w-3" />
          </Button>
        </div>

        {/* Terminal Info */}
        <div className="mt-3 text-xs text-gray-500">
          <div className="flex justify-between">
            <span>Session: {sessionId?.slice(-8) || 'Not connected'}</span>
            <span>Real-time collaboration enabled</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveTerminal;
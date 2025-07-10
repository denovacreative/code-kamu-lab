import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, Send, Users, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  user_id: string;
  message: string;
  message_type: string;
  created_at: string;
  profiles?: {
    display_name: string;
    role: string;
  };
}

interface ClassChatProps {
  classId: string;
  className?: string;
}

const ClassChat = ({ classId, className = "" }: ClassChatProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch initial messages
  useEffect(() => {
    fetchMessages();
  }, [classId]);

  // Setup realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`class-chat-${classId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'class_messages',
          filter: `class_id=eq.${classId}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
          
          // Show toast for new messages from others
          if (newMessage.user_id !== user?.id) {
            toast({
              title: "New Message",
              description: newMessage.profiles?.display_name || "Someone sent a message"
            });
          }
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        setOnlineUsers(Object.keys(newState).length);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        setOnlineUsers(prev => prev + newPresences.length);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        setOnlineUsers(prev => prev - leftPresences.length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && user) {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString()
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [classId, user]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      // First get messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('class_messages')
        .select('*')
        .eq('class_id', classId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(100);

      if (messagesError) throw messagesError;

      // Then get profiles for all users
      const userIds = [...new Set(messagesData?.map(m => m.user_id) || [])];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, role')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Combine messages with profiles
      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
      const messagesWithProfiles = messagesData?.map(message => ({
        ...message,
        profiles: profilesMap.get(message.user_id)
      })) || [];

      setMessages(messagesWithProfiles);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load chat messages",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('class_messages')
        .insert({
          class_id: classId,
          user_id: user.id,
          message: newMessage.trim(),
          message_type: 'text'
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error", 
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'teacher': return 'bg-blue-500';
      case 'student': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <Card className={`h-full ${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-lg">
            <MessageCircle className="h-5 w-5 mr-2 text-blue-600" />
            Class Chat
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading chat...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg">
            <MessageCircle className="h-5 w-5 mr-2 text-blue-600" />
            Class Chat
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              {onlineUsers} online
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 min-h-0">
        {/* Messages Area */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 mb-4 border rounded-lg p-3 bg-gray-50">
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => {
                const isOwnMessage = message.user_id === user?.id;
                
                return (
                  <div
                    key={message.id}
                    className={`flex items-start space-x-2 ${
                      isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''
                    }`}
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className={`text-xs text-white ${getRoleColor(message.profiles?.role)}`}>
                        {getInitials(message.profiles?.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className={`flex-1 min-w-0 ${isOwnMessage ? 'text-right' : ''}`}>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {message.profiles?.display_name || 'Unknown User'}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {message.profiles?.role === 'teacher' ? 'Guru' : 'Siswa'}
                        </Badge>
                        <span className="text-xs text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTime(message.created_at)}
                        </span>
                      </div>
                      
                      <div className={`
                        inline-block max-w-xs lg:max-w-md px-3 py-2 rounded-lg text-sm
                        ${isOwnMessage 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white border border-gray-200 text-gray-900'
                        }
                      `}>
                        {message.message}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="flex space-x-2 flex-shrink-0">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1"
            maxLength={500}
          />
          <Button 
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            size="sm"
            className="px-3"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground mt-1 text-center">
          Press Enter to send • {newMessage.length}/500
        </p>
      </CardContent>
    </Card>
  );
};

export default ClassChat;
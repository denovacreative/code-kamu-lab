import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import NotebookCanvas from './NotebookCanvas';
import { 
  Play, 
  Plus, 
  Trash2, 
  Users, 
  Clock,
  Eye,
  Code,
  Image as ImageIcon,
  Activity,
  MonitorSpeaker
} from 'lucide-react';

interface NotebookCell {
  id: string;
  type: 'code' | 'markdown';
  content: string;
  output?: string;
  outputType?: 'text' | 'image' | 'html' | 'error';
  executionTime?: number;
  isExecuting?: boolean;
  executionCount?: number;
  lastExecuted?: Date;
  edited_by?: string;
  edited_by_name?: string;
}

interface ClassUser {
  user_id: string;
  username: string;
  is_online: boolean;
  active_cell?: string;
  cursor_position?: any;
  last_activity: string;
}

interface LiveCollaborativeNotebookProps {
  classId: string;
  className: string;
  userRole: 'teacher' | 'student';
  initialCells?: NotebookCell[];
  onClose: () => void;
}

const LiveCollaborativeNotebook = ({ 
  classId, 
  className, 
  userRole, 
  initialCells = [], 
  onClose 
}: LiveCollaborativeNotebookProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cells, setCells] = useState<NotebookCell[]>(initialCells);
  const [activeCell, setActiveCell] = useState<string | null>(null);
  const [globalExecutionCount, setGlobalExecutionCount] = useState(1);
  const [sessionVariables, setSessionVariables] = useState<Record<string, any>>({});
  const [classUsers, setClassUsers] = useState<ClassUser[]>([]);
  const [showCanvas, setShowCanvas] = useState(false);
  const [showUsersList, setShowUsersList] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  
  const textareaRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({});
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (classId && user) {
      initializeCollaboration();
      setupRealtimeSubscription();
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [classId, user]);

  useEffect(() => {
    // Auto-save notebook content periodically
    const saveInterval = setInterval(() => {
      saveNotebookToDatabase();
    }, 30000); // Save every 30 seconds

    return () => clearInterval(saveInterval);
  }, [cells]);

  const initializeCollaboration = async () => {
    try {
      // Load latest notebook content
      const { data: classData, error } = await supabase
        .from('classes')
        .select('notebook_content')
        .eq('id', classId)
        .single();

      if (error) throw error;

      if (classData?.notebook_content && Array.isArray(classData.notebook_content)) {
        setCells(classData.notebook_content as NotebookCell[]);
      }

      // Update user session
      await supabase
        .from('class_sessions')
        .upsert({
          class_id: classId,
          user_id: user?.id,
          session_data: { last_sync: new Date().toISOString() },
          last_activity: new Date().toISOString(),
          is_online: true
        });

      // Log activity
      await supabase
        .from('class_activities')
        .insert({
          class_id: classId,
          user_id: user?.id,
          activity_type: 'join',
          content: `${userRole} joined the notebook session`
        });

    } catch (error) {
      console.error('Error initializing collaboration:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    const channelName = `class_${classId}`;
    
    channelRef.current = supabase
      .channel(channelName)
      .on('presence', { event: 'sync' }, () => {
        const newState = channelRef.current.presenceState();
        const users = Object.values(newState).flat() as ClassUser[];
        setClassUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', leftPresences);
      })
      .on('broadcast', { event: 'cell_update' }, ({ payload }) => {
        if (payload.user_id !== user?.id) {
          handleRemoteCellUpdate(payload);
        }
      })
      .on('broadcast', { event: 'cell_execute' }, ({ payload }) => {
        if (payload.user_id !== user?.id) {
          handleRemoteCellExecution(payload);
        }
      })
      .on('broadcast', { event: 'notebook_sync' }, ({ payload }) => {
        if (payload.user_id !== user?.id) {
          setCells(payload.cells);
          setLastSyncTime(new Date());
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const presenceTrackStatus = await channelRef.current.track({
            user_id: user?.id,
            username: user?.email?.split('@')[0] || 'Anonymous',
            is_online: true,
            active_cell: activeCell,
            last_activity: new Date().toISOString(),
          });
          console.log('Presence track status:', presenceTrackStatus);
        }
      });
  };

  const handleRemoteCellUpdate = (payload: any) => {
    setCells(prev => prev.map(cell => 
      cell.id === payload.cell_id 
        ? { 
            ...cell, 
            content: payload.content,
            edited_by: payload.user_id,
            edited_by_name: payload.username
          } 
        : cell
    ));
  };

  const handleRemoteCellExecution = (payload: any) => {
    setCells(prev => prev.map(cell => 
      cell.id === payload.cell_id 
        ? { 
            ...cell, 
            output: payload.output,
            outputType: payload.outputType,
            executionTime: payload.executionTime,
            executionCount: payload.executionCount,
            isExecuting: false,
            lastExecuted: new Date(payload.timestamp)
          } 
        : cell
    ));

    // Auto-show canvas if plot detected
    if (payload.outputType === 'image' || payload.output?.includes('plt.show()')) {
      setShowCanvas(true);
    }
  };

  const executePythonCode = async (code: string, cellId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('python-compiler', {
        body: { 
          code,
          session_id: cellId,
          context: sessionVariables,
          class_id: classId
        }
      });

      if (error) throw error;

      // Update session variables
      if (data.variables) {
        setSessionVariables(prev => ({ ...prev, ...data.variables }));
      }

      let outputType = 'text';
      if (data.error) {
        outputType = 'error';
      } else if (data.output && (data.output.includes('<img') || data.output.includes('data:image') || data.output.includes('plt.show'))) {
        outputType = 'image';
        setShowCanvas(true); // Auto-show canvas for plots
      } else if (data.output && data.output.includes('<')) {
        outputType = 'html';
      }

      return {
        output: data.output || data.error || 'No output',
        outputType,
        executionTime: data.execution_time || 0,
        variables: data.variables
      };
    } catch (error) {
      return {
        output: `Error: ${error.message}`,
        outputType: 'error',
        executionTime: 0
      };
    }
  };

  const executeCell = async (cellId: string) => {
    const cell = cells.find(c => c.id === cellId);
    if (!cell || cell.type !== 'code') return;

    setCells(cells.map(c => 
      c.id === cellId ? { ...c, isExecuting: true } : c
    ));

    try {
      const result = await executePythonCode(cell.content, cellId);
      const executionCount = globalExecutionCount;
      setGlobalExecutionCount(prev => prev + 1);
      
      const updatedCell = {
        ...cell,
        output: result.output,
        outputType: result.outputType as any,
        executionTime: result.executionTime,
        executionCount,
        lastExecuted: new Date(),
        isExecuting: false
      };

      setCells(cells.map(c => c.id === cellId ? updatedCell : c));

      // Broadcast execution to other users
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'cell_execute',
          payload: {
            cell_id: cellId,
            output: result.output,
            outputType: result.outputType,
            executionTime: result.executionTime,
            executionCount,
            timestamp: new Date().toISOString(),
            user_id: user?.id,
            username: user?.email?.split('@')[0] || 'Anonymous'
          }
        });
      }

      // Log activity
      await supabase
        .from('class_activities')
        .insert({
          class_id: classId,
          user_id: user?.id,
          activity_type: 'cell_execute',
          cell_id: cellId,
          content: `Executed: ${cell.content.substring(0, 100)}...`
        });

    } catch (error) {
      setCells(cells.map(c => 
        c.id === cellId ? { 
          ...c, 
          output: `Error: ${error}`, 
          outputType: 'error' as any,
          executionTime: 0,
          isExecuting: false 
        } : c
      ));
    }
  };

  const updateCellContent = (cellId: string, content: string) => {
    setCells(cells.map(cell => 
      cell.id === cellId ? { ...cell, content } : cell
    ));

    // Broadcast change to other users (debounced)
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'cell_update',
        payload: {
          cell_id: cellId,
          content,
          user_id: user?.id,
          username: user?.email?.split('@')[0] || 'Anonymous'
        }
      });
    }
  };

  const addCell = (type: 'code' | 'markdown' = 'code', index?: number) => {
    const newCell: NotebookCell = {
      id: Date.now().toString(),
      type,
      content: type === 'code' ? '# New code cell\n' : '# Markdown Cell\nWrite your markdown here...',
      output: '',
      executionCount: 0
    };
    
    let newCells;
    if (index !== undefined) {
      newCells = [...cells];
      newCells.splice(index + 1, 0, newCell);
    } else {
      newCells = [...cells, newCell];
    }
    
    setCells(newCells);
    setActiveCell(newCell.id);

    // Sync with other users
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'notebook_sync',
        payload: {
          cells: newCells,
          user_id: user?.id,
          username: user?.email?.split('@')[0] || 'Anonymous'
        }
      });
    }
  };

  const deleteCell = (cellId: string) => {
    if (cells.length === 1) return;
    const newCells = cells.filter(cell => cell.id !== cellId);
    setCells(newCells);
    
    if (activeCell === cellId) {
      setActiveCell(newCells[0]?.id || null);
    }

    // Sync with other users
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'notebook_sync',
        payload: {
          cells: newCells,
          user_id: user?.id,
          username: user?.email?.split('@')[0] || 'Anonymous'
        }
      });
    }
  };

  const saveNotebookToDatabase = async () => {
    try {
      await supabase
        .from('classes')
        .update({ 
          notebook_content: cells as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', classId);
    } catch (error) {
      console.error('Error saving notebook:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, cellId: string) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      executeCell(cellId);
    } else if (e.shiftKey && e.key === 'Enter') {
      e.preventDefault();
      executeCell(cellId);
      const currentIndex = cells.findIndex(c => c.id === cellId);
      if (currentIndex < cells.length - 1) {
        setActiveCell(cells[currentIndex + 1].id);
      } else {
        addCell('code', currentIndex);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--pictoblox-purple))] to-[hsl(var(--pictoblox-purple-dark))]">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={onClose}
            >
              ← Back
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center">
                <Code className="h-5 w-5 mr-2" />
                {className} - Live Notebook
              </h1>
              <div className="flex items-center space-x-2 text-white/80 text-sm">
                <Badge variant="outline" className="text-white border-white/30">
                  {userRole}
                </Badge>
                <span>•</span>
                <span>Last sync: {lastSyncTime.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUsersList(!showUsersList)}
              className="text-white hover:bg-white/20"
            >
              <Users className="h-4 w-4 mr-2" />
              {classUsers.length} online
            </Button>
            
            {showUsersList && (
              <div className="absolute top-16 right-4 bg-white rounded-lg shadow-lg p-3 z-50">
                <h3 className="font-semibold mb-2">Online Users</h3>
                <div className="space-y-2">
                  {classUsers.map((classUser) => (
                    <div key={classUser.user_id} className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {classUser.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{classUser.username}</span>
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white/95 backdrop-blur-sm p-4 border-b border-white/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => addCell('code')}
              size="sm"
              className="bg-[hsl(var(--pictoblox-blue))] hover:bg-[hsl(var(--pictoblox-blue))/80]"
            >
              <Plus className="h-4 w-4 mr-1" />
              Code
            </Button>
            <Button
              onClick={() => addCell('markdown')}
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Markdown
            </Button>
            <Button
              onClick={() => setShowCanvas(!showCanvas)}
              variant={showCanvas ? "default" : "outline"}
              size="sm"
              className={showCanvas ? "bg-[hsl(var(--pictoblox-blue))]" : ""}
            >
              <ImageIcon className="h-4 w-4 mr-1" />
              Canvas
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              {cells.length} cells
            </Badge>
            <Badge variant="outline" className="bg-blue-100 text-blue-700">
              Session: {Object.keys(sessionVariables).length} vars
            </Badge>
            <Badge variant="outline" className="bg-purple-100 text-purple-700">
              <Activity className="h-3 w-3 mr-1" />
              Live
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-6">
        <div className={`max-w-7xl mx-auto grid gap-6 h-full ${showCanvas ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Notebook Cells */}
          <div className="space-y-4 overflow-y-auto">
            {cells.map((cell, index) => (
              <Card
                key={cell.id}
                className={`border-2 transition-all duration-200 ${
                  activeCell === cell.id 
                    ? 'border-[hsl(var(--pictoblox-purple))] shadow-lg' 
                    : 'border-gray-200 hover:border-gray-300'
                } bg-white/95 backdrop-blur-sm ${
                  cell.edited_by && cell.edited_by !== user?.id ? 'ring-2 ring-blue-300' : ''
                }`}
                onClick={() => setActiveCell(cell.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={cell.type === 'code' ? 'default' : 'secondary'}
                        className={cell.type === 'code' ? 'bg-[hsl(var(--pictoblox-blue))]' : ''}
                      >
                        {cell.type === 'code' ? `Code [${cell.executionCount || ' '}]` : 'Markdown'} [{index + 1}]
                      </Badge>
                      {cell.isExecuting && (
                        <Badge variant="outline" className="text-orange-600 border-orange-300 animate-pulse">
                          Executing...
                        </Badge>
                      )}
                      {cell.executionTime && cell.executionTime > 0 && (
                        <Badge variant="outline" className="text-blue-600 border-blue-300">
                          <Clock className="h-3 w-3 mr-1" />
                          {cell.executionTime.toFixed(0)}ms
                        </Badge>
                      )}
                      {cell.edited_by_name && cell.edited_by !== user?.id && (
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          <Eye className="h-3 w-3 mr-1" />
                          {cell.edited_by_name}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          const currentIndex = cells.findIndex(c => c.id === cell.id);
                          addCell('code', currentIndex);
                        }}
                        size="sm"
                        variant="outline"
                        className="text-blue-600 border-blue-300 hover:bg-blue-50"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      {cell.type === 'code' && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            executeCell(cell.id);
                          }}
                          size="sm"
                          variant="outline"
                          disabled={cell.isExecuting}
                          className="text-green-600 border-green-300 hover:bg-green-50"
                        >
                          <Play className="h-3 w-3 mr-1" />
                          {cell.isExecuting ? 'Running...' : 'Run'}
                        </Button>
                      )}
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCell(cell.id);
                        }}
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <Textarea
                    ref={(el) => (textareaRefs.current[cell.id] = el)}
                    value={cell.content}
                    onChange={(e) => updateCellContent(cell.id, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, cell.id)}
                    placeholder={
                      cell.type === 'code' 
                        ? "# Write your Python code here...\n# Press Ctrl+Enter to run\n# Press Shift+Enter to run and create new cell"
                        : "Write your markdown here..."
                    }
                    className="min-h-24 font-mono text-sm resize-none border-0 focus:ring-0 bg-gray-50"
                    style={{ 
                      height: Math.max(96, cell.content.split('\n').length * 24 + 48) + 'px'
                    }}
                  />
                  
                  {/* Enhanced Output Display */}
                  {cell.type === 'code' && cell.output !== undefined && (
                    <div className="mt-3">
                      {cell.outputType === 'error' ? (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                          <div className="text-red-600 text-xs mb-1 font-semibold">Error:</div>
                          <pre className="text-red-800 text-sm whitespace-pre-wrap font-mono">
                            {cell.output}
                          </pre>
                        </div>
                      ) : cell.outputType === 'image' ? (
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                          <div className="text-gray-600 text-xs mb-2">Output:</div>
                          <div dangerouslySetInnerHTML={{ __html: cell.output }} />
                        </div>
                      ) : cell.outputType === 'html' ? (
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                          <div className="text-gray-600 text-xs mb-2">HTML Output:</div>
                          <div dangerouslySetInnerHTML={{ __html: cell.output }} />
                        </div>
                      ) : (
                        <div className="p-3 bg-gray-900 text-green-400 rounded-md border border-gray-700">
                          <div className="text-gray-400 text-xs mb-1">Output:</div>
                          <pre className="whitespace-pre-wrap font-mono text-sm">
                            {cell.output || '(no output)'}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Canvas Panel */}
          {showCanvas && (
            <NotebookCanvas 
              isVisible={showCanvas} 
              onToggle={() => setShowCanvas(false)} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveCollaborativeNotebook;
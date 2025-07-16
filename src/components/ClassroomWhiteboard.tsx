import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Palette,
  Pen,
  Eraser,
  Circle,
  Square,
  Minus,
  Download,
  Upload,
  Trash2,
  Users,
  Eye,
  MousePointer,
  Type,
  Save
} from 'lucide-react';

interface DrawingData {
  id: string;
  type: 'draw' | 'line' | 'circle' | 'rectangle' | 'text';
  points?: number[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color: string;
  strokeWidth: number;
  text?: string;
  userId: string;
  timestamp: number;
}

interface WhiteboardProps {
  classId: string;
  userRole: 'teacher' | 'student';
  isReadOnly?: boolean;
}

const ClassroomWhiteboard = ({ classId, userRole, isReadOnly = false }: WhiteboardProps) => {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<'pen' | 'eraser' | 'line' | 'circle' | 'rectangle' | 'text' | 'pointer'>('pen');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState([3]);
  const [drawings, setDrawings] = useState<DrawingData[]>([]);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [cursors, setCursors] = useState<Record<string, { x: number; y: number; name: string; color: string }>>({});

  // Colors palette
  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB',
    '#A52A2A', '#808080', '#000080', '#008000', '#800000'
  ];

  useEffect(() => {
    setupRealtimeSubscription();
    loadExistingDrawings();
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [classId]);

  const channelRef = useRef<any>(null);

  const setupRealtimeSubscription = () => {
    channelRef.current = supabase
      .channel(`whiteboard-${classId}`)
      .on('broadcast', { event: 'drawing' }, ({ payload }) => {
        if (payload.userId !== user?.id) {
          const drawingData = payload as DrawingData;
          setDrawings(prev => [...prev, drawingData]);
          drawOnCanvas(drawingData);
        }
      })
      .on('broadcast', { event: 'cursor' }, ({ payload }) => {
        if (payload.userId !== user?.id) {
          setCursors(prev => ({
            ...prev,
            [payload.userId]: {
              x: payload.x,
              y: payload.y,
              name: payload.name,
              color: payload.color
            }
          }));
        }
      })
      .on('broadcast', { event: 'clear' }, ({ payload }) => {
        if (payload.userId !== user?.id) {
          clearCanvas();
          setDrawings([]);
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const newState = channelRef.current.presenceState();
        setOnlineUsers(Object.keys(newState).length);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        setOnlineUsers(prev => prev + newPresences.length);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        setOnlineUsers(prev => prev - leftPresences.length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && user) {
          await channelRef.current.track({
            userId: user.id,
            name: user.email?.split('@')[0] || 'Anonymous',
            online_at: new Date().toISOString()
          });
        }
      });
  };

  const loadExistingDrawings = async () => {
    try {
      const { data, error } = await supabase
        .from('class_activities')
        .select('content')
        .eq('class_id', classId)
        .eq('activity_type', 'whiteboard_drawing')
        .order('timestamp', { ascending: true });

      if (error) throw error;

      const allDrawings: DrawingData[] = [];
      data?.forEach(activity => {
        if (activity.content) {
          const drawing = JSON.parse(activity.content);
          allDrawings.push(drawing);
        }
      });

      setDrawings(allDrawings);
      redrawCanvas(allDrawings);
    } catch (error) {
      console.error('Error loading drawings:', error);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const redrawCanvas = (drawingsData: DrawingData[]) => {
    clearCanvas();
    drawingsData.forEach(drawing => {
      drawOnCanvas(drawing);
    });
  };

  const drawOnCanvas = (drawingData: DrawingData) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = drawingData.color;
    ctx.lineWidth = drawingData.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (drawingData.type) {
      case 'draw':
        if (drawingData.points && drawingData.points.length >= 4) {
          ctx.beginPath();
          ctx.moveTo(drawingData.points[0], drawingData.points[1]);
          for (let i = 2; i < drawingData.points.length; i += 2) {
            ctx.lineTo(drawingData.points[i], drawingData.points[i + 1]);
          }
          ctx.stroke();
        }
        break;
      case 'line':
        if (drawingData.points && drawingData.points.length === 4) {
          ctx.beginPath();
          ctx.moveTo(drawingData.points[0], drawingData.points[1]);
          ctx.lineTo(drawingData.points[2], drawingData.points[3]);
          ctx.stroke();
        }
        break;
      case 'circle':
        if (drawingData.x && drawingData.y && drawingData.width) {
          ctx.beginPath();
          ctx.arc(drawingData.x, drawingData.y, drawingData.width / 2, 0, 2 * Math.PI);
          ctx.stroke();
        }
        break;
      case 'rectangle':
        if (drawingData.x && drawingData.y && drawingData.width && drawingData.height) {
          ctx.beginPath();
          ctx.rect(drawingData.x, drawingData.y, drawingData.width, drawingData.height);
          ctx.stroke();
        }
        break;
      case 'text':
        if (drawingData.x && drawingData.y && drawingData.text) {
          ctx.fillStyle = drawingData.color;
          ctx.font = `${drawingData.strokeWidth * 4}px Arial`;
          ctx.fillText(drawingData.text, drawingData.x, drawingData.y);
        }
        break;
    }
  };

  const startDrawing = (event: React.MouseEvent) => {
    if (isReadOnly && userRole === 'student') return;
    
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (currentTool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        const drawingData: DrawingData = {
          id: Date.now().toString(),
          type: 'text',
          x,
          y,
          color: currentColor,
          strokeWidth: strokeWidth[0],
          text,
          userId: user?.id || '',
          timestamp: Date.now()
        };
        
        setDrawings(prev => [...prev, drawingData]);
        drawOnCanvas(drawingData);
        broadcastDrawing(drawingData);
        saveDrawing(drawingData);
      }
      setIsDrawing(false);
      return;
    }

    // Start new drawing for other tools
    setDrawings(prev => [...prev, {
      id: Date.now().toString(),
      type: currentTool === 'pen' || currentTool === 'eraser' ? 'draw' : currentTool as any,
      points: [x, y],
      x: currentTool !== 'pen' && currentTool !== 'eraser' && currentTool !== 'line' ? x : undefined,
      y: currentTool !== 'pen' && currentTool !== 'eraser' && currentTool !== 'line' ? y : undefined,
      color: currentTool === 'eraser' ? '#FFFFFF' : currentColor,
      strokeWidth: strokeWidth[0],
      userId: user?.id || '',
      timestamp: Date.now()
    }]);
  };

  const draw = (event: React.MouseEvent) => {
    if (!isDrawing || isReadOnly && userRole === 'student') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Broadcast cursor position
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'cursor',
        payload: {
          userId: user?.id,
          x: x,
          y: y,
          name: user?.email?.split('@')[0] || 'Anonymous',
          color: currentColor
        }
      });
    }

    if (currentTool === 'pen' || currentTool === 'eraser') {
      setDrawings(prev => {
        const newDrawings = [...prev];
        const lastDrawing = newDrawings[newDrawings.length - 1];
        if (lastDrawing && lastDrawing.points) {
          lastDrawing.points.push(x, y);
        }
        return newDrawings;
      });

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = currentTool === 'eraser' ? '#FFFFFF' : currentColor;
        ctx.lineWidth = strokeWidth[0];
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
      }
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    const lastDrawing = drawings[drawings.length - 1];
    if (lastDrawing) {
      broadcastDrawing(lastDrawing);
      saveDrawing(lastDrawing);
    }
  };

  const broadcastDrawing = (drawingData: DrawingData) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'drawing',
        payload: drawingData
      });
    }
  };

  const saveDrawing = async (drawingData: DrawingData) => {
    try {
      await supabase
        .from('class_activities')
        .insert({
          class_id: classId,
          user_id: user?.id,
          activity_type: 'whiteboard_drawing',
          content: JSON.stringify(drawingData),
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error saving drawing:', error);
    }
  };

  const clearWhiteboard = async () => {
    clearCanvas();
    setDrawings([]);
    
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'clear',
        payload: { userId: user?.id }
      });
    }

    try {
      await supabase
        .from('class_activities')
        .delete()
        .eq('class_id', classId)
        .eq('activity_type', 'whiteboard_drawing');
    } catch (error) {
      console.error('Error clearing whiteboard:', error);
    }
  };

  const downloadWhiteboard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = `whiteboard-${classId}-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const getToolIcon = (tool: string) => {
    switch (tool) {
      case 'pen': return Pen;
      case 'eraser': return Eraser;
      case 'line': return Minus;
      case 'circle': return Circle;
      case 'rectangle': return Square;
      case 'text': return Type;
      case 'pointer': return MousePointer;
      default: return Pen;
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <Card className="bg-white/95 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-lg">
              <Palette className="h-5 w-5 mr-2 text-purple-600" />
              Interactive Whiteboard
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                <Users className="h-3 w-3 mr-1" />
                {onlineUsers} online
              </Badge>
              {userRole === 'teacher' && (
                <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700">Teacher Mode</Badge>
              )}
              {isReadOnly && (
                <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300">
                  <Eye className="h-3 w-3 mr-1" />
                  Read Only
                </Badge>
              )}
            </div>
          </div>

          {/* Tools */}
          <div className="flex flex-wrap items-center gap-2 mt-3 p-3 bg-gray-50 rounded-lg">
            {/* Drawing Tools */}
            <div className="flex items-center space-x-1 bg-white rounded-lg p-1 shadow-sm">
              {['pen', 'eraser', 'line', 'circle', 'rectangle', 'text', 'pointer'].map((tool) => {
                const IconComponent = getToolIcon(tool);
                return (
                  <Button
                    key={tool}
                    variant={currentTool === tool ? "default" : "ghost"}
                    size="sm"
                    className={`h-8 w-8 p-0 ${currentTool === tool ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    onClick={() => setCurrentTool(tool as any)}
                    disabled={isReadOnly && userRole === 'student'}
                    title={tool.charAt(0).toUpperCase() + tool.slice(1)}
                  >
                    <IconComponent className="h-4 w-4" />
                  </Button>
                );
              })}
            </div>

            {/* Colors */}
            <div className="flex items-center space-x-1 bg-white rounded-lg p-1 shadow-sm">
              {colors.map((color) => (
                <button
                  key={color}
                  className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${currentColor === color ? 'border-gray-800 shadow-md' : 'border-gray-300 hover:border-gray-500'}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setCurrentColor(color)}
                  disabled={isReadOnly && userRole === 'student'}
                  title={`Color: ${color}`}
                />
              ))}
            </div>

            {/* Stroke Width */}
            <div className="flex items-center space-x-2 bg-white rounded-lg p-2 shadow-sm">
              <span className="text-xs text-gray-600 font-medium">Size:</span>
              <Slider
                value={strokeWidth}
                onValueChange={setStrokeWidth}
                max={20}
                min={1}
                step={1}
                className="w-20"
                disabled={isReadOnly && userRole === 'student'}
              />
              <span className="text-xs text-gray-600 w-6 font-bold">{strokeWidth[0]}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-1 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadWhiteboard}
                className="bg-white shadow-sm"
              >
                <Download className="h-4 w-4 mr-1" />
                Save Image
              </Button>
              {userRole === 'teacher' && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={clearWhiteboard}
                  className="shadow-sm"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Canvas Area */}
      <Card className="flex-1 bg-white/95 backdrop-blur-sm">
        <CardContent className="p-2 h-full">
          <div className="relative h-full bg-white border-2 border-dashed border-gray-200 rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="absolute inset-0 cursor-crosshair w-full h-full"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              style={{ 
                cursor: currentTool === 'pointer' ? 'default' : 
                       currentTool === 'eraser' ? 'crosshair' : 
                       currentTool === 'text' ? 'text' : 'crosshair'
              }}
            />
            
            {/* Collaborative Cursors */}
            {Object.entries(cursors).map(([userId, cursor]) => (
              <div
                key={userId}
                className="absolute pointer-events-none z-10"
                style={{
                  left: cursor.x,
                  top: cursor.y,
                  transform: 'translate(-2px, -2px)'
                }}
              >
                <div 
                  className="w-4 h-4 rounded-full border-2 border-white shadow-lg"
                  style={{ backgroundColor: cursor.color }}
                />
                <div className="text-xs bg-black text-white px-1 rounded mt-1 shadow-md">
                  {cursor.name}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassroomWhiteboard;
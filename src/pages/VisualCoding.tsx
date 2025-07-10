import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Play, 
  Square, 
  RotateCcw, 
  Save, 
  Upload,
  Download,
  ArrowLeft,
  Palette,
  Mouse,
  Volume2,
  Zap,
  Flag,
  Trash2,
  Copy
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Block {
  id: string;
  type: 'motion' | 'looks' | 'sound' | 'events' | 'control' | 'sensing';
  name: string;
  code: string;
  color: string;
  shape: 'hat' | 'stack' | 'boolean' | 'reporter' | 'cap';
  parameters?: { name: string; type: 'number' | 'text' | 'dropdown'; value?: any; options?: string[] }[];
}

interface Sprite {
  id: string;
  name: string;
  x: number;
  y: number;
  direction: number;
  costume: string;
  size: number;
  visible: boolean;
  scripts: Block[][];
}

interface DroppedBlock extends Block {
  scriptId: string;
  position: { x: number; y: number };
  connectedTo?: string;
}

const BLOCK_CATEGORIES = {
  events: {
    name: 'Events',
    color: 'bg-amber-500',
    icon: Flag,
    blocks: [
      { 
        id: 'when_flag_clicked', 
        name: 'when 🏴 clicked', 
        code: 'whenFlagClicked()', 
        shape: 'hat' as const,
        parameters: []
      },
      { 
        id: 'when_key_pressed', 
        name: 'when [SPACE] key pressed', 
        code: 'whenKeyPressed("space")', 
        shape: 'hat' as const,
        parameters: [{ name: 'key', type: 'dropdown' as const, value: 'space', options: ['space', 'up arrow', 'down arrow', 'left arrow', 'right arrow', 'a', 'b', 'c'] }] 
      },
      { 
        id: 'when_clicked', 
        name: 'when this sprite clicked', 
        code: 'whenClicked()', 
        shape: 'hat' as const,
        parameters: []
      },
    ]
  },
  motion: {
    name: 'Motion',
    color: 'bg-blue-500',
    icon: Mouse,
    blocks: [
      { 
        id: 'move_steps', 
        name: 'move [10] steps', 
        code: 'move(10)', 
        shape: 'stack' as const,
        parameters: [{ name: 'steps', type: 'number' as const, value: 10 }] 
      },
      { 
        id: 'turn_right', 
        name: 'turn ↻ [15] degrees', 
        code: 'turn(15)', 
        shape: 'stack' as const,
        parameters: [{ name: 'degrees', type: 'number' as const, value: 15 }] 
      },
      { 
        id: 'turn_left', 
        name: 'turn ↺ [15] degrees', 
        code: 'turn(-15)', 
        shape: 'stack' as const,
        parameters: [{ name: 'degrees', type: 'number' as const, value: 15 }] 
      },
      { 
        id: 'goto_xy', 
        name: 'go to x: [0] y: [0]', 
        code: 'goto(0, 0)', 
        shape: 'stack' as const,
        parameters: [{ name: 'x', type: 'number' as const, value: 0 }, { name: 'y', type: 'number' as const, value: 0 }] 
      },
      { 
        id: 'point_direction', 
        name: 'point in direction [90]', 
        code: 'pointInDirection(90)', 
        shape: 'stack' as const,
        parameters: [{ name: 'direction', type: 'number' as const, value: 90 }] 
      },
    ]
  },
  looks: {
    name: 'Looks',
    color: 'bg-purple-500',
    icon: Palette,
    blocks: [
      { 
        id: 'say', 
        name: 'say [Hello!] for [2] seconds', 
        code: 'say("Hello!", 2)', 
        shape: 'stack' as const,
        parameters: [{ name: 'message', type: 'text' as const, value: 'Hello!' }, { name: 'seconds', type: 'number' as const, value: 2 }] 
      },
      { 
        id: 'say_forever', 
        name: 'say [Hello!]', 
        code: 'say("Hello!")', 
        shape: 'stack' as const,
        parameters: [{ name: 'message', type: 'text' as const, value: 'Hello!' }] 
      },
      { 
        id: 'think', 
        name: 'think [Hmm...] for [2] seconds', 
        code: 'think("Hmm...", 2)', 
        shape: 'stack' as const,
        parameters: [{ name: 'message', type: 'text' as const, value: 'Hmm...' }, { name: 'seconds', type: 'number' as const, value: 2 }] 
      },
      { 
        id: 'show', 
        name: 'show', 
        code: 'show()', 
        shape: 'stack' as const,
        parameters: []
      },
      { 
        id: 'hide', 
        name: 'hide', 
        code: 'hide()', 
        shape: 'stack' as const,
        parameters: []
      },
      { 
        id: 'change_size', 
        name: 'change size by [10]', 
        code: 'changeSizeBy(10)', 
        shape: 'stack' as const,
        parameters: [{ name: 'change', type: 'number' as const, value: 10 }] 
      },
    ]
  },
  sound: {
    name: 'Sound',
    color: 'bg-pink-500',
    icon: Volume2,
    blocks: [
      { 
        id: 'play_sound', 
        name: 'play sound [Meow]', 
        code: 'playSound("Meow")', 
        shape: 'stack' as const,
        parameters: [{ name: 'sound', type: 'dropdown' as const, value: 'Meow', options: ['Meow', 'Bark', 'Chirp', 'Pop', 'Beep'] }] 
      },
      { 
        id: 'stop_sounds', 
        name: 'stop all sounds', 
        code: 'stopAllSounds()', 
        shape: 'stack' as const,
        parameters: []
      },
      { 
        id: 'change_volume', 
        name: 'change volume by [10]', 
        code: 'changeVolumeBy(10)', 
        shape: 'stack' as const,
        parameters: [{ name: 'change', type: 'number' as const, value: 10 }] 
      },
    ]
  },
  control: {
    name: 'Control',
    color: 'bg-orange-500',
    icon: RotateCcw,
    blocks: [
      { 
        id: 'wait', 
        name: 'wait [1] seconds', 
        code: 'wait(1)', 
        shape: 'stack' as const,
        parameters: [{ name: 'seconds', type: 'number' as const, value: 1 }] 
      },
      { 
        id: 'repeat', 
        name: 'repeat [10]', 
        code: 'repeat(10) {', 
        shape: 'stack' as const,
        parameters: [{ name: 'times', type: 'number' as const, value: 10 }] 
      },
      { 
        id: 'forever', 
        name: 'forever', 
        code: 'forever() {', 
        shape: 'cap' as const,
        parameters: []
      },
      { 
        id: 'if', 
        name: 'if <> then', 
        code: 'if (condition) {', 
        shape: 'stack' as const,
        parameters: []
      },
      { 
        id: 'stop_all', 
        name: 'stop all', 
        code: 'stopAll()', 
        shape: 'cap' as const,
        parameters: []
      },
    ]
  },
  sensing: {
    name: 'Sensing',
    color: 'bg-cyan-500',
    icon: Zap,
    blocks: [
      { 
        id: 'touching', 
        name: 'touching [mouse-pointer]?', 
        code: 'touching("mouse-pointer")', 
        shape: 'boolean' as const,
        parameters: [{ name: 'object', type: 'dropdown' as const, value: 'mouse-pointer', options: ['mouse-pointer', 'edge', 'Sprite1'] }] 
      },
      { 
        id: 'key_pressed', 
        name: 'key [space] pressed?', 
        code: 'keyPressed("space")', 
        shape: 'boolean' as const,
        parameters: [{ name: 'key', type: 'dropdown' as const, value: 'space', options: ['space', 'up arrow', 'down arrow', 'left arrow', 'right arrow'] }] 
      },
      { 
        id: 'mouse_x', 
        name: 'mouse x', 
        code: 'mouseX()', 
        shape: 'reporter' as const,
        parameters: []
      },
      { 
        id: 'mouse_y', 
        name: 'mouse y', 
        code: 'mouseY()', 
        shape: 'reporter' as const,
        parameters: []
      },
    ]
  }
};

const VisualCoding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scriptsAreaRef = useRef<HTMLDivElement>(null);
  
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof BLOCK_CATEGORIES>('events');
  const [currentSprite, setCurrentSprite] = useState<Sprite>({
    id: 'sprite1',
    name: 'Cat',
    x: 240,
    y: 180,
    direction: 90,
    costume: '🐱',
    size: 100,
    visible: true,
    scripts: []
  });
  
  const [sprites, setSprites] = useState<Sprite[]>([currentSprite]);
  const [droppedBlocks, setDroppedBlocks] = useState<DroppedBlock[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [draggedBlock, setDraggedBlock] = useState<Block | null>(null);
  const [projectName, setProjectName] = useState('Untitled Project');

  useEffect(() => {
    drawStage();
  }, [currentSprite, sprites]);

  const drawStage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw subtle grid
    ctx.strokeStyle = '#f5f5f5';
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw center crosshair
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw sprites
    sprites.forEach(sprite => {
      if (sprite.visible) {
        ctx.save();
        ctx.translate(sprite.x, sprite.y);
        ctx.rotate((sprite.direction - 90) * Math.PI / 180);
        
        ctx.font = `${sprite.size / 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#000';
        ctx.fillText(sprite.costume, 0, 0);
        
        // Highlight current sprite
        if (sprite.id === currentSprite.id) {
          ctx.strokeStyle = '#4CAF50';
          ctx.lineWidth = 3;
          ctx.strokeRect(-30, -30, 60, 60);
        }
        
        ctx.restore();
      }
    });
  };

  const handleDragStart = (block: Block) => {
    setDraggedBlock(block);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedBlock) {
      const rect = scriptsAreaRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const newBlock: DroppedBlock = {
          ...draggedBlock,
          type: draggedBlock.type,
          color: BLOCK_CATEGORIES[draggedBlock.type].color,
          id: `${draggedBlock.id}_${Date.now()}`,
          scriptId: currentSprite.id,
          position: { x, y }
        };
        
        setDroppedBlocks(prev => [...prev, newBlock]);
      }
      setDraggedBlock(null);
    }
  };

  const runScript = () => {
    setIsRunning(true);
    // Simulate script execution
    setTimeout(() => {
      setIsRunning(false);
    }, 2000);
  };

  const BlockComponent = ({ block, category }: { block: Block; category: keyof typeof BLOCK_CATEGORIES }) => {
    const getBlockStyle = (shape: string) => {
      const baseClasses = `${BLOCK_CATEGORIES[category].color} text-white p-3 cursor-grab hover:opacity-80 transition-opacity text-sm font-medium shadow-md`;
      
      switch (shape) {
        case 'hat':
          return `${baseClasses} rounded-t-xl rounded-b-lg border-b-4 border-opacity-50`;
        case 'stack':
          return `${baseClasses} rounded-lg border-b-2 border-opacity-30`;
        case 'boolean':
          return `${baseClasses} rounded-full`;
        case 'reporter':
          return `${baseClasses} rounded-full bg-opacity-80`;
        case 'cap':
          return `${baseClasses} rounded-lg rounded-b-xl border-t-2 border-opacity-30`;
        default:
          return `${baseClasses} rounded-lg`;
      }
    };

    return (
      <div
        draggable
        onDragStart={() => handleDragStart({ ...block, type: category, color: BLOCK_CATEGORIES[category].color })}
        className={getBlockStyle(block.shape)}
      >
        {block.name}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20 p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-white">Visual Coding Studio</h1>
            <Badge variant="outline" className="bg-white/10 border-white/20 text-white">
              Scratch-like Interface
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={runScript}
              disabled={isRunning}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isRunning ? (
                <Square className="h-4 w-4 mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {isRunning ? 'Running...' : 'Run'}
            </Button>
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Save className="h-4 w-4 mr-2" />
              Save Project
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Blocks Palette */}
        <div className="w-80 bg-white border-r overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-4">Blocks</h3>
            
            <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as keyof typeof BLOCK_CATEGORIES)}>
              <TabsList className="grid grid-cols-2 gap-1 mb-4 h-auto">
                {Object.entries(BLOCK_CATEGORIES).map(([key, category]) => (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className={`${category.color} text-white data-[state=active]:bg-opacity-100 data-[state=inactive]:bg-opacity-70 h-12 text-xs`}
                  >
                    <category.icon className="h-4 w-4 mr-1" />
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {Object.entries(BLOCK_CATEGORIES).map(([key, category]) => (
                <TabsContent key={key} value={key} className="space-y-2">
                  {category.blocks.map((block) => (
                    <BlockComponent
                      key={block.id}
                      block={block}
                      category={key as keyof typeof BLOCK_CATEGORIES}
                    />
                  ))}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>

        {/* Main Workspace */}
        <div className="flex-1 flex">
          {/* Scripts Area */}
          <div className="flex-1 bg-gray-50 p-4">
            <div className="bg-white rounded-lg h-full">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-lg">Scripts for {currentSprite.name}</h3>
              </div>
              
              <div
                ref={scriptsAreaRef}
                className="p-4 h-full"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                {droppedBlocks.filter(block => block.scriptId === currentSprite.id).length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <div className="text-4xl mb-4">🧩</div>
                    <p>Drag blocks here to build your script</p>
                    <p className="text-sm mt-2">Start with an Events block (yellow) like "when 🏴 clicked"</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {droppedBlocks
                      .filter(block => block.scriptId === currentSprite.id)
                      .map((block, index) => (
                      <div
                        key={block.id}
                        className={`${block.color} text-white p-3 rounded-lg text-sm font-medium cursor-pointer hover:opacity-80 flex items-center justify-between`}
                        style={{ 
                          marginLeft: block.shape === 'hat' ? '0px' : '20px',
                          borderRadius: block.shape === 'boolean' ? '20px' : '8px'
                        }}
                      >
                        <span>{block.name}</span>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-white hover:bg-white/20 p-1 h-6 w-6"
                          onClick={() => setDroppedBlocks(prev => prev.filter(b => b.id !== block.id))}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stage Area */}
          <div className="w-96 bg-white border-l">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Stage</h3>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    <Upload className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <canvas
                ref={canvasRef}
                width={360}
                height={270}
                className="border border-gray-300 rounded bg-white cursor-crosshair"
                onClick={(e) => {
                  const rect = canvasRef.current?.getBoundingClientRect();
                  if (rect) {
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    setCurrentSprite(prev => ({ ...prev, x, y }));
                    setSprites(prev => prev.map(s => s.id === currentSprite.id ? { ...s, x, y } : s));
                  }
                }}
              />
            </div>

            {/* Sprites List */}
            <div className="p-4 border-t">
              <h4 className="font-semibold mb-3">Sprites</h4>
              <div className="space-y-2">
                {sprites.map((sprite) => (
                  <div
                    key={sprite.id}
                    onClick={() => setCurrentSprite(sprite)}
                    className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                      sprite.id === currentSprite.id 
                        ? 'bg-blue-100 border-2 border-blue-500' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <span className="text-2xl mr-3">{sprite.costume}</span>
                    <div>
                      <div className="font-medium">{sprite.name}</div>
                      <div className="text-sm text-gray-500">
                        x: {sprite.x} y: {sprite.y}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button 
                className="w-full mt-3"
                variant="outline"
                onClick={() => {
                  const newSprite: Sprite = {
                    id: `sprite${sprites.length + 1}`,
                    name: `Sprite${sprites.length + 1}`,
                    x: 180,
                    y: 135,
                    direction: 90,
                    costume: '🐶',
                    size: 100,
                    visible: true,
                    scripts: []
                  };
                  setSprites(prev => [...prev, newSprite]);
                }}
              >
                Add Sprite
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualCoding;
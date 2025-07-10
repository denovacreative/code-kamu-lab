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
  Copy,
  Box,
  Circle,
  Move,
  Eye,
  Repeat,
  Search,
  Calculator
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Block {
  id: string;
  type: 'motion' | 'looks' | 'sound' | 'events' | 'control' | 'sensing' | 'operators';
  name: string;
  code: string;
  color: string;
  shape: 'hat' | 'stack' | 'boolean' | 'reporter' | 'cap';
  parameters?: { name: string; type: 'number' | 'text' | 'dropdown'; value?: any; options?: string[] }[];
}

interface Sprite2D {
  id: string;
  name: string;
  x: number;
  y: number;
  rotation: number;
  size: number;
  color: string;
  costume: string;
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
      { 
        id: 'when_backdrop', 
        name: 'when backdrop switches to [backdrop1]', 
        code: 'whenBackdropSwitchesTo("backdrop1")', 
        shape: 'hat' as const,
        parameters: [{ name: 'backdrop', type: 'dropdown' as const, value: 'backdrop1', options: ['backdrop1', 'backdrop2', 'backdrop3'] }] 
      },
    ]
  },
  motion: {
    name: 'Motion',
    color: 'bg-blue-500',
    icon: Move,
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
      { 
        id: 'goto_random', 
        name: 'go to random position', 
        code: 'gotoRandomPosition()', 
        shape: 'stack' as const,
        parameters: [] 
      },
      { 
        id: 'glide_to', 
        name: 'glide [1] secs to x: [0] y: [0]', 
        code: 'glideTo(1, 0, 0)', 
        shape: 'stack' as const,
        parameters: [{ name: 'secs', type: 'number' as const, value: 1 }, { name: 'x', type: 'number' as const, value: 0 }, { name: 'y', type: 'number' as const, value: 0 }] 
      },
      { 
        id: 'change_x', 
        name: 'change x by [10]', 
        code: 'changeXBy(10)', 
        shape: 'stack' as const,
        parameters: [{ name: 'dx', type: 'number' as const, value: 10 }] 
      },
      { 
        id: 'change_y', 
        name: 'change y by [10]', 
        code: 'changeYBy(10)', 
        shape: 'stack' as const,
        parameters: [{ name: 'dy', type: 'number' as const, value: 10 }] 
      },
      { 
        id: 'set_x', 
        name: 'set x to [0]', 
        code: 'setX(0)', 
        shape: 'stack' as const,
        parameters: [{ name: 'x', type: 'number' as const, value: 0 }] 
      },
      { 
        id: 'set_y', 
        name: 'set y to [0]', 
        code: 'setY(0)', 
        shape: 'stack' as const,
        parameters: [{ name: 'y', type: 'number' as const, value: 0 }] 
      },
    ]
  },
  looks: {
    name: 'Looks',
    color: 'bg-purple-500',
    icon: Eye,
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
      { 
        id: 'set_size', 
        name: 'set size to [100] %', 
        code: 'setSizeTo(100)', 
        shape: 'stack' as const,
        parameters: [{ name: 'size', type: 'number' as const, value: 100 }] 
      },
      { 
        id: 'switch_costume', 
        name: 'switch costume to [costume1]', 
        code: 'switchCostumeTo("costume1")', 
        shape: 'stack' as const,
        parameters: [{ name: 'costume', type: 'dropdown' as const, value: 'costume1', options: ['costume1', 'costume2', 'costume3'] }] 
      },
      { 
        id: 'next_costume', 
        name: 'next costume', 
        code: 'nextCostume()', 
        shape: 'stack' as const,
        parameters: [] 
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
        id: 'play_sound_until', 
        name: 'play sound [Meow] until done', 
        code: 'playSoundUntilDone("Meow")', 
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
      { 
        id: 'set_volume', 
        name: 'set volume to [100] %', 
        code: 'setVolumeTo(100)', 
        shape: 'stack' as const,
        parameters: [{ name: 'volume', type: 'number' as const, value: 100 }] 
      },
    ]
  },
  control: {
    name: 'Control',
    color: 'bg-orange-500',
    icon: Repeat,
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
        id: 'if_else', 
        name: 'if <> then else', 
        code: 'if (condition) { } else {', 
        shape: 'stack' as const,
        parameters: []
      },
      { 
        id: 'wait_until', 
        name: 'wait until <>', 
        code: 'waitUntil(condition)', 
        shape: 'stack' as const,
        parameters: []
      },
      { 
        id: 'repeat_until', 
        name: 'repeat until <>', 
        code: 'repeatUntil(condition) {', 
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
    icon: Search,
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
      { 
        id: 'mouse_down', 
        name: 'mouse down?', 
        code: 'mouseDown()', 
        shape: 'boolean' as const,
        parameters: []
      },
      { 
        id: 'distance_to', 
        name: 'distance to [mouse-pointer]', 
        code: 'distanceTo("mouse-pointer")', 
        shape: 'reporter' as const,
        parameters: [{ name: 'object', type: 'dropdown' as const, value: 'mouse-pointer', options: ['mouse-pointer', 'Sprite1'] }] 
      },
    ]
  },
  operators: {
    name: 'Operators',
    color: 'bg-green-500',
    icon: Calculator,
    blocks: [
      { 
        id: 'add', 
        name: '[10] + [10]', 
        code: 'add(10, 10)', 
        shape: 'reporter' as const,
        parameters: [{ name: 'num1', type: 'number' as const, value: 10 }, { name: 'num2', type: 'number' as const, value: 10 }] 
      },
      { 
        id: 'subtract', 
        name: '[10] - [10]', 
        code: 'subtract(10, 10)', 
        shape: 'reporter' as const,
        parameters: [{ name: 'num1', type: 'number' as const, value: 10 }, { name: 'num2', type: 'number' as const, value: 10 }] 
      },
      { 
        id: 'multiply', 
        name: '[10] × [10]', 
        code: 'multiply(10, 10)', 
        shape: 'reporter' as const,
        parameters: [{ name: 'num1', type: 'number' as const, value: 10 }, { name: 'num2', type: 'number' as const, value: 10 }] 
      },
      { 
        id: 'divide', 
        name: '[10] ÷ [10]', 
        code: 'divide(10, 10)', 
        shape: 'reporter' as const,
        parameters: [{ name: 'num1', type: 'number' as const, value: 10 }, { name: 'num2', type: 'number' as const, value: 10 }] 
      },
      { 
        id: 'random', 
        name: 'pick random [1] to [10]', 
        code: 'random(1, 10)', 
        shape: 'reporter' as const,
        parameters: [{ name: 'from', type: 'number' as const, value: 1 }, { name: 'to', type: 'number' as const, value: 10 }] 
      },
      { 
        id: 'greater', 
        name: '[50] > [50]', 
        code: 'greater(50, 50)', 
        shape: 'boolean' as const,
        parameters: [{ name: 'num1', type: 'number' as const, value: 50 }, { name: 'num2', type: 'number' as const, value: 50 }] 
      },
      { 
        id: 'less', 
        name: '[50] < [50]', 
        code: 'less(50, 50)', 
        shape: 'boolean' as const,
        parameters: [{ name: 'num1', type: 'number' as const, value: 50 }, { name: 'num2', type: 'number' as const, value: 50 }] 
      },
      { 
        id: 'equals', 
        name: '[50] = [50]', 
        code: 'equals(50, 50)', 
        shape: 'boolean' as const,
        parameters: [{ name: 'num1', type: 'number' as const, value: 50 }, { name: 'num2', type: 'number' as const, value: 50 }] 
      },
      { 
        id: 'and', 
        name: '<> and <>', 
        code: 'and(condition1, condition2)', 
        shape: 'boolean' as const,
        parameters: []
      },
      { 
        id: 'or', 
        name: '<> or <>', 
        code: 'or(condition1, condition2)', 
        shape: 'boolean' as const,
        parameters: []
      },
      { 
        id: 'not', 
        name: 'not <>', 
        code: 'not(condition)', 
        shape: 'boolean' as const,
        parameters: []
      },
    ]
  }
};

const VisualCoding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const scriptsAreaRef = useRef<HTMLDivElement>(null);
  
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof BLOCK_CATEGORIES>('events');
  const [currentSprite, setCurrentSprite] = useState<Sprite2D>({
    id: 'sprite1',
    name: 'Cat',
    x: 240,
    y: 180,
    rotation: 0,
    size: 100,
    color: '#FF6B35',
    costume: '🐱',
    visible: true,
    scripts: []
  });
  
  const [sprites, setSprites] = useState<Sprite2D[]>([currentSprite]);
  const [droppedBlocks, setDroppedBlocks] = useState<DroppedBlock[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [draggedBlock, setDraggedBlock] = useState<Block | null>(null);
  const [projectName, setProjectName] = useState('2D Scratch Project');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 2D Canvas rendering
  useEffect(() => {
    drawCanvas();
  }, [sprites, isRunning]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
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
    
    // Draw center lines
    ctx.strokeStyle = '#d0d0d0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    
    // Draw sprites
    sprites.forEach(sprite => {
      if (!sprite.visible) return;
      
      ctx.save();
      ctx.translate(sprite.x + canvas.width / 2, canvas.height / 2 - sprite.y);
      ctx.rotate((sprite.rotation * Math.PI) / 180);
      ctx.scale(sprite.size / 100, sprite.size / 100);
      
      // Draw sprite (emoji or simple shape)
      if (sprite.costume && sprite.costume.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u)) {
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sprite.costume, 0, 0);
      } else {
        // Draw simple colored circle
        ctx.fillStyle = sprite.color;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      ctx.restore();
      
      // Draw sprite name
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(sprite.name, sprite.x + canvas.width / 2, canvas.height / 2 - sprite.y + 35);
    });
  };

  const handleDragStart = (block: Block) => {
    setDraggedBlock(block);
  };

  const handleDragEnd = () => {
    setDraggedBlock(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedBlock && scriptsAreaRef.current) {
      const rect = scriptsAreaRef.current.getBoundingClientRect();
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
      setDraggedBlock(null);
    }
  };

  const runScript = () => {
    setIsRunning(true);
    
    // Get blocks for current sprite
    const spriteBlocks = droppedBlocks.filter(block => block.scriptId === currentSprite.id);
    
    // Animate sprite in 2D space
    spriteBlocks.forEach((block, index) => {
      setTimeout(() => {
        if (block.type === 'motion') {
          setCurrentSprite(prev => {
            const newSprite = { ...prev };
            if (block.id.includes('move_steps')) {
              const steps = 50; // pixels
              const radians = (newSprite.rotation * Math.PI) / 180;
              newSprite.x += Math.cos(radians) * steps;
              newSprite.y += Math.sin(radians) * steps;
            } else if (block.id.includes('turn_right')) {
              newSprite.rotation += 15;
            } else if (block.id.includes('turn_left')) {
              newSprite.rotation -= 15;
            } else if (block.id.includes('goto_xy')) {
              newSprite.x = 0;
              newSprite.y = 0;
            }
            return newSprite;
          });
          
          // Update sprites array
          setSprites(prev => prev.map(sprite => 
            sprite.id === currentSprite.id ? { ...sprite, ...currentSprite } : sprite
          ));
        } else if (block.type === 'looks') {
          if (block.id.includes('change_size')) {
            setCurrentSprite(prev => ({
              ...prev,
              size: Math.max(50, Math.min(200, prev.size + 20))
            }));
          } else if (block.id.includes('show')) {
            setCurrentSprite(prev => ({ ...prev, visible: true }));
          } else if (block.id.includes('hide')) {
            setCurrentSprite(prev => ({ ...prev, visible: false }));
          }
        }
      }, index * 800);
    });
    
    setTimeout(() => {
      setIsRunning(false);
    }, spriteBlocks.length * 800 + 1000);
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
        draggable={true}
        onDragStart={(e) => {
          e.dataTransfer.setData("text/plain", "");
          handleDragStart({ ...block, type: category, color: BLOCK_CATEGORIES[category].color });
        }}
        onDragEnd={handleDragEnd}
        className={getBlockStyle(block.shape)}
        style={{ userSelect: 'none' }}
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
              onClick={() => navigate('/')}
              className="bg-white text-gray-800 border-gray-300 hover:bg-gray-100 font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-white">Visual Coding Studio</h1>
            <Badge variant="outline" className="bg-white/10 border-white/20 text-white">
              2D Scratch-like Interface
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
              <TabsList className="grid grid-cols-3 gap-1 mb-4 h-auto">
                {Object.entries(BLOCK_CATEGORIES).map(([key, category]) => (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className={`${category.color} text-white data-[state=active]:bg-opacity-100 data-[state=inactive]:bg-opacity-70 h-10 text-xs`}
                  >
                    <category.icon className="h-3 w-3 mr-1" />
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
                className="p-4 h-full min-h-96 border-2 border-dashed border-gray-300 rounded-lg"
                onDragOver={handleDragOver}
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

          {/* Stage Area with 2D Canvas */}
          <div className="w-96 bg-white border-l">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg text-gray-800">2D Stage</h3>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" className="text-gray-600 border-gray-300">
                    <Upload className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="text-gray-600 border-gray-300">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <canvas 
                ref={canvasRef}
                width={384}
                height={320}
                className="border-b border-gray-200 cursor-crosshair"
                onClick={(e) => {
                  const canvas = canvasRef.current;
                  if (!canvas) return;
                  
                  const rect = canvas.getBoundingClientRect();
                  const x = e.clientX - rect.left - canvas.width / 2;
                  const y = canvas.height / 2 - (e.clientY - rect.top);
                  
                  console.log(`Clicked at: x=${x}, y=${y}`);
                }}
              />
              {isRunning && (
                <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                  🚀 Running...
                </div>
              )}
            </div>

            {/* Sprites List */}
            <div className="p-4 border-t border-gray-200">
              <h4 className="font-semibold mb-3 text-gray-800">Sprites</h4>
              <div className="space-y-2">
                {sprites.map((sprite) => (
                  <div
                    key={sprite.id}
                    onClick={() => setCurrentSprite(sprite)}
                    className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${
                      sprite.id === currentSprite.id 
                        ? 'bg-blue-100 border-2 border-blue-400' 
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="w-8 h-8 rounded mr-3 flex items-center justify-center text-lg" style={{ backgroundColor: sprite.color }}>
                      {sprite.costume}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">{sprite.name}</div>
                      <div className="text-xs text-gray-500">
                        x: {sprite.x.toFixed(0)} y: {sprite.y.toFixed(0)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex space-x-2 mt-3">
                <Button 
                  className="flex-1"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newSprite: Sprite2D = {
                      id: `sprite${sprites.length + 1}`,
                      name: `Sprite ${sprites.length + 1}`,
                      x: Math.random() * 200 - 100,
                      y: Math.random() * 200 - 100,
                      rotation: 0,
                      size: 100,
                      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
                      costume: ['🐱', '🐶', '🐹', '🐰', '🦊', '🐻', '🐼', '🐯'][Math.floor(Math.random() * 8)],
                      visible: true,
                      scripts: []
                    };
                    setSprites(prev => [...prev, newSprite]);
                  }}
                >
                  <Circle className="h-3 w-3 mr-1" />
                  Add Sprite
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualCoding;
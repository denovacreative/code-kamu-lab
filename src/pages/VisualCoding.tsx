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
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Block {
  id: string;
  type: 'motion' | 'looks' | 'sound' | 'events' | 'control' | 'sensing';
  name: string;
  code: string;
  color: string;
  parameters?: { name: string; type: 'number' | 'text' | 'dropdown'; options?: string[] }[];
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
}

const BLOCK_CATEGORIES = {
  motion: {
    name: 'Motion',
    color: 'bg-blue-500',
    icon: Mouse,
    blocks: [
      { id: 'move_steps', name: 'move 10 steps', code: 'move(10)', parameters: [{ name: 'steps', type: 'number' as const }] },
      { id: 'turn_right', name: 'turn ↻ 15 degrees', code: 'turn(15)', parameters: [{ name: 'degrees', type: 'number' as const }] },
      { id: 'turn_left', name: 'turn ↺ 15 degrees', code: 'turn(-15)', parameters: [{ name: 'degrees', type: 'number' as const }] },
      { id: 'goto_xy', name: 'go to x: 0 y: 0', code: 'goto(0, 0)', parameters: [{ name: 'x', type: 'number' as const }, { name: 'y', type: 'number' as const }] },
    ]
  },
  looks: {
    name: 'Looks',
    color: 'bg-purple-500',
    icon: Palette,
    blocks: [
      { id: 'say', name: 'say Hello! for 2 seconds', code: 'say("Hello!", 2)', parameters: [{ name: 'message', type: 'text' as const }, { name: 'seconds', type: 'number' as const }] },
      { id: 'think', name: 'think Hmm... for 2 seconds', code: 'think("Hmm...", 2)', parameters: [{ name: 'message', type: 'text' as const }, { name: 'seconds', type: 'number' as const }] },
      { id: 'show', name: 'show', code: 'show()' },
      { id: 'hide', name: 'hide', code: 'hide()' },
    ]
  },
  sound: {
    name: 'Sound',
    color: 'bg-pink-500',
    icon: Volume2,
    blocks: [
      { id: 'play_sound', name: 'play sound Meow', code: 'playSound("Meow")', parameters: [{ name: 'sound', type: 'dropdown' as const, options: ['Meow', 'Bark', 'Chirp'] }] },
      { id: 'stop_sounds', name: 'stop all sounds', code: 'stopAllSounds()' },
    ]
  },
  events: {
    name: 'Events',
    color: 'bg-yellow-500',
    icon: Zap,
    blocks: [
      { id: 'when_flag_clicked', name: 'when 🏴 clicked', code: 'whenFlagClicked()' },
      { id: 'when_key_pressed', name: 'when space key pressed', code: 'whenKeyPressed("space")', parameters: [{ name: 'key', type: 'dropdown' as const, options: ['space', 'up arrow', 'down arrow', 'left arrow', 'right arrow'] }] },
      { id: 'when_clicked', name: 'when this sprite clicked', code: 'whenClicked()' },
    ]
  },
  control: {
    name: 'Control',
    color: 'bg-orange-500',
    icon: RotateCcw,
    blocks: [
      { id: 'wait', name: 'wait 1 seconds', code: 'wait(1)', parameters: [{ name: 'seconds', type: 'number' as const }] },
      { id: 'repeat', name: 'repeat 10', code: 'repeat(10) {', parameters: [{ name: 'times', type: 'number' as const }] },
      { id: 'forever', name: 'forever', code: 'forever() {' },
      { id: 'if', name: 'if <> then', code: 'if (condition) {' },
    ]
  }
};

const VisualCoding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof BLOCK_CATEGORIES>('motion');
  const [currentSprite, setCurrentSprite] = useState<Sprite>({
    id: 'sprite1',
    name: 'Cat',
    x: 240,
    y: 180,
    direction: 90,
    costume: '🐱',
    size: 100,
    visible: true
  });
  
  const [sprites, setSprites] = useState<Sprite[]>([currentSprite]);
  const [scripts, setScripts] = useState<Block[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [draggedBlock, setDraggedBlock] = useState<Block | null>(null);

  useEffect(() => {
    drawStage();
  }, [currentSprite, sprites]);

  const drawStage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#f0f0f0';
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

    // Draw sprites
    sprites.forEach(sprite => {
      if (sprite.visible) {
        ctx.font = `${sprite.size / 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sprite.costume, sprite.x, sprite.y);
        
        // Highlight current sprite
        if (sprite.id === currentSprite.id) {
          ctx.strokeStyle = '#4CAF50';
          ctx.lineWidth = 3;
          ctx.strokeRect(sprite.x - 30, sprite.y - 30, 60, 60);
        }
      }
    });
  };

  const handleDragStart = (block: Block) => {
    setDraggedBlock(block);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedBlock) {
      setScripts(prev => [...prev, { ...draggedBlock, id: `${draggedBlock.id}_${Date.now()}` }]);
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

  const BlockComponent = ({ block, category }: { block: Block; category: keyof typeof BLOCK_CATEGORIES }) => (
    <div
      draggable
      onDragStart={() => handleDragStart({ ...block, type: category, color: BLOCK_CATEGORIES[category].color })}
      className={`${BLOCK_CATEGORIES[category].color} text-white p-3 rounded-lg cursor-grab hover:opacity-80 transition-opacity text-sm font-medium`}
    >
      {block.name}
    </div>
  );

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
                className="p-4 h-full"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                {scripts.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <div className="text-4xl mb-4">🧩</div>
                    <p>Drag blocks here to build your script</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {scripts.map((script, index) => (
                      <div
                        key={script.id}
                        className={`${script.color} text-white p-3 rounded-lg text-sm font-medium`}
                      >
                        {script.name}
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
                    visible: true
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
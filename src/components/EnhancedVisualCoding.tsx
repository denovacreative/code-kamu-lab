import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import ScratchBlocks, { ScratchBlock } from './ScratchBlocks';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  Square, 
  RotateCcw, 
  Save, 
  Upload,
  Download,
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
  Search,
  Plus,
  Image as ImageIcon,
  Code,
  FileText,
  Star,
  Sparkles
} from 'lucide-react';

interface DroppedBlock extends ScratchBlock {
  scriptId: string;
  position: { x: number; y: number };
  connectedTo?: string;
  uniqueId: string;
  parameterValues?: Record<string, any>;
}

interface Sprite {
  id: string;
  name: string;
  x: number;
  y: number;
  rotation: number;
  size: number;
  costume: string;
  visible: boolean;
  scripts: DroppedBlock[][];
}

interface Costume {
  id: string;
  name: string;
  dataUrl: string;
}

interface Backdrop {
  id: string;
  name: string;
  dataUrl: string;
}

const DEFAULT_SPRITES = [
  {
    id: 'cat',
    name: 'Scratch Cat',
    x: 0,
    y: 0,
    rotation: 90,
    size: 100,
    costume: 'cat-a',
    visible: true,
    scripts: []
  }
];

const DEFAULT_COSTUMES: Costume[] = [
  {
    id: 'cat-a',
    name: 'Cat A',
    dataUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMjUiIGZpbGw9IiNGRkI1MDAiLz4KPGNpcmNsZSBjeD0iMjIiIGN5PSIyNSIgcj0iMyIgZmlsbD0iIzAwMCIvPgo8Y2lyY2xlIGN4PSIzOCIgY3k9IjI1IiByPSIzIiBmaWxsPSIjMDAwIi8+CjxwYXRoIGQ9Ik0yNSAzNSBRIDMwIDQwIDM1IDM1IiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPgo8L3N2Zz4K'
  },
  {
    id: 'cat-b',
    name: 'Cat B',
    dataUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMjUiIGZpbGw9IiM0Q0E1RkYiLz4KPGNpcmNsZSBjeD0iMjIiIGN5PSIyNSIgcj0iMyIgZmlsbD0iIzAwMCIvPgo8Y2lyY2xlIGN4PSIzOCIgY3k9IjI1IiByPSIzIiBmaWxsPSIjMDAwIi8+CjxwYXRoIGQ9Ik0yNSAzNSBRIDMwIDQwIDM1IDM1IiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPgo8L3N2Zz4K'
  }
];

const DEFAULT_BACKDROPS: Backdrop[] = [
  {
    id: 'sky',
    name: 'Sky',
    dataUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgwIiBoZWlnaHQ9IjM2MCIgdmlld0JveD0iMCAwIDQ4MCAzNjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0ODAiIGhlaWdodD0iMzYwIiBmaWxsPSJ1cmwoI2dyYWRpZW50KSIvPgo8ZGVmcz4KPGI+R3JhZGllbnQgaWQ9ImdyYWRpZW50IiB4MT0iMCIgeTE9IjAiIHgyPSIwIiB5Mj0iMSI+CjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiM4N0NFRkEiLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjNkJFRkY2Ii8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPC9zdmc+'
  },
  {
    id: 'forest',
    name: 'Forest',
    dataUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgwIiBoZWlnaHQ9IjM2MCIgdmlld0JveD0iMCAwIDQ4MCAzNjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0ODAiIGhlaWdodD0iMzYwIiBmaWxsPSJ1cmwoI2dyYWRpZW50KSIvPgo8ZGVmcz4KPGI+R3JhZGllbnQgaWQ9ImdyYWRpZW50IiB4MT0iMCIgeTE9IjAiIHgyPSIwIiB5Mj0iMSI+CjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiM0Yzk1NmMiLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMmY3NDRmIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPC9zdmc+'
  }
];

const EnhancedVisualCoding = () => {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sprites, setSprites] = useState<Sprite[]>(DEFAULT_SPRITES);
  const [selectedSprite, setSelectedSprite] = useState<string>('cat');
  const [costumes, setCostumes] = useState<Costume[]>(DEFAULT_COSTUMES);
  const [backdrops, setBackdrops] = useState<Backdrop[]>(DEFAULT_BACKDROPS);
  const [currentBackdrop, setCurrentBackdrop] = useState<string>('sky');
  const [scripts, setScripts] = useState<DroppedBlock[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedBlock, setDraggedBlock] = useState<ScratchBlock | null>(null);
  const [showCostumeDialog, setShowCostumeDialog] = useState(false);
  const [showBackdropDialog, setShowBackdropDialog] = useState(false);
  const [executionLog, setExecutionLog] = useState<string[]>([]);

  const currentSprite = sprites.find(s => s.id === selectedSprite);

  // Enhanced execution engine
  const executeScript = useCallback(async (blocks: DroppedBlock[]) => {
    setIsRunning(true);
    setExecutionLog(['🏴 Starting script execution...']);
    
    for (const block of blocks) {
      try {
        await executeBlock(block);
        setExecutionLog(prev => [...prev, `✅ Executed: ${block.name}`]);
      } catch (error) {
        setExecutionLog(prev => [...prev, `❌ Error in ${block.name}: ${error}`]);
      }
      
      // Small delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setExecutionLog(prev => [...prev, '🎉 Script execution completed!']);
    setIsRunning(false);
  }, []);

  const executeBlock = async (block: DroppedBlock) => {
    const sprite = sprites.find(s => s.id === selectedSprite);
    if (!sprite) return;

    switch (block.id) {
      case 'move_steps':
        const steps = block.parameterValues?.steps || 10;
        updateSpritePosition(sprite.id, sprite.x + steps, sprite.y);
        break;
      case 'turn_right':
        const rightDegrees = block.parameterValues?.degrees || 15;
        updateSpriteRotation(sprite.id, sprite.rotation + rightDegrees);
        break;
      case 'turn_left':
        const leftDegrees = block.parameterValues?.degrees || 15;
        updateSpriteRotation(sprite.id, sprite.rotation - leftDegrees);
        break;
      case 'say_hello':
        const message = block.parameterValues?.message || 'Hello!';
        showSpeechBubble(sprite.id, message);
        break;
      case 'wait':
        const seconds = block.parameterValues?.seconds || 1;
        await new Promise(resolve => setTimeout(resolve, seconds * 1000));
        break;
      case 'show':
        updateSpriteVisibility(sprite.id, true);
        break;
      case 'hide':
        updateSpriteVisibility(sprite.id, false);
        break;
      case 'change_size':
        const sizeChange = block.parameterValues?.change || 10;
        updateSpriteSize(sprite.id, sprite.size + sizeChange);
        break;
      case 'next_costume':
        const nextCostumeIndex = (costumes.findIndex(c => c.id === sprite.costume) + 1) % costumes.length;
        updateSpriteCostume(sprite.id, costumes[nextCostumeIndex].id);
        break;
      default:
        console.log(`Executing: ${block.code}`);
    }
  };

  const updateSpritePosition = (spriteId: string, x: number, y: number) => {
    setSprites(prev => prev.map(s => 
      s.id === spriteId ? { ...s, x: Math.max(-240, Math.min(240, x)), y: Math.max(-180, Math.min(180, y)) } : s
    ));
  };

  const updateSpriteRotation = (spriteId: string, rotation: number) => {
    setSprites(prev => prev.map(s => 
      s.id === spriteId ? { ...s, rotation: rotation % 360 } : s
    ));
  };

  const updateSpriteVisibility = (spriteId: string, visible: boolean) => {
    setSprites(prev => prev.map(s => 
      s.id === spriteId ? { ...s, visible } : s
    ));
  };

  const updateSpriteSize = (spriteId: string, size: number) => {
    setSprites(prev => prev.map(s => 
      s.id === spriteId ? { ...s, size: Math.max(10, Math.min(200, size)) } : s
    ));
  };

  const updateSpriteCostume = (spriteId: string, costume: string) => {
    setSprites(prev => prev.map(s => 
      s.id === spriteId ? { ...s, costume } : s
    ));
  };

  const showSpeechBubble = (spriteId: string, message: string) => {
    toast({
      title: `${sprites.find(s => s.id === spriteId)?.name} says:`,
      description: message,
      duration: 2000,
    });
  };

  const handleBlockSelect = (block: ScratchBlock) => {
    const droppedBlock: DroppedBlock = {
      ...block,
      scriptId: 'main',
      position: { x: 50, y: scripts.length * 60 + 50 },
      uniqueId: `${block.id}-${Date.now()}`,
      parameterValues: {}
    };
    setScripts(prev => [...prev, droppedBlock]);
  };

  const handleRunScript = () => {
    const hatBlocks = scripts.filter(block => block.shape === 'hat');
    if (hatBlocks.length > 0) {
      const scriptBlocks = scripts.filter(block => block.scriptId === 'main');
      executeScript(scriptBlocks);
    } else {
      toast({
        title: "No start block found",
        description: "Add a 'when flag clicked' block to start your script",
        variant: "destructive"
      });
    }
  };

  const handleUploadCostume = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newCostume: Costume = {
          id: `costume-${Date.now()}`,
          name: file.name.split('.')[0],
          dataUrl: e.target?.result as string
        };
        setCostumes(prev => [...prev, newCostume]);
        setShowCostumeDialog(false);
        toast({
          title: "Costume uploaded!",
          description: `${newCostume.name} has been added to your costumes.`,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadBackdrop = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newBackdrop: Backdrop = {
          id: `backdrop-${Date.now()}`,
          name: file.name.split('.')[0],
          dataUrl: e.target?.result as string
        };
        setBackdrops(prev => [...prev, newBackdrop]);
        setCurrentBackdrop(newBackdrop.id);
        setShowBackdropDialog(false);
        toast({
          title: "Backdrop uploaded!",
          description: `${newBackdrop.name} has been added as the new backdrop.`,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const addNewSprite = () => {
    const newSprite: Sprite = {
      id: `sprite-${Date.now()}`,
      name: `Sprite${sprites.length + 1}`,
      x: 0,
      y: 0,
      rotation: 90,
      size: 100,
      costume: costumes[0].id,
      visible: true,
      scripts: []
    };
    setSprites(prev => [...prev, newSprite]);
    setSelectedSprite(newSprite.id);
    toast({
      title: "New sprite added!",
      description: `${newSprite.name} has been added to your project.`,
    });
  };

  const clearScript = () => {
    setScripts([]);
    setExecutionLog([]);
    toast({
      title: "Script cleared",
      description: "All blocks have been removed from the script area.",
    });
  };

  const exportProject = () => {
    const project = {
      sprites,
      scripts,
      costumes,
      backdrops,
      currentBackdrop
    };
    const dataStr = JSON.stringify(project, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'scratch-project.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--pictoblox-purple))] to-[hsl(var(--pictoblox-purple-dark))] p-4">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-white flex items-center">
              <Sparkles className="h-6 w-6 mr-2" />
              Enhanced Scratch Coding
            </h1>
            <Badge className="bg-white/20 text-white">
              MIT Scratch Style
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleRunScript}
              disabled={isRunning}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isRunning ? (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run
                </>
              )}
            </Button>
            <Button
              onClick={clearScript}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
            <Button
              onClick={exportProject}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-140px)]">
        {/* Blocks Panel */}
        <div className="col-span-3 bg-white/95 backdrop-blur-sm rounded-lg p-4 overflow-y-auto">
          <div className="mb-4 relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search blocks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10"
            />
          </div>
          <ScratchBlocks onBlockSelect={handleBlockSelect} searchTerm={searchTerm} />
        </div>

        {/* Script Area */}
        <div className="col-span-6 bg-white/95 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Code className="h-5 w-5 mr-2" />
              Script for {currentSprite?.name}
            </h3>
            <Badge variant="outline">
              {scripts.length} blocks
            </Badge>
          </div>
          
          <div className="h-96 border-2 border-dashed border-gray-300 rounded-lg p-4 overflow-y-auto bg-gray-50">
            {scripts.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Box className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Drag blocks here to create your script</p>
                  <p className="text-sm">Start with a "when flag clicked" block</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {scripts.map((block, index) => (
                  <div
                    key={block.uniqueId}
                    className="p-2 rounded border-2 text-white text-sm font-mono"
                    style={{ backgroundColor: block.color, borderColor: block.color }}
                  >
                    <div className="flex items-center justify-between">
                      <span>{block.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-auto p-1 text-white hover:bg-white/20"
                        onClick={() => setScripts(prev => prev.filter(b => b.uniqueId !== block.uniqueId))}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Execution Log */}
          {executionLog.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Execution Log:</h4>
              <div className="bg-gray-900 text-green-400 p-3 rounded text-sm font-mono max-h-32 overflow-y-auto">
                {executionLog.map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stage and Sprites Panel */}
        <div className="col-span-3 space-y-4">
          {/* Stage */}
          <Card className="bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Stage</span>
                <Dialog open={showBackdropDialog} onOpenChange={setShowBackdropDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <ImageIcon className="h-3 w-3 mr-1" />
                      Backdrop
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Choose Backdrop</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        {backdrops.map((backdrop) => (
                          <Button
                            key={backdrop.id}
                            variant={currentBackdrop === backdrop.id ? "default" : "outline"}
                            onClick={() => {
                              setCurrentBackdrop(backdrop.id);
                              setShowBackdropDialog(false);
                            }}
                            className="h-auto p-2"
                          >
                            <div className="text-center">
                              <img
                                src={backdrop.dataUrl}
                                alt={backdrop.name}
                                className="w-full h-16 object-cover rounded mb-1"
                              />
                              <div className="text-xs">{backdrop.name}</div>
                            </div>
                          </Button>
                        ))}
                      </div>
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadBackdrop}
                          style={{ display: 'none' }}
                          id="backdrop-upload"
                        />
                        <Button
                          asChild
                          className="w-full"
                        >
                          <label htmlFor="backdrop-upload">
                            <Upload className="h-4 w-4 mr-2" />
                            Upload New Backdrop
                          </label>
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gradient-to-b from-blue-200 to-blue-400 rounded border-2 border-gray-300 relative overflow-hidden">
                {/* Backdrop */}
                <img
                  src={backdrops.find(b => b.id === currentBackdrop)?.dataUrl}
                  alt="Backdrop"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                
                {/* Sprites */}
                {sprites
                  .filter(sprite => sprite.visible)
                  .map((sprite) => {
                    const costume = costumes.find(c => c.id === sprite.costume);
                    return (
                      <div
                        key={sprite.id}
                        className="absolute transition-all duration-300"
                        style={{
                          left: `${50 + (sprite.x / 240) * 40}%`,
                          top: `${50 - (sprite.y / 180) * 40}%`,
                          transform: `translate(-50%, -50%) rotate(${sprite.rotation - 90}deg) scale(${sprite.size / 100})`,
                        }}
                      >
                        {costume && (
                          <img
                            src={costume.dataUrl}
                            alt={sprite.name}
                            className="w-8 h-8"
                          />
                        )}
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>

          {/* Sprites List */}
          <Card className="bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Sprites</span>
                <Button size="sm" onClick={addNewSprite}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-48 overflow-y-auto">
              <div className="space-y-2">
                {sprites.map((sprite) => {
                  const costume = costumes.find(c => c.id === sprite.costume);
                  return (
                    <Button
                      key={sprite.id}
                      variant={selectedSprite === sprite.id ? "default" : "outline"}
                      className="w-full h-auto p-2 justify-start"
                      onClick={() => setSelectedSprite(sprite.id)}
                    >
                      <div className="flex items-center space-x-2">
                        {costume && (
                          <img
                            src={costume.dataUrl}
                            alt={sprite.name}
                            className="w-6 h-6"
                          />
                        )}
                        <div className="text-left">
                          <div className="text-sm font-medium">{sprite.name}</div>
                          <div className="text-xs opacity-70">
                            x:{sprite.x} y:{sprite.y}
                          </div>
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Costumes */}
          <Card className="bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Costumes</span>
                <Dialog open={showCostumeDialog} onOpenChange={setShowCostumeDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Costume</DialogTitle>
                    </DialogHeader>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadCostume}
                        style={{ display: 'none' }}
                        id="costume-upload"
                      />
                      <Button
                        asChild
                        className="w-full"
                      >
                        <label htmlFor="costume-upload">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Costume Image
                        </label>
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {costumes.map((costume) => (
                  <Button
                    key={costume.id}
                    variant={currentSprite?.costume === costume.id ? "default" : "outline"}
                    className="h-auto p-2"
                    onClick={() => currentSprite && updateSpriteCostume(currentSprite.id, costume.id)}
                  >
                    <div className="text-center">
                      <img
                        src={costume.dataUrl}
                        alt={costume.name}
                        className="w-full h-12 object-contain rounded mb-1"
                      />
                      <div className="text-xs">{costume.name}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EnhancedVisualCoding;
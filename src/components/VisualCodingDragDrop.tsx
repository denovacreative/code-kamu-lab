import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Repeat,
  Search,
  Calculator,
  Image as ImageIcon,
  Plus
} from 'lucide-react';

interface Block {
  id: string;
  type: 'motion' | 'looks' | 'sound' | 'events' | 'control' | 'sensing' | 'operators';
  name: string;
  code: string;
  color: string;
  shape: 'hat' | 'stack' | 'boolean' | 'reporter' | 'cap';
  parameters?: { name: string; type: 'number' | 'text' | 'dropdown'; value?: any; options?: string[] }[];
}

interface DroppedBlock extends Block {
  scriptId: string;
  position: { x: number; y: number };
  connectedTo?: string;
  uniqueId: string;
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
        color: '#FFB000',
        shape: 'hat' as const,
        parameters: []
      },
      { 
        id: 'when_key_pressed', 
        name: 'when [SPACE] key pressed', 
        code: 'whenKeyPressed("space")', 
        color: '#FFB000',
        shape: 'hat' as const,
        parameters: [{ name: 'key', type: 'dropdown' as const, value: 'space', options: ['space', 'up arrow', 'down arrow', 'left arrow', 'right arrow'] }] 
      },
      { 
        id: 'when_clicked', 
        name: 'when this sprite clicked', 
        code: 'whenClicked()', 
        color: '#FFB000',
        shape: 'hat' as const,
        parameters: []
      }
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
        color: '#4C97FF',
        shape: 'stack' as const,
        parameters: [{ name: 'steps', type: 'number' as const, value: 10 }] 
      },
      { 
        id: 'turn_right', 
        name: 'turn ↻ [15] degrees', 
        code: 'turn(15)', 
        color: '#4C97FF',
        shape: 'stack' as const,
        parameters: [{ name: 'degrees', type: 'number' as const, value: 15 }] 
      },
      { 
        id: 'goto_xy', 
        name: 'go to x: [0] y: [0]', 
        code: 'goto(0, 0)', 
        color: '#4C97FF',
        shape: 'stack' as const,
        parameters: [{ name: 'x', type: 'number' as const, value: 0 }, { name: 'y', type: 'number' as const, value: 0 }] 
      }
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
        color: '#9966FF',
        shape: 'stack' as const,
        parameters: [{ name: 'message', type: 'text' as const, value: 'Hello!' }, { name: 'seconds', type: 'number' as const, value: 2 }] 
      },
      { 
        id: 'show', 
        name: 'show', 
        code: 'show()', 
        color: '#9966FF',
        shape: 'stack' as const,
        parameters: []
      },
      { 
        id: 'hide', 
        name: 'hide', 
        code: 'hide()', 
        color: '#9966FF',
        shape: 'stack' as const,
        parameters: []
      }
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
        color: '#FF8C1A',
        shape: 'stack' as const,
        parameters: [{ name: 'seconds', type: 'number' as const, value: 1 }] 
      },
      { 
        id: 'repeat', 
        name: 'repeat [10]', 
        code: 'repeat(10) {', 
        color: '#FF8C1A',
        shape: 'stack' as const,
        parameters: [{ name: 'times', type: 'number' as const, value: 10 }] 
      },
      { 
        id: 'forever', 
        name: 'forever', 
        code: 'forever() {', 
        color: '#FF8C1A',
        shape: 'cap' as const,
        parameters: []
      }
    ]
  }
};

const VisualCodingDragDrop = () => {
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof BLOCK_CATEGORIES>('events');
  const [droppedBlocks, setDroppedBlocks] = useState<DroppedBlock[]>([]);
  const [draggedBlock, setDraggedBlock] = useState<Block | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isRunning, setIsRunning] = useState(false);
  const [sprites, setSprites] = useState<Sprite[]>([
    {
      id: 'sprite1',
      name: 'Cat',
      x: 240,
      y: 180,
      rotation: 90,
      size: 100,
      costume: '🐱',
      visible: true,
      scripts: []
    }
  ]);
  const [selectedSprite, setSelectedSprite] = useState('sprite1');
  const [uploadedSprites, setUploadedSprites] = useState<string[]>([]);

  const scriptsAreaRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle drag start from block palette
  const handleDragStart = (e: React.DragEvent, block: Block) => {
    setDraggedBlock(block);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Handle drag over script area
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  // Handle drop in script area
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (!draggedBlock || !scriptsAreaRef.current) return;

    const rect = scriptsAreaRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    const newBlock: DroppedBlock = {
      ...draggedBlock,
      scriptId: `script_${Date.now()}`,
      position: { x: Math.max(0, x), y: Math.max(0, y) },
      uniqueId: `${draggedBlock.id}_${Date.now()}`
    };

    setDroppedBlocks(prev => [...prev, newBlock]);
    setDraggedBlock(null);
  };

  // Remove block from scripts area
  const removeBlock = (uniqueId: string) => {
    setDroppedBlocks(prev => prev.filter(block => block.uniqueId !== uniqueId));
  };

  // Update block parameter
  const updateBlockParameter = (uniqueId: string, paramIndex: number, value: any) => {
    setDroppedBlocks(prev => prev.map(block => {
      if (block.uniqueId === uniqueId && block.parameters) {
        const newParameters = [...block.parameters];
        newParameters[paramIndex] = { ...newParameters[paramIndex], value };
        return { ...block, parameters: newParameters };
      }
      return block;
    }));
  };

  // Handle sprite upload
  const handleSpriteUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setUploadedSprites(prev => [...prev, imageUrl]);
        
        // Create new sprite with uploaded image
        const newSprite: Sprite = {
          id: `sprite_${Date.now()}`,
          name: file.name.split('.')[0],
          x: Math.random() * 400 + 50,
          y: Math.random() * 300 + 50,
          rotation: 90,
          size: 100,
          costume: imageUrl,
          visible: true,
          scripts: []
        };
        
        setSprites(prev => [...prev, newSprite]);
      };
      reader.readAsDataURL(file);
    }
  };

  // Execute blocks (simple simulation)
  const executeBlocks = () => {
    setIsRunning(true);
    
    // Group blocks by sprite and script
    const scriptsBySprite = groupBlocksByScript();
    
    // Execute each script
    Object.entries(scriptsBySprite).forEach(([spriteId, scripts]) => {
      scripts.forEach(script => {
        executeScript(spriteId, script);
      });
    });
    
    setTimeout(() => setIsRunning(false), 3000);
  };

  const groupBlocksByScript = () => {
    const scripts: Record<string, DroppedBlock[][]> = {};
    
    // For now, treat all blocks as one script per sprite
    const spriteBlocks: Record<string, DroppedBlock[]> = {};
    
    droppedBlocks.forEach(block => {
      if (!spriteBlocks[selectedSprite]) {
        spriteBlocks[selectedSprite] = [];
      }
      spriteBlocks[selectedSprite].push(block);
    });
    
    scripts[selectedSprite] = spriteBlocks[selectedSprite] ? [spriteBlocks[selectedSprite]] : [];
    
    return scripts;
  };

  const executeScript = async (spriteId: string, script: DroppedBlock[]) => {
    // Sort blocks by Y position to execute in order
    const sortedBlocks = script.sort((a, b) => a.position.y - b.position.y);
    
    for (const block of sortedBlocks) {
      await executeBlock(spriteId, block);
      await new Promise(resolve => setTimeout(resolve, 500)); // Delay between blocks
    }
  };

  const executeBlock = async (spriteId: string, block: DroppedBlock) => {
    setSprites(prev => prev.map(sprite => {
      if (sprite.id === spriteId) {
        switch (block.id) {
          case 'move_steps':
            const steps = block.parameters?.[0]?.value || 10;
            return {
              ...sprite,
              x: Math.min(Math.max(sprite.x + steps, 0), 480),
              y: sprite.y
            };
          case 'turn_right':
            const degrees = block.parameters?.[0]?.value || 15;
            return {
              ...sprite,
              rotation: (sprite.rotation + degrees) % 360
            };
          case 'goto_xy':
            const x = block.parameters?.[0]?.value || 0;
            const y = block.parameters?.[1]?.value || 0;
            return {
              ...sprite,
              x: Math.min(Math.max(x + 240, 0), 480),
              y: Math.min(Math.max(180 - y, 0), 360)
            };
          case 'show':
            return { ...sprite, visible: true };
          case 'hide':
            return { ...sprite, visible: false };
          default:
            return sprite;
        }
      }
      return sprite;
    }));
  };

  // Clear all blocks
  const clearBlocks = () => {
    setDroppedBlocks([]);
  };

  // Render block component
  const renderBlock = (block: Block | DroppedBlock, isDraggable = true, isInScript = false) => {
    const blockId = 'uniqueId' in block ? block.uniqueId : block.id;
    
    return (
      <div
        key={blockId}
        className={`
          relative inline-flex items-center px-3 py-2 rounded-lg text-white text-sm font-medium cursor-pointer
          ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}
          ${isInScript ? 'mb-1' : 'mb-2 mr-2'}
          shadow-md hover:shadow-lg transition-shadow
        `}
        style={{ backgroundColor: block.color }}
        draggable={isDraggable}
        onDragStart={(e) => isDraggable && handleDragStart(e, block)}
      >
        <span className="select-none">{block.name}</span>
        
        {/* Parameters */}
        {block.parameters && block.parameters.map((param, index) => (
          <span key={index} className="mx-1">
            {param.type === 'number' ? (
              <Input
                type="number"
                value={param.value || 0}
                onChange={(e) => isInScript && 'uniqueId' in block && 
                  updateBlockParameter(block.uniqueId, index, parseFloat(e.target.value) || 0)}
                className="inline w-16 h-6 text-xs text-black mx-1 px-1"
                onClick={(e) => e.stopPropagation()}
              />
            ) : param.type === 'text' ? (
              <Input
                type="text"
                value={param.value || ''}
                onChange={(e) => isInScript && 'uniqueId' in block && 
                  updateBlockParameter(block.uniqueId, index, e.target.value)}
                className="inline w-20 h-6 text-xs text-black mx-1 px-1"
                onClick={(e) => e.stopPropagation()}
              />
            ) : param.type === 'dropdown' ? (
              <select
                value={param.value || param.options?.[0]}
                onChange={(e) => isInScript && 'uniqueId' in block && 
                  updateBlockParameter(block.uniqueId, index, e.target.value)}
                className="inline h-6 text-xs text-black mx-1 px-1 rounded"
                onClick={(e) => e.stopPropagation()}
              >
                {param.options?.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            ) : null}
          </span>
        ))}
        
        {/* Remove button for script blocks */}
        {isInScript && 'uniqueId' in block && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute -top-1 -right-1 h-5 w-5 p-0 text-white hover:bg-red-500 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              removeBlock(block.uniqueId);
            }}
          >
            ×
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Visual Coding Studio</h1>
          <div className="flex items-center space-x-2">
            <Button
              onClick={executeBlocks}
              disabled={isRunning || droppedBlocks.length === 0}
              className="bg-green-600 hover:bg-green-700"
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
            <Button variant="outline" onClick={clearBlocks}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Block Palette */}
        <div className="w-64 bg-white border-r flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-900 mb-3">Block Palette</h2>
            <div className="space-y-1">
              {Object.entries(BLOCK_CATEGORIES).map(([key, category]) => {
                const IconComponent = category.icon;
                return (
                  <Button
                    key={key}
                    variant={selectedCategory === key ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedCategory(key as keyof typeof BLOCK_CATEGORIES)}
                    className="w-full justify-start"
                  >
                    <IconComponent className="h-4 w-4 mr-2" />
                    {category.name}
                  </Button>
                );
              })}
            </div>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-2">
              {BLOCK_CATEGORIES[selectedCategory].blocks.map((block) => 
                renderBlock(block, true, false)
              )}
            </div>
          </div>
        </div>

        {/* Main Workspace */}
        <div className="flex-1 flex flex-col">
          {/* Stage */}
          <div className="h-80 bg-white border-b p-4">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Stage</CardTitle>
              </CardHeader>
              <CardContent className="h-full p-2">
                <div 
                  ref={stageRef}
                  className="relative w-full h-full bg-gray-100 border-2 border-dashed border-gray-300 rounded overflow-hidden"
                >
                  {sprites.map((sprite) => (
                    <div
                      key={sprite.id}
                      className={`absolute transition-all duration-500 ${sprite.visible ? 'opacity-100' : 'opacity-0'}`}
                      style={{
                        left: sprite.x,
                        top: sprite.y,
                        transform: `rotate(${sprite.rotation - 90}deg) scale(${sprite.size / 100})`,
                        transformOrigin: 'center'
                      }}
                    >
                      {sprite.costume.startsWith('data:') ? (
                        <img src={sprite.costume} alt={sprite.name} className="w-8 h-8" />
                      ) : (
                        <span className="text-2xl">{sprite.costume}</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Scripts Area */}
          <div className="flex-1 p-4">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Scripts</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {droppedBlocks.length} blocks
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="h-full p-2">
                <div
                  ref={scriptsAreaRef}
                  className="relative w-full h-full bg-gray-50 border-2 border-dashed border-gray-300 rounded p-4 overflow-auto"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  {droppedBlocks.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <Box className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Drag blocks here to create your program</p>
                      </div>
                    </div>
                  ) : (
                    droppedBlocks.map((block) => (
                      <div
                        key={block.uniqueId}
                        className="absolute"
                        style={{
                          left: block.position.x,
                          top: block.position.y
                        }}
                      >
                        {renderBlock(block, false, true)}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sprite Panel */}
        <div className="w-64 bg-white border-l flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Sprites</h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleSpriteUpload}
              className="hidden"
            />
          </div>
          
          <div className="flex-1 p-4 space-y-2 overflow-y-auto">
            {sprites.map((sprite) => (
              <Card
                key={sprite.id}
                className={`cursor-pointer transition-colors ${
                  selectedSprite === sprite.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setSelectedSprite(sprite.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                      {sprite.costume.startsWith('data:') ? (
                        <img src={sprite.costume} alt={sprite.name} className="w-8 h-8 object-cover" />
                      ) : (
                        <span className="text-lg">{sprite.costume}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {sprite.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        x: {Math.round(sprite.x)}, y: {Math.round(sprite.y)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualCodingDragDrop;
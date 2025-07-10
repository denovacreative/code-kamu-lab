import { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  Download,
  Settings,
  Play,
  Palette
} from 'lucide-react';

interface NotebookCanvasProps {
  isVisible: boolean;
  onToggle: () => void;
}

const NotebookCanvas = ({ isVisible, onToggle }: NotebookCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (canvasRef.current && isVisible) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set canvas size
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        // Draw sample visualization
        drawSampleChart(ctx, canvas.width, canvas.height);
      }
    }
  }, [isVisible]);

  const drawSampleChart = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Draw background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 10; i++) {
      const x = (width / 10) * i;
      const y = (height / 10) * i;
      
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Draw sample data visualization
    const data = [20, 45, 65, 30, 80, 55, 40, 70, 85, 60];
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    data.forEach((value, index) => {
      const x = (width / (data.length - 1)) * index;
      const y = height - (value / 100) * height;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      // Draw points
      ctx.fillStyle = '#8b5cf6';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.stroke();
    
    // Add title
    ctx.fillStyle = '#374151';
    ctx.font = '16px Inter, sans-serif';
    ctx.fillText('Sample Data Visualization', 20, 30);
  };

  if (!isVisible) return null;

  return (
    <Card className={`${isFullscreen ? 'fixed inset-4 z-50' : 'h-full'} bg-white border border-gray-200`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <Palette className="h-5 w-5 mr-2 text-purple-600" />
            Visualization Canvas
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              Interactive
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-7 w-7 p-0"
            >
              {isFullscreen ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onToggle}
              className="h-7 w-7 p-0"
            >
              <Minimize2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        {/* Canvas Toolbar */}
        <div className="flex items-center justify-between mb-4 p-2 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" className="h-7 text-xs">
              <Play className="h-3 w-3 mr-1" />
              Run
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs">
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" className="h-7 text-xs">
              <Settings className="h-3 w-3 mr-1" />
              Settings
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs">
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="relative bg-white border border-gray-200 rounded-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full h-64 cursor-crosshair"
            style={{ minHeight: isFullscreen ? '60vh' : '16rem' }}
          />
          
          {/* Canvas Overlay */}
          <div className="absolute top-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-xs">
            Canvas: 800x400
          </div>
        </div>

        {/* Canvas Info */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div className="text-blue-800">
              <strong>Output:</strong> Interactive visualization ready
            </div>
            <div className="text-blue-600 text-xs">
              Last updated: just now
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotebookCanvas;
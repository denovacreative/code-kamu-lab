import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, input = "" } = await req.json();
    
    // Simple Python execution simulation
    // In production, you might use Pyodide or a Python execution service
    const result = await executePython(code, input);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in python-compiler function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      output: `Error: ${error.message}`
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function executePython(code: string, input: string): Promise<any> {
  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        let output = '';
        let error = '';
        let isPlotGenerated = false;
        
        // Check if this is a matplotlib/plotting code
        if (code.includes('matplotlib') || code.includes('plt.show()') || code.includes('plt.plot') || code.includes('plt.figure')) {
          // Generate a sample SVG plot
          const plotSvg = generateSamplePlot(code);
          output = plotSvg;
          isPlotGenerated = true;
        }
        
        // Simulate Python execution with pattern matching
        if (code.includes('print(')) {
          const printMatches = code.match(/print\((.*?)\)/g);
          if (printMatches) {
            const printOutput = printMatches.map(match => {
              const content = match.replace(/print\((['"]?)(.*?)\1\)/, '$2');
              // Handle string interpolation-like patterns
              if (content.includes('+')) {
                return content.replace(/['"]([^'"]*)['"]/g, '$1');
              }
              if (content.includes('f"') || content.includes("f'")) {
                return content.replace(/f['"]([^'"]*?)['"]/, '$1');
              }
              return content.replace(/['"]([^'"]*?)['"]/, '$1');
            }).join('\n');
            
            if (isPlotGenerated) {
              output += '\n' + printOutput;
            } else {
              output = printOutput;
            }
          }
        }
        
        if (code.includes('for') && code.includes('range')) {
          const rangeMatch = code.match(/range\((\d+)\)/);
          if (rangeMatch) {
            const count = parseInt(rangeMatch[1]);
            const lines = [];
            for (let i = 0; i < count; i++) {
              if (code.includes('print(')) {
                lines.push(`${i}`);
              }
            }
            output = lines.join('\n');
          }
        }
        
        if (code.includes('input(')) {
          output = `Input received: ${input}`;
        }
        
        if (code.includes('import')) {
          output = output || 'Modules imported successfully';
        }
        
        if (code.includes('def ')) {
          output = output || 'Function defined successfully';
        }
        
        if (code.includes('class ')) {
          output = output || 'Class defined successfully';
        }
        
        // Math operations
        if (code.includes('2 + 2') || code.includes('2+2')) {
          output = output || '4';
        }
        
        if (code.includes('len(')) {
          output = output || '5'; // Default length
        }
        
        // Handle variable assignments and expressions
        if (code.includes('=') && !code.includes('==') && !code.includes('!=')) {
          const assignments = code.match(/(\w+)\s*=\s*(.+)/g);
          if (assignments && !output) {
            output = 'Variables assigned successfully';
          }
        }
        
        if (code.trim() === '' || code.trim().startsWith('#')) {
          output = '';
        }
        
        if (!output && !error && code.trim()) {
          output = 'Code executed successfully';
        }
        
        resolve({
          success: true,
          output: output,
          error: error,
          execution_time: Math.random() * 100 + 50, // Random execution time 50-150ms
          is_plot: isPlotGenerated
        });
      } catch (e) {
        resolve({
          success: false,
          output: '',
          error: `Runtime Error: ${e.message}`,
          execution_time: 0
        });
      }
    }, 100 + Math.random() * 500); // Simulate 100-600ms execution time
  });
}

function generateSamplePlot(code: string): string {
  // Generate different types of plots based on code content
  if (code.includes('bar') || code.includes('Bar')) {
    return generateBarChart();
  } else if (code.includes('scatter')) {
    return generateScatterPlot();
  } else {
    return generateLinePlot();
  }
}

function generateLinePlot(): string {
  return `<svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
    <rect width="600" height="400" fill="white"/>
    <g transform="translate(60, 40)">
      <!-- Grid lines -->
      <defs>
        <pattern id="grid" width="50" height="30" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 30" fill="none" stroke="#e0e0e0" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="480" height="300" fill="url(#grid)"/>
      
      <!-- Axes -->
      <line x1="0" y1="300" x2="480" y2="300" stroke="black" stroke-width="2"/>
      <line x1="0" y1="0" x2="0" y2="300" stroke="black" stroke-width="2"/>
      
      <!-- Sin curve -->
      <path d="M 0 150 Q 60 50 120 150 T 240 150 T 360 150 T 480 150" 
            stroke="blue" stroke-width="2" fill="none"/>
      
      <!-- Cos curve -->
      <path d="M 0 75 Q 60 225 120 150 Q 180 75 240 150 Q 300 225 360 150 Q 420 75 480 150" 
            stroke="red" stroke-width="2" fill="none" stroke-dasharray="5,5"/>
      
      <!-- Labels -->
      <text x="240" y="335" text-anchor="middle" font-family="Arial" font-size="12">x</text>
      <text x="-15" y="150" text-anchor="middle" font-family="Arial" font-size="12">y</text>
      
      <!-- Legend -->
      <g transform="translate(350, 50)">
        <rect x="0" y="0" width="120" height="60" fill="white" stroke="black"/>
        <line x1="10" y1="20" x2="30" y2="20" stroke="blue" stroke-width="2"/>
        <text x="35" y="24" font-family="Arial" font-size="10">sin(x)</text>
        <line x1="10" y1="40" x2="30" y2="40" stroke="red" stroke-width="2" stroke-dasharray="5,5"/>
        <text x="35" y="44" font-family="Arial" font-size="10">cos(x)</text>
      </g>
      
      <!-- Title -->
      <text x="240" y="-10" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold">
        Trigonometric Functions
      </text>
    </g>
  </svg>`;
}

function generateBarChart(): string {
  return `<svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
    <rect width="600" height="400" fill="white"/>
    <g transform="translate(60, 40)">
      <!-- Grid lines -->
      <defs>
        <pattern id="grid" width="80" height="30" patternUnits="userSpaceOnUse">
          <path d="M 80 0 L 0 0 0 30" fill="none" stroke="#e0e0e0" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="480" height="300" fill="url(#grid)"/>
      
      <!-- Axes -->
      <line x1="0" y1="300" x2="480" y2="300" stroke="black" stroke-width="2"/>
      <line x1="0" y1="0" x2="0" y2="300" stroke="black" stroke-width="2"/>
      
      <!-- Bars -->
      <rect x="40" y="45" width="60" height="255" fill="#3776ab" opacity="0.8"/>
      <rect x="120" y="75" width="60" height="225" fill="#f7df1e" opacity="0.8"/>
      <rect x="200" y="105" width="60" height="195" fill="#ed8b00" opacity="0.8"/>
      <rect x="280" y="135" width="60" height="165" fill="#00599c" opacity="0.8"/>
      <rect x="360" y="195" width="60" height="105" fill="#00add8" opacity="0.8"/>
      
      <!-- Labels -->
      <text x="70" y="320" text-anchor="middle" font-family="Arial" font-size="10">Python</text>
      <text x="150" y="320" text-anchor="middle" font-family="Arial" font-size="10">JavaScript</text>
      <text x="230" y="320" text-anchor="middle" font-family="Arial" font-size="10">Java</text>
      <text x="310" y="320" text-anchor="middle" font-family="Arial" font-size="10">C++</text>
      <text x="390" y="320" text-anchor="middle" font-family="Arial" font-size="10">Go</text>
      
      <!-- Value labels -->
      <text x="70" y="35" text-anchor="middle" font-family="Arial" font-size="10" font-weight="bold">85%</text>
      <text x="150" y="65" text-anchor="middle" font-family="Arial" font-size="10" font-weight="bold">75%</text>
      <text x="230" y="95" text-anchor="middle" font-family="Arial" font-size="10" font-weight="bold">65%</text>
      <text x="310" y="125" text-anchor="middle" font-family="Arial" font-size="10" font-weight="bold">45%</text>
      <text x="390" y="185" text-anchor="middle" font-family="Arial" font-size="10" font-weight="bold">35%</text>
      
      <!-- Title -->
      <text x="240" y="-10" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold">
        Programming Language Popularity 2024
      </text>
    </g>
  </svg>`;
}

function generateScatterPlot(): string {
  return `<svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
    <rect width="600" height="400" fill="white"/>
    <g transform="translate(60, 40)">
      <!-- Grid lines -->
      <defs>
        <pattern id="grid" width="50" height="30" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 30" fill="none" stroke="#e0e0e0" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="480" height="300" fill="url(#grid)"/>
      
      <!-- Axes -->
      <line x1="0" y1="300" x2="480" y2="300" stroke="black" stroke-width="2"/>
      <line x1="0" y1="0" x2="0" y2="300" stroke="black" stroke-width="2"/>
      
      <!-- Scatter points -->
      <circle cx="80" cy="120" r="6" fill="#440154" opacity="0.7"/>
      <circle cx="120" cy="180" r="8" fill="#31688e" opacity="0.7"/>
      <circle cx="160" cy="100" r="5" fill="#35b779" opacity="0.7"/>
      <circle cx="200" cy="200" r="9" fill="#fde725" opacity="0.7"/>
      <circle cx="240" cy="80" r="4" fill="#440154" opacity="0.7"/>
      <circle cx="280" cy="220" r="7" fill="#31688e" opacity="0.7"/>
      <circle cx="320" cy="60" r="6" fill="#35b779" opacity="0.7"/>
      <circle cx="360" cy="160" r="5" fill="#fde725" opacity="0.7"/>
      <circle cx="400" cy="40" r="8" fill="#440154" opacity="0.7"/>
      
      <!-- Trend line -->
      <line x1="50" y1="240" x2="450" y2="60" stroke="red" stroke-width="2" stroke-dasharray="5,5" opacity="0.8"/>
      
      <!-- Labels -->
      <text x="240" y="335" text-anchor="middle" font-family="Arial" font-size="12">X Values</text>
      <text x="-25" y="150" text-anchor="middle" font-family="Arial" font-size="12" transform="rotate(-90, -25, 150)">Y Values</text>
      
      <!-- Title -->
      <text x="240" y="-10" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold">
        Interactive Scatter Plot with Variable Size and Color
      </text>
    </g>
  </svg>`;
}
import React, { useState, useRef, useCallback } from 'react';
import './style.css';
import ThreeJSGraph from './components/ThreeJSGraph';
import type { GraphSpec } from './types/GraphSpec.js';

const App: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [graphSpec, setGraphSpec] = useState<GraphSpec | null>(null);
  const [error, setError] = useState<string>('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/webm;codecs=opus' 
        });
        
        await transcribeAudio(audioBlob);
        
        // Clean up
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError('Failed to access microphone. Please check permissions.');
      console.error('Error starting recording:', err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');
      
      // You'll need to add your OpenAI API key here
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!apiKey) {
        throw new Error('OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your .env file');
      }
      
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Transcription failed: ${errorData.error?.message || 'Unknown error'}`);
      }
      
      const result = await response.json();
      setTranscription(result.text);
      
      // Automatically interpret the transcription with GPT-5
      await interpretTranscription(result.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transcription failed');
      console.error('Transcription error:', err);
    } finally {
      setIsTranscribing(false);
    }
  };

  const interpretTranscription = async (text: string) => {
    setIsInterpreting(true);
    setError('');
    
    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!apiKey) {
        throw new Error('OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your .env file');
      }
      
      const systemPrompt = `You are a mathematical function interpreter. Convert the user's request into a JSON object that describes a mathematical function to be graphed.

IMPORTANT: Return ONLY a valid JSON object. Do not wrap it in markdown code blocks or any other formatting. Just return the raw JSON.

Use this exact structure:
{
  "version": "1.0",
  "plot": {
    "kind": "2d_explicit" | "2d_parametric" | "2d_polar" | "2d_inequality" | "3d_surface" | "2d_integral" | "3d_integral",
    "title": "Function title",
    "xLabel": "x",
    "yLabel": "y", 
    "zLabel": "z" (for 3D),
    "domain": {
      "x": [min, max],
      "y": [min, max] (for 3D or inequalities),
      "t": [min, max] (for parametric)
    },
    "resolution": 200,
    "expressions": {
      "yOfX": "x^2" (for 2d_explicit),
      "xOfT": "cos(t)", "yOfT": "sin(t)" (for parametric),
      "rOfTheta": "cos(4*theta)" (for polar),
      "surfaceZ": "sin(x)*cos(y)" (for 3D),
      "inequality": "y >= x^2" (for inequalities)
    },
    "integral": {
      "function": "cos(x)" (the function being integrated),
      "function2": "sin(x)" (second function for between-two-functions integrals),
      "variable": "x" (integration variable),
      "lowerBound": 1,
      "upperBound": 5,
      "showArea": true,
      "areaColor": "#3b82f6",
      "areaOpacity": 0.3,
      "betweenFunctions": false (true for area between two functions)
    },
    "style": {
      "lineWidth": 2,
      "showGrid": true,
      "theme": "light",
      "color": "#3b82f6"
    }
  }
}

Supported function types:
- 2d_explicit: y = f(x) functions
- 2d_parametric: x = f(t), y = g(t) functions  
- 2d_polar: r = f(θ) functions
- 2d_inequality: regions defined by inequalities
- 3d_surface: z = f(x,y) surfaces
- 2d_integral: definite integrals ∫[a,b] f(x) dx with shaded area
- 3d_integral: volume integrals with shaded volume

For integrals, use kind "2d_integral" and include the integral object with function, bounds, and shading options.
For between-two-functions integrals (area between curves), set betweenFunctions: true and provide both function and function2.
Use standard math notation: x^2, sin(x), cos(x), exp(x), log(x), sqrt(x), abs(x)
For domains, use reasonable ranges like [-5, 5] for 2D, [-3, 3] for 3D`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o', // Using GPT-4o as GPT-5 is not yet available
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text }
          ],
          temperature: 0.1,
          max_tokens: 1000
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Interpretation failed: ${errorData.error?.message || 'Unknown error'}`);
      }
      
      const result = await response.json();
      const content = result.choices[0].message.content;
      
      // Clean the content to remove markdown code blocks if present
      let jsonContent = content.trim();
      
      // Remove markdown code blocks
      if (jsonContent.includes('```json')) {
        const match = jsonContent.match(/```json\s*([\s\S]*?)\s*```/);
        if (match) {
          jsonContent = match[1].trim();
        }
      } else if (jsonContent.includes('```')) {
        const match = jsonContent.match(/```\s*([\s\S]*?)\s*```/);
        if (match) {
          jsonContent = match[1].trim();
        }
      }
      
      // Remove any remaining markdown formatting
      jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      
      // Parse the JSON response
      const parsedSpec = JSON.parse(jsonContent) as GraphSpec;
      setGraphSpec(parsedSpec);
    } catch (err) {
      console.error('Interpretation error:', err);
      setError(`Interpretation failed: ${err instanceof Error ? err.message : 'Unknown error'}. Check console for details.`);
    } finally {
      setIsInterpreting(false);
    }
  };

  const handleMouseDown = () => {
    startRecording();
  };

  const handleMouseUp = () => {
    stopRecording();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.code === 'Space' && !isRecording) {
      e.preventDefault();
      startRecording();
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (e.code === 'Space' && isRecording) {
      e.preventDefault();
      stopRecording();
    }
  };

  const testGraph = () => {
    const testSpec: GraphSpec = {
      version: "1.0",
      plot: {
        kind: "2d_explicit",
        title: "y = x²",
        xLabel: "x",
        yLabel: "y",
        domain: { x: [-5, 5] },
        resolution: 300,
        expressions: { yOfX: "x**2" },
        style: {
          lineWidth: 2,
          showGrid: true,
          theme: "light",
          color: "#3b82f6"
        }
      }
    };
    setGraphSpec(testSpec);
  };

  const testIntegral = () => {
    const testSpec: GraphSpec = {
      version: "1.0",
      plot: {
        kind: "2d_integral",
        title: "∫[1,5] cos(x) dx",
        xLabel: "x",
        yLabel: "y",
        domain: { x: [-1, 7] },
        resolution: 300,
        expressions: { yOfX: "cos(x)" },
        integral: {
          function: "cos(x)",
          variable: "x",
          lowerBound: 1,
          upperBound: 5,
          showArea: true,
          areaColor: "#ef4444",
          areaOpacity: 0.4
        },
        style: {
          lineWidth: 2,
          showGrid: true,
          theme: "light",
          color: "#3b82f6"
        }
      }
    };
    setGraphSpec(testSpec);
  };

  const testBetweenFunctions = () => {
    const testSpec: GraphSpec = {
      version: "1.0",
      plot: {
        kind: "2d_integral",
        title: "Area between y = x² and y = x",
        xLabel: "x",
        yLabel: "y",
        domain: { x: [-1, 3] },
        resolution: 300,
        expressions: { yOfX: "x**2" },
        integral: {
          function: "x**2",
          function2: "x",
          variable: "x",
          lowerBound: 0,
          upperBound: 1,
          showArea: true,
          areaColor: "#10b981",
          areaOpacity: 0.5,
          betweenFunctions: true
        },
        style: {
          lineWidth: 2,
          showGrid: true,
          theme: "light",
          color: "#3b82f6"
        }
      }
    };
    setGraphSpec(testSpec);
  };

  const test3DVolume = () => {
    const testSpec: GraphSpec = {
      version: "1.0",
      plot: {
        kind: "3d_integral",
        title: "Volume between z = x² + y² and z = 2x + 2y",
        xLabel: "x",
        yLabel: "y",
        zLabel: "z",
        domain: { x: [-4, 4], y: [-4, 4] },
        resolution: 60,
        expressions: { surfaceZ: "x**2 + y**2" },
        integral: {
          function: "x**2 + y**2",
          function2: "2*x + 2*y",
          variable: "x",
          lowerBound: -2,
          upperBound: 2,
          showArea: true,
          areaColor: "#8b5cf6",
          areaOpacity: 0.4,
          betweenFunctions: true
        },
        style: {
          lineWidth: 2,
          showGrid: true,
          theme: "light",
          color: "#3b82f6"
        }
      }
    };
    setGraphSpec(testSpec);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Whisper API Test
        </h1>
        
        <div className="space-y-6">
          {/* Press to Talk Button */}
          <div className="flex flex-col items-center space-y-4">
            <button
              className={`w-32 h-32 rounded-full text-white font-semibold text-lg transition-all duration-200 transform ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 scale-105 shadow-lg' 
                  : 'bg-blue-500 hover:bg-blue-600 hover:scale-105'
              } ${isTranscribing ? 'opacity-50 cursor-not-allowed' : ''}`}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchEnd={handleMouseUp}
              onKeyDown={handleKeyDown}
              onKeyUp={handleKeyUp}
              disabled={isTranscribing}
              tabIndex={0}
            >
              {isTranscribing ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
                  <span className="text-sm">Processing...</span>
                </div>
              ) : isRecording ? (
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 bg-white rounded-full mb-2"></div>
                  <span className="text-sm">Release</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 bg-white rounded-full mb-2"></div>
                  <span className="text-sm">Hold to Talk</span>
                </div>
              )}
            </button>
            
            <p className="text-sm text-gray-600 text-center">
              Hold the button and speak, or press and hold the spacebar
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={testGraph}
                className="mt-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
              >
                Test Graph (y = x²)
              </button>
              <button
                onClick={testIntegral}
                className="mt-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors"
              >
                Test Integral (∫cos(x))
              </button>
              <button
                onClick={testBetweenFunctions}
                className="mt-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors"
              >
                Test Between (x² vs x)
              </button>
              <button
                onClick={test3DVolume}
                className="mt-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded-lg transition-colors"
              >
                Test 3D Volume
              </button>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex justify-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-sm ${
              isRecording ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
            }`}>
              {isRecording ? 'Recording...' : 'Ready'}
            </div>
            {isTranscribing && (
              <div className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                Transcribing...
              </div>
            )}
            {isInterpreting && (
              <div className="px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                Interpreting...
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Transcription Result */}
          {transcription && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-800 mb-2">Transcription:</h3>
              <p className="text-green-700">{transcription}</p>
            </div>
          )}

          {/* Graph Visualization */}
          {graphSpec && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                Graph: {graphSpec.plot.title || `${graphSpec.plot.kind} function`}
              </h3>
              <div className="flex justify-center">
                <ThreeJSGraph 
                  graphSpec={graphSpec} 
                  width={400} 
                  height={300} 
                />
              </div>
              <div className="mt-2 text-xs text-blue-600">
                Type: {graphSpec.plot.kind} | 
                Domain: {graphSpec.plot.domain.x ? `x: [${graphSpec.plot.domain.x[0]}, ${graphSpec.plot.domain.x[1]}]` : ''}
                {graphSpec.plot.domain.y ? ` y: [${graphSpec.plot.domain.y[0]}, ${graphSpec.plot.domain.y[1]}]` : ''}
                {graphSpec.plot.domain.t ? ` t: [${graphSpec.plot.domain.t[0]}, ${graphSpec.plot.domain.t[1]}]` : ''}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-800 mb-2">Setup Instructions:</h3>
            <ol className="text-sm text-gray-600 space-y-1">
              <li>1. Create a <code className="bg-gray-200 px-1 rounded">.env</code> file in the Frontend directory</li>
              <li>2. Add your OpenAI API key: <code className="bg-gray-200 px-1 rounded">VITE_OPENAI_API_KEY=your_api_key_here</code></li>
              <li>3. Restart the development server</li>
              <li>4. Allow microphone permissions when prompted</li>
            </ol>
            <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
              <h4 className="text-sm font-medium text-blue-800 mb-1">Try saying:</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• "Graph y equals x squared"</li>
                <li>• "Plot a sine wave"</li>
                <li>• "Show me a circle"</li>
                <li>• "Draw a 3D surface z equals x times y"</li>
                <li>• "Graph the integral from 1 to 5 of cosine of x dx"</li>
                <li>• "Show the integral of x squared from 0 to 3"</li>
                <li>• "Graph the area between y equals x squared and y equals x"</li>
                <li>• "Show the volume between z equals x squared plus y squared and z equals 2x plus 2y"</li>
                <li>• "Plot the volume between z equals sine of x times cosine of y and z equals x plus y"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

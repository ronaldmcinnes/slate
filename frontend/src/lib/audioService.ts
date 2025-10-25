// Audio recording service for OpenAI Whisper integration
export interface AudioRecordingState {
  isRecording: boolean;
  isTranscribing: boolean;
  isInterpreting: boolean;
  transcription: string;
  error: string;
}

export class AudioRecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async startRecording(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });
      
      this.audioChunks = [];
      
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.start();
    } catch (err) {
      throw new Error('Failed to access microphone. Please check permissions.');
    }
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { 
          type: 'audio/webm;codecs=opus' 
        });
        
        // Clean up
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
          this.stream = null;
        }
        
        resolve(audioBlob);
      };
      
      this.mediaRecorder.stop();
    });
  }

  async transcribeAudio(audioBlob: Blob): Promise<string> {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your .env file');
    }
    
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');
    
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
    return result.text;
  }

  async interpretTranscription(text: string): Promise<any> {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your .env file');
    }
    
    const systemPrompt = `You are a mathematical function interpreter. Convert the user's request into a valid JSON object that describes a mathematical function to be graphed.

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
        model: 'gpt-5-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        max_completion_tokens: 2000
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
    return JSON.parse(jsonContent);
  }
}

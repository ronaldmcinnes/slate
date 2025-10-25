import { Mic, MicOff, Sparkles, FileText } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Canvas({ page }) {
  const [isRecording, setIsRecording] = useState(false);

  if (!page) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background grain">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-card border-2 border-border flex items-center justify-center">
            <FileText size={40} className="text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-serif text-foreground mb-3 font-bold">No page selected</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Select or create a page to start your teaching session
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Toolbar */}
      <div className="border-b border-border bg-card/50 backdrop-blur-md grain">
        <div className="flex items-center justify-between px-8 py-5">
          <div>
            <h2 className="text-xl font-serif font-bold text-foreground">{page.title}</h2>
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
              <span>Last modified</span>
              <span className="text-primary">•</span>
              <span>{new Date(page.lastModified).toLocaleString()}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsRecording(!isRecording)}
              variant={isRecording ? "destructive" : "default"}
              size="lg"
              className="font-semibold"
            >
              {isRecording ? (
                <>
                  <MicOff size={18} />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic size={18} />
                  Start Recording
                </>
              )}
            </Button>

            <Button variant="outline" size="lg" className="font-semibold border-2">
              <Sparkles size={18} />
              Generate
            </Button>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 overflow-auto p-8 grain">
        <div className="max-w-6xl mx-auto">
          {/* Placeholder Canvas */}
          <div className="bg-card border-2 border-border rounded-2xl min-h-[600px] p-10 shadow-2xl">
            {page.content ? (
              <div className="prose prose-invert max-w-none">
                <p className="text-muted-foreground">{page.content}</p>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[500px]">
                <div className="text-center max-w-lg">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-accent/30 border-2 border-primary/30 flex items-center justify-center">
                    <Mic size={32} className="text-primary" />
                  </div>
                  <h3 className="text-2xl font-serif text-foreground mb-3 font-bold">
                    Start Teaching with Voice
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Click the microphone to begin recording. Describe mathematical concepts,
                    diagrams, or visualizations, and Slate will help you create them through
                    the power of AI.
                  </p>
                  <div className="mt-8 pt-8 border-t border-border">
                    <p className="text-xs text-muted-foreground/70 italic">
                      "Think OneNote, but AI-powered for educators"
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recording Indicator */}
      {isRecording && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-destructive text-destructive-foreground px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 border-2 border-destructive/50 animate-pulse">
          <div className="w-3 h-3 bg-destructive-foreground rounded-full"></div>
          <span className="font-semibold">Recording in progress...</span>
        </div>
      )}
    </div>
  );
}

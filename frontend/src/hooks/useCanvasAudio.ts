import { useCallback } from "react";
import type { Page } from "@/types";

interface UseCanvasAudioProps {
  page: Page | null;
  onUpdatePage: (updates: Partial<Page>) => void;
  audioService: React.RefObject<any>;
  setIsRecording: (recording: boolean) => void;
  setIsTranscribing: (transcribing: boolean) => void;
  setIsInterpreting: (interpreting: boolean) => void;
  setTranscription: (transcription: string) => void;
  setError: (error: string) => void;
}

export function useCanvasAudio({
  page,
  onUpdatePage,
  audioService,
  setIsRecording,
  setIsTranscribing,
  setIsInterpreting,
  setTranscription,
  setError,
}: UseCanvasAudioProps) {
  const handleStartRecording = useCallback(async () => {
    try {
      setError("");
      await audioService.current.startRecording();
      setIsRecording(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start recording"
      );
    }
  }, [audioService, setIsRecording, setError]);

  const handleStopRecording = useCallback(async () => {
    try {
      const audioBlob = await audioService.current.stopRecording();
      setIsRecording(false);
      setIsTranscribing(true);

      const transcriptionText = await audioService.current.transcribeAudio(
        audioBlob
      );
      setTranscription(transcriptionText);
      setIsTranscribing(false);

      setIsInterpreting(true);
      const graphSpec = await audioService.current.interpretTranscription(
        transcriptionText
      );
      setIsInterpreting(false);

      const graphs = page?.graphs || [];
      const newGraph = {
        id: Date.now().toString(),
        type: "threejs",
        data: graphSpec,
        layout: {},
        position: { x: 100, y: 100 },
        size: { width: 500, height: 400 },
        graphSpec: graphSpec,
      };
      graphs.push(newGraph);
      onUpdatePage({ graphs });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recording failed");
      setIsRecording(false);
      setIsTranscribing(false);
      setIsInterpreting(false);
    }
  }, [
    page,
    onUpdatePage,
    audioService,
    setIsRecording,
    setIsTranscribing,
    setIsInterpreting,
    setTranscription,
    setError,
  ]);

  return {
    handleStartRecording,
    handleStopRecording,
  };
}

import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface AudioRecordingButtonProps {
  isRecording: boolean;
  isTranscribing: boolean;
  isInterpreting: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  className?: string;
}

export default function AudioRecordingButton({
  isRecording,
  isTranscribing,
  isInterpreting,
  onStartRecording,
  onStopRecording,
  className = "h-9 w-9 hover:bg-muted",
}: AudioRecordingButtonProps) {
  return (
    <Button
      onMouseDown={onStartRecording}
      onMouseUp={onStopRecording}
      onTouchStart={onStartRecording}
      onTouchEnd={onStopRecording}
      variant={isRecording ? "destructive" : "ghost"}
      size="icon"
      className={`${className} ${
        isTranscribing || isInterpreting ? "opacity-50 cursor-not-allowed" : ""
      }`}
      disabled={isTranscribing || isInterpreting}
      title={
        isTranscribing
          ? "Transcribing..."
          : isInterpreting
          ? "Interpreting..."
          : isRecording
          ? "Release to stop recording"
          : "Hold to record audio"
      }
    >
      {isTranscribing || isInterpreting ? (
        <LoadingSpinner size="sm" text="" showText={false} />
      ) : isRecording ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" x2="12" y1="2" y2="22" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" x2="12" y1="19" y2="22" />
        </svg>
      )}
    </Button>
  );
}

import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface AudioStatusProps {
  isRecording: boolean;
  isTranscribing: boolean;
  isInterpreting: boolean;
  transcription: string;
  onClearTranscription: () => void;
}

export default function AudioStatus({
  isRecording,
  isTranscribing,
  isInterpreting,
  transcription,
  onClearTranscription,
}: AudioStatusProps) {
  return (
    <>
      {/* Recording Status */}
      {isRecording && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-destructive text-destructive-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-pulse z-50">
          <div className="w-2 h-2 bg-destructive-foreground rounded-full"></div>
          <span className="text-sm font-medium">Recording...</span>
        </div>
      )}

      {/* Transcribing Status */}
      {isTranscribing && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-50">
          <LoadingSpinner
            size="sm"
            text=""
            showText={false}
            className="text-white"
          />
          <span className="text-sm font-medium">Transcribing...</span>
        </div>
      )}

      {/* Interpreting Status */}
      {isInterpreting && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-50">
          <LoadingSpinner
            size="sm"
            text=""
            showText={false}
            className="text-white"
          />
          <span className="text-sm font-medium">Interpreting...</span>
        </div>
      )}

      {/* Transcription Result */}
      {transcription && (
        <div className="absolute top-20 right-6 bg-green-50 border border-green-200 rounded-lg p-4 max-w-md z-50">
          <h3 className="text-sm font-medium text-green-800 mb-2">
            Transcription:
          </h3>
          <p className="text-green-700 text-sm">{transcription}</p>
          <button
            onClick={onClearTranscription}
            className="mt-2 text-xs text-green-600 hover:text-green-800 underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </>
  );
}

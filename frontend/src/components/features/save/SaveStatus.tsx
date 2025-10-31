import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface SaveStatusProps {
  isSaving: boolean;
  saveSuccess: boolean;
  error: string;
  onClearError: () => void;
}

export default function SaveStatus({
  isSaving,
  saveSuccess,
  error,
  onClearError,
}: SaveStatusProps) {
  return (
    <>
      {/* Saving Status */}
      {isSaving && (
        <button
          type="button"
          disabled
          className="text-gray-700 px-3 py-1.5 flex items-center gap-2 pointer-events-auto border border-gray-300 rounded-md bg-white/80 backdrop-blur-sm hover:bg-gray-50 transition-colors"
        >
          <LoadingSpinner
            size="sm"
            text=""
            showText={false}
            className="text-gray-700"
          />
          <span className="text-sm font-medium">Saving...</span>
        </button>
      )}

      {/* Save Success */}
      {saveSuccess && (
        <button
          type="button"
          disabled
          className="text-gray-700 px-3 py-1.5 flex items-center gap-2 pointer-events-auto border border-gray-300 rounded-md bg-white/80 backdrop-blur-sm hover:bg-gray-50 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <span className="text-sm font-medium">Saved!</span>
        </button>
      )}

      {/* Error Display */}
      {error && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-50 border border-red-200 rounded-lg p-4 max-w-md z-50">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
              <button
                onClick={onClearError}
                className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

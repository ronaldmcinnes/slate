import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Database, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";

interface CleanupButtonProps {
  onCleanupComplete?: (stats: any) => void;
}

export default function CleanupButton({
  onCleanupComplete,
}: CleanupButtonProps) {
  const [isCleaning, setIsCleaning] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const handleCleanup = async () => {
    try {
      setIsCleaning(true);
      const response = await api.post("/cleanup/cleanup");

      if (response.data.success) {
        setStats(response.data.stats);
        setShowStats(true);
        onCleanupComplete?.(response.data.stats);

        // Hide stats after 5 seconds
        setTimeout(() => setShowStats(false), 5000);
      }
    } catch (error) {
      console.error("Cleanup failed:", error);
    } finally {
      setIsCleaning(false);
    }
  };

  const getStorageStats = async () => {
    try {
      const response = await api.get("/cleanup/stats");
      if (response.data.success) {
        setStats(response.data.stats);
        setShowStats(true);
      }
    } catch (error) {
      console.error("Failed to get storage stats:", error);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button
          onClick={handleCleanup}
          disabled={isCleaning}
          variant="outline"
          size="sm"
          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
        >
          {isCleaning ? (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
              Cleaning...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Trash2 size={14} />
              Clean Up Storage
            </div>
          )}
        </Button>

        <Button
          onClick={getStorageStats}
          variant="ghost"
          size="sm"
          className="text-blue-600 hover:text-blue-700"
        >
          <Database size={14} />
        </Button>
      </div>

      {showStats && stats && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
          <div className="flex items-center gap-2 mb-2">
            <Database size={14} className="text-blue-600" />
            <span className="font-medium text-blue-800">
              Storage Statistics
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-blue-600">Active Pages:</span>{" "}
              {stats.totalPages || stats.pages}
            </div>
            <div>
              <span className="text-blue-600">Notebooks:</span>{" "}
              {stats.totalNotebooks || stats.notebooks}
            </div>
            <div>
              <span className="text-blue-600">Trash Items:</span>{" "}
              {stats.totalTrash || stats.trash}
            </div>
            {stats.deletedTrashItems > 0 && (
              <div className="col-span-2 text-green-600">
                ✓ Cleaned {stats.deletedTrashItems} old trash items
              </div>
            )}
            {stats.movedEmptyPages > 0 && (
              <div className="col-span-2 text-green-600">
                ✓ Moved {stats.movedEmptyPages} empty pages to trash
              </div>
            )}
            {stats.movedEmptyNotebooks > 0 && (
              <div className="col-span-2 text-green-600">
                ✓ Moved {stats.movedEmptyNotebooks} empty notebooks to trash
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { useCallback } from "react";
import type { Page } from "@/types";
import { compressDrawingData, getCompressionRatio } from "@/lib/compression";

interface UseCanvasSaveProps {
  page: Page | null;
  isReadOnly: boolean;
  canvasRef: React.RefObject<any>;
  onUpdatePage: (updates: Partial<Page>) => void;
  setIsSaving: (saving: boolean) => void;
  setHasUnsavedChanges: (changed: boolean) => void;
  setSaveSuccess: (success: boolean) => void;
  setError: (error: string) => void;
}

export function useCanvasSave({
  page,
  isReadOnly,
  canvasRef,
  onUpdatePage,
  setIsSaving,
  setHasUnsavedChanges,
  setSaveSuccess,
  setError,
}: UseCanvasSaveProps) {
  const savePageState = useCallback(async () => {
    if (!page || isReadOnly) {
      console.log("Cannot save: no page or read-only mode");
      return;
    }

    try {
      setIsSaving(true);
      const startTime = performance.now();
      console.log("Starting to save page state...");

      // Set up timeout to prevent infinite hanging
      const SAVE_TIMEOUT = 30000; // 30 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Save operation timed out after 30 seconds")),
          SAVE_TIMEOUT
        );
      });

      const saveOperation = async () => {
        // Step 1: Get current drawing paths with performance monitoring
        let paths = null;
        const pathsStartTime = performance.now();

        if (canvasRef.current) {
          console.log("Exporting drawing paths...");
          try {
            // Add timeout specifically for exportPaths
            const exportPathsPromise = canvasRef.current.exportPaths();
            const exportTimeoutPromise = new Promise((_, reject) => {
              setTimeout(
                () =>
                  reject(new Error("exportPaths timed out after 10 seconds")),
                10000
              );
            });

            paths = await Promise.race([
              exportPathsPromise,
              exportTimeoutPromise,
            ]);
            const pathsEndTime = performance.now();
            console.log(
              `Drawing paths exported in ${(
                pathsEndTime - pathsStartTime
              ).toFixed(2)}ms`
            );

            // Log path data size for debugging
            if (paths && Array.isArray(paths)) {
              const pathCount = paths.length;
              const pathDataSize = JSON.stringify(paths).length;
              console.log(
                `Path data: ${pathCount} paths, ${(pathDataSize / 1024).toFixed(
                  2
                )}KB`
              );

              // Warn if data is unusually large
              if (pathDataSize > 1024 * 1024) {
                // > 1MB
                console.warn(
                  `⚠️ Large drawing data detected: ${(
                    pathDataSize /
                    1024 /
                    1024
                  ).toFixed(2)}MB`
                );
                console.warn(
                  "Consider clearing the canvas to improve performance"
                );
              }

              // If data is extremely large (>5MB), offer to clear canvas
              if (pathDataSize > 5 * 1024 * 1024) {
                console.error(
                  `🚨 Extremely large drawing data: ${(
                    pathDataSize /
                    1024 /
                    1024
                  ).toFixed(2)}MB`
                );
                console.error(
                  "This may cause performance issues. Consider clearing the canvas."
                );
              }
            }
          } catch (pathsError) {
            console.error("Failed to export drawing paths:", pathsError);
            // Continue with null paths rather than failing completely
          }
        }

        // Step 2: Prepare page state with compression
        const stateStartTime = performance.now();

        // Compress drawing data to reduce storage size
        let compressedDrawings = null;
        if (paths) {
          const drawingData = { paths };
          compressedDrawings = compressDrawingData(drawingData);
          const compressionRatio = getCompressionRatio(
            drawingData,
            compressedDrawings
          );
          console.log(
            `Drawing data compressed by ${compressionRatio.toFixed(1)}%`
          );
        }

        const pageState = {
          drawings: compressedDrawings,
          textBoxes: page.textBoxes || [],
          graphs: page.graphs || [],
        };
        const stateEndTime = performance.now();
        console.log(
          `Page state prepared in ${(stateEndTime - stateStartTime).toFixed(
            2
          )}ms`
        );

        // Log total data size being sent
        const totalDataSize = JSON.stringify(pageState).length;
        console.log(`Total data size: ${(totalDataSize / 1024).toFixed(2)}KB`);
        console.log("Saving page state:", {
          hasDrawings: !!pageState.drawings,
          textBoxCount: pageState.textBoxes.length,
          graphCount: pageState.graphs.length,
          dataSize: `${(totalDataSize / 1024).toFixed(2)}KB`,
        });

        // Step 3: Save to database with performance monitoring
        const saveStartTime = performance.now();
        console.log("Sending data to database...");

        await onUpdatePage(pageState);

        const saveEndTime = performance.now();
        const totalTime = performance.now() - startTime;

        console.log(
          `Database save completed in ${(saveEndTime - saveStartTime).toFixed(
            2
          )}ms`
        );
        console.log(`Total save time: ${totalTime.toFixed(2)}ms`);

        setHasUnsavedChanges(false);
        setSaveSuccess(true);
        console.log("Page saved successfully to database");

        // Hide success message after 2 seconds
        setTimeout(() => setSaveSuccess(false), 2000);
      };

      // Race between save operation and timeout
      await Promise.race([saveOperation(), timeoutPromise]);
    } catch (error) {
      console.error("Failed to save page state:", error);
      // Show error to user
      setError(
        `Save failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsSaving(false);
    }
  }, [
    page,
    isReadOnly,
    canvasRef,
    onUpdatePage,
    setIsSaving,
    setHasUnsavedChanges,
    setSaveSuccess,
    setError,
  ]);

  return { savePageState };
}

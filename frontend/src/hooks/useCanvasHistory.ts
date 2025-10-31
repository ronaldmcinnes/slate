import { useRef } from "react";

interface UseCanvasHistoryProps {
  canvasRef: React.RefObject<any>;
  recomputeSelectionBBoxFromCanvas: () => Promise<void>;
}

export function useCanvasHistory({
  canvasRef,
  recomputeSelectionBBoxFromCanvas,
}: UseCanvasHistoryProps) {
  const customHistoryRef = useRef<any[][]>([]);
  const customHistoryIndexRef = useRef<number>(-1);
  const transformSessionActiveRef = useRef<boolean>(false);
  const transformSnapshotPendingRef = useRef<boolean>(false);

  const clearForwardHistory = () => {
    const idx = customHistoryIndexRef.current;
    if (idx < customHistoryRef.current.length - 1) {
      customHistoryRef.current = customHistoryRef.current.slice(0, idx + 1);
    }
  };

  const snapshotPaths = async () => {
    const instance: any = canvasRef.current;
    if (!instance) return;
    const exported: any = (await instance.exportPaths?.()) || [];
    const paths: any[] = Array.isArray(exported) ? exported : exported.paths || [];
    clearForwardHistory();
    customHistoryRef.current.push(JSON.parse(JSON.stringify(paths)));
    customHistoryIndexRef.current = customHistoryRef.current.length - 1;
  };

  const pushCurrentSnapshot = async () => {
    const instance: any = canvasRef.current;
    if (!instance) return;
    const exported: any = (await instance.exportPaths?.()) || [];
    const paths: any[] = Array.isArray(exported) ? exported : exported.paths || [];
    clearForwardHistory();
    customHistoryRef.current.push(JSON.parse(JSON.stringify(paths)));
    customHistoryIndexRef.current = customHistoryRef.current.length - 1;
  };

  const beginTransformSession = () => {
    if (transformSessionActiveRef.current) return;
    transformSnapshotPendingRef.current = true;
    void (async () => {
      await snapshotPaths();
      transformSnapshotPendingRef.current = false;
    })();
    transformSessionActiveRef.current = true;
  };

  const endTransformSession = () => {
    if (!transformSessionActiveRef.current) return;
    transformSessionActiveRef.current = false;
    void pushCurrentSnapshot();
  };

  const tryCustomUndo = async (): Promise<boolean> => {
    const idx = customHistoryIndexRef.current;
    if (idx <= 0) return false;
    customHistoryIndexRef.current = idx - 1;
    const snapshot = customHistoryRef.current[customHistoryIndexRef.current];
    const instance: any = canvasRef.current;
    if (!instance) return false;
    await instance.clearCanvas?.();
    await instance.loadPaths?.(snapshot);
    await recomputeSelectionBBoxFromCanvas();
    return true;
  };

  const tryCustomRedo = async (): Promise<boolean> => {
    const idx = customHistoryIndexRef.current;
    if (idx >= customHistoryRef.current.length - 1) return false;
    customHistoryIndexRef.current = idx + 1;
    const snapshot = customHistoryRef.current[customHistoryIndexRef.current];
    const instance: any = canvasRef.current;
    if (!instance) return false;
    await instance.clearCanvas?.();
    await instance.loadPaths?.(snapshot);
    await recomputeSelectionBBoxFromCanvas();
    return true;
  };

  return {
    snapshotPaths,
    pushCurrentSnapshot,
    beginTransformSession,
    endTransformSession,
    tryCustomUndo,
    tryCustomRedo,
    transformSnapshotPendingRef,
  };
}



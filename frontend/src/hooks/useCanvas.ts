import { useState, useRef, useEffect } from "react";
import { AudioRecordingService } from "@/lib/audioService";
import type { Page } from "@/types";

export interface CanvasState {
  isRecording: boolean;
  isTranscribing: boolean;
  isInterpreting: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  saveSuccess: boolean;
  transcription: string;
  error: string;
  strokeColor: string;
  strokeWidth: number;
  tool: string;
  isEditingTitle: boolean;
  tempTitle: string;
  isToolbarVisible: boolean;
  toolbarScrollPosition: number;
  canvasSize: { width: number; height: number };
  visibleTools: {
    eraser: boolean;
    markers: boolean;
    highlighter: boolean;
    fountainPen: boolean;
    text: boolean;
    lasso: boolean;
    graph: boolean;
    microphone: boolean;
  };
}

export interface CanvasActions {
  setStrokeColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setTool: (tool: string) => void;
  setIsEditingTitle: (editing: boolean) => void;
  setTempTitle: (title: string) => void;
  setIsToolbarVisible: (visible: boolean) => void;
  setToolbarScrollPosition: (position: number) => void;
  setCanvasSize: (size: { width: number; height: number }) => void;
  setVisibleTools: (tools: CanvasState["visibleTools"]) => void;
  markAsChanged: () => void;
  clearError: () => void;
  clearTranscription: () => void;
}

export function useCanvas(
  page: Page | null,
  onUpdatePage: (updates: Partial<Page>) => void,
  initialState?: {
    strokeColor?: string;
    strokeWidth?: number;
    tool?: string;
    canvasSize?: { width: number; height: number };
    toolbarScrollPosition?: number;
    isToolbarVisible?: boolean;
    visibleTools?: {
      eraser: boolean;
      markers: boolean;
      highlighter: boolean;
      fountainPen: boolean;
      text: boolean;
      lasso: boolean;
      graph: boolean;
      microphone: boolean;
    };
  }
) {
  // State
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [error, setError] = useState("");

  // Initialize stroke color based on current theme
  const getInitialStrokeColor = () => {
    return typeof window !== "undefined" &&
      document.documentElement.classList.contains("dark")
      ? "#FFFFFF"
      : "#000000";
  };

  const [strokeColor, setStrokeColor] = useState(
    initialState?.strokeColor || getInitialStrokeColor()
  );
  const [strokeWidth, setStrokeWidth] = useState(
    initialState?.strokeWidth || 3
  );
  const [tool, setTool] = useState(initialState?.tool || "marker");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState("");
  const [isToolbarVisible, setIsToolbarVisible] = useState(
    initialState?.isToolbarVisible ?? true
  );
  const [toolbarScrollPosition, setToolbarScrollPosition] = useState(
    initialState?.toolbarScrollPosition || 0
  );
  const [canvasSize, setCanvasSize] = useState(
    initialState?.canvasSize || { width: 200, height: 200 }
  );
  const [visibleTools, setVisibleTools] = useState(
    initialState?.visibleTools || {
      eraser: true,
      markers: true,
      highlighter: true,
      fountainPen: true,
      text: true,
      lasso: true,
      graph: true,
      microphone: true,
    }
  );

  // Refs
  const canvasRef = useRef<any>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const toolbarScrollRef = useRef<HTMLDivElement | null>(null);
  const audioService = useRef(new AudioRecordingService());
  const saveDrawingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Actions
  const markAsChanged = () => setHasUnsavedChanges(true);
  const clearError = () => setError("");
  const clearTranscription = () => setTranscription("");

  // Theme-aware stroke color updates
  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      const isDark = root.classList.contains("dark");
      setStrokeColor((current) => {
        if (isDark && current === "#000000") return "#FFFFFF";
        if (!isDark && current === "#FFFFFF") return "#000000";
        return current;
      });
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const state: CanvasState = {
    isRecording,
    isTranscribing,
    isInterpreting,
    isSaving,
    hasUnsavedChanges,
    saveSuccess,
    transcription,
    error,
    strokeColor,
    strokeWidth,
    tool,
    isEditingTitle,
    tempTitle,
    isToolbarVisible,
    toolbarScrollPosition,
    canvasSize,
    visibleTools,
  };

  const actions: CanvasActions = {
    setStrokeColor,
    setStrokeWidth,
    setTool,
    setIsEditingTitle,
    setTempTitle,
    setIsToolbarVisible,
    setToolbarScrollPosition,
    setCanvasSize,
    setVisibleTools,
    markAsChanged,
    clearError,
    clearTranscription,
  };

  return {
    state,
    actions,
    refs: {
      canvasRef,
      canvasContainerRef,
      titleInputRef,
      toolbarScrollRef,
      audioService,
      saveDrawingTimeoutRef,
    },
    setters: {
      setIsRecording,
      setIsTranscribing,
      setIsInterpreting,
      setIsSaving,
      setHasUnsavedChanges,
      setSaveSuccess,
      setTranscription,
      setError,
    },
  };
}

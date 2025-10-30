import { useState, useRef, useEffect } from "react";
import { GripVertical, X } from "lucide-react";

interface TextBoxData {
  id: string;
  x: number | string;
  y: number | string;
  text: string;
}

interface TextBoxProps {
  textBox: TextBoxData;
  onPositionChange: (id: string, x: number, y: number) => void;
  onTextChange: (id: string, text: string) => void;
  onRemove: (id: string) => void;
  isReadOnly?: boolean;
  isSelected?: boolean;
}

export default function TextBox({
  textBox,
  onPositionChange,
  onTextChange,
  onRemove,
  isReadOnly = false,
  isSelected = false,
}: TextBoxProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [position, setPosition] = useState({
    x: parseInt(textBox.x as string) || 100,
    y: parseInt(textBox.y as string) || 100,
  });
  const [text, setText] = useState(textBox.text || "");
  const dragRef = useRef({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    startScrollLeft: 0,
    startScrollTop: 0,
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const globalHandlersRef = useRef<{ move?: any; up?: any }>({});

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const ta = textareaRef.current;
      ta.focus();
      // Auto-size on enter edit mode
      ta.style.height = "auto";
      ta.style.height = `${ta.scrollHeight}px`;
    }
  }, [isEditing]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isReadOnly) return;
    if ((e.target as HTMLElement)?.closest?.(".drag-handle")) {
      e.preventDefault();
      setIsDragging(true);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initialX: position.x,
        initialY: position.y,
        startScrollLeft:
          (document.querySelector('[data-canvas-container]') as HTMLDivElement
            | null)?.scrollLeft || 0,
        startScrollTop:
          (document.querySelector('[data-canvas-container]') as HTMLDivElement
            | null)?.scrollTop || 0,
      };
      // Prevent text selection and enforce grabbing cursor globally while dragging
      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;
    setPosition({
      x: Math.max(0, dragRef.current.initialX + deltaX),
      y: Math.max(0, dragRef.current.initialY + deltaY),
    });
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    onPositionChange(textBox.id, position.x, position.y);
    // Remove global listeners
    if (globalHandlersRef.current.move) {
      document.removeEventListener("mousemove", globalHandlersRef.current.move);
    }
    if (globalHandlersRef.current.up) {
      document.removeEventListener("mouseup", globalHandlersRef.current.up);
    }
    globalHandlersRef.current = {};
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const handleBlur = () => {
    setIsEditing(false);
    onTextChange(textBox.id, text);
  };

  const handleClickToEdit = () => {
    if (isReadOnly) return;
    setIsEditing(true);
  };

  // Start drag with document-level listeners to allow cursor to leave canvas
  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      e.preventDefault();
      // Auto-scroll canvas container when near edges while dragging
      const container = document.querySelector(
        '[data-canvas-container]'
      ) as HTMLDivElement | null;
      if (container) {
        const rect = container.getBoundingClientRect();
        const edge = 48; // px from edge to trigger scroll
        const speed = 24; // scroll pixels per event
        if (e.clientX > rect.right - edge) container.scrollLeft += speed;
        if (e.clientX < rect.left + edge) container.scrollLeft -= speed;
        if (e.clientY > rect.bottom - edge) container.scrollTop += speed;
        if (e.clientY < rect.top + edge) container.scrollTop -= speed;
        // Include scroll delta so dragged element stays under cursor
        const scrollDeltaX = container.scrollLeft - dragRef.current.startScrollLeft;
        const scrollDeltaY = container.scrollTop - dragRef.current.startScrollTop;
        const deltaX = (e.clientX - dragRef.current.startX) + scrollDeltaX;
        const deltaY = (e.clientY - dragRef.current.startY) + scrollDeltaY;
        setPosition({
          x: Math.max(0, dragRef.current.initialX + deltaX),
          y: Math.max(0, dragRef.current.initialY + deltaY),
        });
        return;
      }
      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;
      setPosition({
        x: Math.max(0, dragRef.current.initialX + deltaX),
        y: Math.max(0, dragRef.current.initialY + deltaY),
      });
    };
    const onUp = () => {
      setIsDragging(false);
      onPositionChange(textBox.id, position.x, position.y);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
    globalHandlersRef.current = { move: onMove, up: onUp };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, onPositionChange, position.x, position.y, textBox.id]);

  return (
    <div
      className="absolute pointer-events-auto group"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? "grabbing" : "default",
      }}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div
        className={`bg-transparent border-2 border-dashed rounded-lg min-w-[200px] ${
          isSelected
            ? "border-blue-500 bg-blue-50/20"
            : "border-transparent group-hover:border-border"
        }`}
      >
        {!isReadOnly && (
          <div
            className="flex items-center justify-between px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity drag-handle cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
          >
            <GripVertical size={12} className="text-muted-foreground" />
            <button
              onClick={() => onRemove(textBox.id)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        )}
        {isEditing && !isReadOnly ? (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onBlur={handleBlur}
            onInput={(e) => {
              const ta = e.currentTarget;
              ta.style.height = "auto";
              ta.style.height = `${ta.scrollHeight}px`;
            }}
            onKeyDown={(e) => {
              // Auto-expand on Enter
              if (e.key === "Enter") {
                const ta = e.currentTarget;
                // Next tick after newline is inserted
                requestAnimationFrame(() => {
                  ta.style.height = "auto";
                  ta.style.height = `${ta.scrollHeight}px`;
                });
              }
            }}
            className="w-full min-h-[60px] p-2 bg-transparent border-none outline-none resize-none text-foreground"
            style={{ fontFamily: "Inter, sans-serif" }}
          />
        ) : (
          <div
            onClick={handleClickToEdit}
            className={`p-2 min-h-[60px] text-foreground whitespace-pre-wrap ${
              isReadOnly ? "cursor-grab" : "cursor-text"
            }`}
          >
            {text || (isReadOnly ? "" : "Click to edit")}
          </div>
        )}
      </div>
    </div>
  );
}

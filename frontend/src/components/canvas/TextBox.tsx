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
}

export default function TextBox({
  textBox,
  onPositionChange,
  onTextChange,
  onRemove,
}: TextBoxProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [position, setPosition] = useState({
    x: parseInt(textBox.x as string) || 100,
    y: parseInt(textBox.y as string) || 100,
  });
  const [text, setText] = useState(textBox.text || "");
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement)?.closest?.(".drag-handle")) {
      setIsDragging(true);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initialX: position.x,
        initialY: position.y,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;
      setPosition({
        x: dragRef.current.initialX + deltaX,
        y: dragRef.current.initialY + deltaY,
      });
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      onPositionChange(textBox.id, position.x, position.y);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const handleBlur = () => {
    setIsEditing(false);
    onTextChange(textBox.id, text);
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  return (
    <div
      className="absolute pointer-events-auto group"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? "grabbing" : "default",
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="bg-transparent border-2 border-dashed border-transparent group-hover:border-border rounded-lg min-w-[200px]">
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
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onBlur={handleBlur}
            className="w-full min-h-[60px] p-2 bg-transparent border-none outline-none resize-none text-foreground"
            style={{ fontFamily: "Inter, sans-serif" }}
          />
        ) : (
          <div
            onDoubleClick={handleDoubleClick}
            className="p-2 min-h-[60px] cursor-text text-foreground whitespace-pre-wrap"
          >
            {text || "Double-click to edit"}
          </div>
        )}
      </div>
    </div>
  );
}

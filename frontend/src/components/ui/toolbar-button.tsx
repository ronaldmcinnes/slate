import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ToolbarButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  tooltip?: string;
  variant?: "default" | "ghost" | "outline";
  size?: "sm" | "default" | "lg" | "icon";
  className?: string;
}

export default function ToolbarButton({
  icon,
  onClick,
  isActive = false,
  disabled = false,
  tooltip,
  variant = "ghost",
  size = "icon",
  className,
}: ToolbarButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-9 w-9 hover:bg-muted transition-colors",
        isActive && "bg-muted text-foreground",
        className
      )}
      title={tooltip}
    >
      {icon}
    </Button>
  );
}

import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu as DropdownMenuPrimitive,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { LucideIcon } from "lucide-react";

interface MenuItem {
  icon?: LucideIcon;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  separator?: boolean;
  variant?: "default" | "destructive";
}

interface DropdownMenuProps {
  items?: MenuItem[];
  align?: "start" | "end" | "center";
  trigger?: React.ReactNode;
  className?: string;
}

export default function DropdownMenu({
  items = [],
  align = "end",
  trigger,
  className = "h-6 w-6 mr-1 opacity-0 group-hover:opacity-100 transition-opacity",
}: DropdownMenuProps) {
  return (
    <DropdownMenuPrimitive>
      <DropdownMenuTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className={className}>
            <MoreVertical size={14} />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        {items.map((item, index) => (
          <div key={index}>
            <DropdownMenuItem
              onClick={item.onClick}
              disabled={item.disabled}
              className={
                item.variant === "destructive"
                  ? "text-destructive focus:text-destructive"
                  : ""
              }
            >
              {item.icon && <item.icon size={14} />}
              {item.label}
            </DropdownMenuItem>
            {item.separator && <DropdownMenuSeparator />}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenuPrimitive>
  );
}

import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu as DropdownMenuPrimitive,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Generic reusable dropdown menu component
 *
 * @param {Object} props
 * @param {Array} props.items - Array of menu items with structure:
 *   {
 *     icon: Component,
 *     label: string,
 *     onClick: function,
 *     disabled?: boolean,
 *     separator?: boolean (adds separator AFTER this item),
 *     variant?: "default" | "destructive"
 *   }
 * @param {string} props.align - Menu alignment ("start" | "end" | "center")
 * @param {React.ReactNode} props.trigger - Custom trigger button (optional)
 * @param {string} props.className - Additional classes for trigger button
 */
export default function DropdownMenu({
  items = [],
  align = "end",
  trigger,
  className = "h-6 w-6 mr-1 opacity-0 group-hover:opacity-100 transition-opacity",
}) {
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

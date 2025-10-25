# Components Directory Structure

This directory contains all React components organized by their purpose and responsibility.

## Directory Organization

### 📁 `canvas/`

Canvas-related components for drawing and content creation

- `Canvas.jsx` - Main canvas container with drawing area
- `DraggableGraph.jsx` - Interactive draggable Plotly graphs
- `TextBox.jsx` - Draggable text boxes
- `ToolbarDrawingTools.jsx` - Drawing tools (pens, highlighters, eraser)
- `ToolbarActions.jsx` - Action buttons (text, graph, record, generate)

### 📁 `dialogs/`

Modal dialogs for user interactions

- `CreateNotebookDialog.jsx` - Create new notebook modal
- `CreatePageDialog.jsx` - Create new page modal
- `RenamePageDialog.jsx` - Rename page modal
- `DeleteConfirmDialog.jsx` - Reusable delete confirmation modal
- `GraphDialog.jsx` - Add interactive graph modal

### 📁 `layout/`

Layout and structural components

- `Sidebar.jsx` - Left sidebar with notebooks list
- `PagesList.jsx` - Middle panel with pages list
- `ResizablePanel.jsx` - Reusable resizable panel wrapper

### 📁 `menus/`

Reusable menu components

- `DropdownMenu.jsx` - Generic reusable dropdown menu
  - Pass `items` array with icon, label, onClick, disabled, separator, variant
  - Supports custom trigger button
  - Auto-renders 3-dot menu by default

### 📁 `ui/`

shadcn/ui components (do not modify directly)

- `button.jsx`
- `dialog.jsx`
- `dropdown-menu.jsx`
- `input.jsx`

## Usage Examples

### Reusable DropdownMenu

```jsx
import DropdownMenu from "@/components/menus/DropdownMenu";
import { Edit3, Trash2 } from "lucide-react";

const menuItems = [
  {
    icon: Edit3,
    label: "Edit",
    onClick: () => handleEdit(),
  },
  {
    icon: Trash2,
    label: "Delete",
    onClick: () => handleDelete(),
    variant: "destructive",
    separator: true,
  },
];

<DropdownMenu items={menuItems} align="end" />;
```

## Principles

1. **Single Responsibility** - Each component does one thing well
2. **Reusability** - Components are designed to be reused
3. **Clean Imports** - Use `@/` alias for absolute imports
4. **No Prop Drilling** - Clear interfaces between components
5. **Organized by Feature** - Related components are grouped together

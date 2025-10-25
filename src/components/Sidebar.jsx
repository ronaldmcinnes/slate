import { Plus, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Sidebar({ notebooks, selectedNotebook, onSelectNotebook }) {
  return (
    <div className="w-64 bg-card border-r border-border flex flex-col h-screen grain">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h1 className="text-3xl font-serif font-bold text-primary tracking-tight">
          Slate
        </h1>
        <p className="text-xs text-muted-foreground mt-1.5 tracking-wide uppercase">
          Teaching Canvas
        </p>
      </div>

      {/* Notebooks List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Notebooks
          </h2>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-primary">
            <Plus size={16} />
          </Button>
        </div>

        <div className="space-y-2">
          {notebooks.map((notebook) => (
            <button
              key={notebook.id}
              onClick={() => onSelectNotebook(notebook)}
              className={cn(
                "w-full text-left px-4 py-3.5 rounded-lg transition-all duration-200 border-2 group",
                selectedNotebook?.id === notebook.id
                  ? 'bg-accent/50 text-accent-foreground border-primary/50 shadow-lg'
                  : 'bg-secondary/50 text-secondary-foreground border-transparent hover:border-border hover:bg-secondary'
              )}
            >
              <div className="flex items-start gap-3">
                <BookOpen 
                  size={18} 
                  className={cn(
                    "mt-0.5 flex-shrink-0",
                    selectedNotebook?.id === notebook.id ? "text-primary" : "text-muted-foreground"
                  )} 
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{notebook.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {notebook.pages.length} {notebook.pages.length === 1 ? 'page' : 'pages'}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-primary font-bold text-lg ring-2 ring-primary/20">
            E
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">Educator</div>
            <div className="text-xs text-muted-foreground">Professor</div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Plus, FileText, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function PagesList({ pages, selectedPage, onSelectPage }) {
  return (
    <div className="w-64 bg-card/50 border-r border-border flex flex-col h-screen backdrop-blur-sm">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground tracking-wide">Pages</h2>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-primary">
            <Plus size={16} />
          </Button>
        </div>
      </div>

      {/* Pages List */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-2">
          {pages.map((page) => (
            <button
              key={page.id}
              onClick={() => onSelectPage(page)}
              className={cn(
                "w-full text-left px-3 py-3.5 rounded-md transition-all duration-200 border group",
                selectedPage?.id === page.id
                  ? 'bg-accent border-primary/40 text-accent-foreground shadow-md'
                  : 'bg-card/50 border-transparent hover:border-border hover:bg-secondary/50'
              )}
            >
              <div className="flex items-start gap-2.5">
                <FileText 
                  size={16} 
                  className={cn(
                    "mt-0.5 flex-shrink-0",
                    selectedPage?.id === page.id ? "text-primary" : "text-muted-foreground"
                  )} 
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate leading-snug">{page.title}</div>
                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                    <Calendar size={11} />
                    <span>{new Date(page.lastModified).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

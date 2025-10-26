interface NoPageSelectedProps {
  className?: string;
}

export default function NoPageSelected({
  className = "",
}: NoPageSelectedProps) {
  return (
    <div
      className={`flex-1 flex items-center justify-center bg-muted/30 ${className}`}
    >
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">📓</div>
        <h3 className="text-xl font-medium text-foreground mb-2">
          No page selected
        </h3>
        <p className="text-sm text-muted-foreground">
          Select a page from your notebook to start drawing
        </p>
      </div>
    </div>
  );
}

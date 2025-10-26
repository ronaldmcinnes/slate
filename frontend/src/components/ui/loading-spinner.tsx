import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
  showText?: boolean;
}

const sizeClasses = {
  sm: "w-6 h-6 border-2",
  md: "w-12 h-12 border-4",
  lg: "w-16 h-16 border-4",
};

export function LoadingSpinner({
  size = "md",
  className,
  text = "Loading...",
  showText = true,
}: LoadingSpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div
        className={cn(
          "border-primary border-t-transparent rounded-full animate-spin",
          sizeClasses[size]
        )}
      />
      {showText && <p className="text-muted-foreground text-sm mt-3">{text}</p>}
    </div>
  );
}

// Full screen loading spinner for page-level loading
export function FullScreenLoadingSpinner({
  text = "Loading...",
}: {
  text?: string;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}

// Inline loading spinner for smaller contexts
export function InlineLoadingSpinner({ text }: { text?: string }) {
  return <LoadingSpinner size="sm" text={text} showText={!!text} />;
}

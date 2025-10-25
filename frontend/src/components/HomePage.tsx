import { Button } from "@/components/ui/button";
import { Notebook } from "lucide-react";

interface HomePageProps {
  onNavigateToApp: () => void;
}

export default function HomePage({ onNavigateToApp }: HomePageProps) {
  const handleGetStarted = () => {
    onNavigateToApp();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Button 
        onClick={handleGetStarted}
        size="lg"
        className="px-8 py-3 text-lg font-medium"
      >
        <Notebook className="w-5 h-5 mr-2" />
        Open Slate
      </Button>
    </div>
  );
}

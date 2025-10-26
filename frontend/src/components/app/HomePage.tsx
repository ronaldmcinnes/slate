import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/authContext";
import { FullScreenLoadingSpinner } from "@/components/ui/loading-spinner";

import Header from "@/components/landing/Header";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import HeroSection from "@/components/landing/HeroSection";

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullScreenLoadingSpinner />;
  }

  return (
    <div className="relative w-full overflow-hidden">
      <Header />
      <HeroSection />
      <FeaturesSection />
    </div>
  );
}

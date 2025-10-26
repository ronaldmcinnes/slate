import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/authContext";

import Header from "@/components/landing/Header";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import HeroSection from "@/components/landing/HeroSection";

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-pulse text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden">
      <Header />
      <HeroSection />
      <FeaturesSection />
    </div>
  );
}

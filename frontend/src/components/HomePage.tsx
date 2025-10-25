import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/authContext";
import HeroTopo from "@/components/hero/HeroTopo";

export default function HomePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-pulse text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* HeroTopo Background */}
      <div className="absolute inset-0 z-0">
        <HeroTopo />
      </div>

      {/* Navigation Overlay */}
      <nav className="absolute top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-white drop-shadow-lg">
                Slate
              </div>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-white/80 text-sm">
                    {user.displayName}
                  </span>
                  <Button
                    onClick={() => navigate("/app")}
                    className="bg-white/90 hover:bg-white text-black font-semibold"
                  >
                    Go to App →
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/login")}
                    className="text-white hover:bg-white/20"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => navigate("/login")}
                    className="bg-white/90 hover:bg-white text-black font-semibold"
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Content Overlay */}
      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
        <div className="text-center px-4 max-w-4xl">
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 leading-tight drop-shadow-2xl">
            Your Intelligent
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Notebook Workspace
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto drop-shadow-lg">
            Create, collaborate, and organize your notes with powerful tools.
            Draw, graph, and write - all in one beautiful workspace.
          </p>
          <div className="flex items-center justify-center gap-4 pointer-events-auto">
            {user ? (
              <Button
                size="lg"
                onClick={() => navigate("/app")}
                className="bg-white/90 hover:bg-white text-black px-8 h-14 text-lg font-semibold shadow-2xl"
              >
                Open Your Workspace →
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={() => navigate("/login")}
                className="bg-white/90 hover:bg-white text-black px-8 h-14 text-lg font-semibold shadow-2xl"
              >
                Start for Free →
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

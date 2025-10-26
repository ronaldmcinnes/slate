import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/authContext";
import slateLogo from "@/assets/slateLogo.svg";

export default function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <img src={slateLogo} alt="Slate Logo" className="w-16 h-16" />
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-foreground/80 text-sm">
                  {user.displayName}
                </span>
                <Button
                  onClick={() => navigate("/app")}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  Go to App →
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/login")}
                  className="text-foreground hover:bg-accent text-white"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => navigate("/login")}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

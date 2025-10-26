import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/authContext";
import slateLogo from "@/assets/slateLogo.svg";

export default function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="absolute top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img src={slateLogo} alt="Slate Logo" className="w-16 h-16" />
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-white/80 text-sm">{user.displayName}</span>
                <Button
                  onClick={() => navigate("/app")}
                  className="bg-[#4b73b3] hover:bg-white text-black font-semibold"
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
                  className="bg-[#4b73b3] hover:bg-white text-white font-semibold"
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

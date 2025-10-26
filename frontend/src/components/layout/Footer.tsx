import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Github, Twitter, Linkedin, Mail } from "lucide-react";
import slateLogo from "@/assets/slateLogo.svg";
import slateHandwrittenLogo from "@/assets/slatehandwritten.svg";

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Product */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => navigate("/app")}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Notebooks
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate("/app")}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Drawing Tools
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate("/app")}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Graphs
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate("/app")}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Collaboration
                </button>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <button className="text-gray-300 hover:text-white transition-colors">
                  Documentation
                </button>
              </li>
              <li>
                <button className="text-gray-300 hover:text-white transition-colors">
                  Tutorials
                </button>
              </li>
              <li>
                <button className="text-gray-300 hover:text-white transition-colors">
                  API Reference
                </button>
              </li>
              <li>
                <button className="text-gray-300 hover:text-white transition-colors">
                  Help Center
                </button>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <button className="text-gray-300 hover:text-white transition-colors">
                  About Us
                </button>
              </li>
              <li>
                <button className="text-gray-300 hover:text-white transition-colors">
                  Blog
                </button>
              </li>
              <li>
                <button className="text-gray-300 hover:text-white transition-colors">
                  Careers
                </button>
              </li>
              <li>
                <button className="text-gray-300 hover:text-white transition-colors">
                  Contact
                </button>
              </li>
            </ul>
          </div>

          {/* Get Started */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Get Started</h3>
            <p className="text-gray-300 mb-4">
              Start creating beautiful notebooks and collaborate with your team
              today.
            </p>
            <Button
              onClick={() => navigate("/login")}
              className="bg-white text-black hover:bg-gray-100 font-semibold"
            >
              Sign Up Free
            </Button>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-gray-800 mb-8"></div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Logo and Copyright */}
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <img src={slateLogo} alt="Slate Logo" className="w-6 h-6" />
            <img
              src={slateHandwrittenLogo}
              alt="Slate Handwritten"
              className="h-8"
            />
            <span className="text-gray-400 text-sm ml-2">
              © 2024 Slate. All rights reserved.
            </span>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-white transition-colors">
              <Github className="w-5 h-5" />
            </button>
            <button className="text-gray-400 hover:text-white transition-colors">
              <Twitter className="w-5 h-5" />
            </button>
            <button className="text-gray-400 hover:text-white transition-colors">
              <Linkedin className="w-5 h-5" />
            </button>
            <button className="text-gray-400 hover:text-white transition-colors">
              <Mail className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Handle OAuth callback and extract token
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Extract token from URL
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");

        if (token) {
          // Save token
          api.setToken(token);

          // Redirect to app
          navigate("/app");
        } else {
          // No token, redirect to login
          navigate("/login?error=no_token");
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        navigate("/login?error=callback_failed");
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <div>
        <h2>Authenticating...</h2>
        <p>Please wait while we log you in.</p>
      </div>
    </div>
  );
};

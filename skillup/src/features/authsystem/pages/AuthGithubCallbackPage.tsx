import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../AuthContext";
import { API_BASE } from "../config";

export default function AuthGithubCallbackPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (!code) {
      navigate("/auth", { replace: true });
      return;
    }

    fetch(`${API_BASE}/auth/github`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "GitHub authentication failed");

        login(data.token, data.user);
        navigate(data.profileCompleted ? "/dashboard" : "/auth/onboard", { replace: true });
      })
      .catch((error) => {
        toast({
          title: "GitHub login failed",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
        navigate("/auth", { replace: true });
      });
  }, [login, navigate, toast]);

  return <div className="min-h-screen grid place-items-center">Signing you in...</div>;
}

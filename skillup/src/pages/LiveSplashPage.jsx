import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SplashScreen from "../components/SplashScreen";

export default function LiveSplashPage() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const next = params.get("next") || "/live-session";
    const timer = window.setTimeout(() => {
      navigate(next, { replace: true });
    }, 2500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [location.search, navigate]);

  const params = new URLSearchParams(location.search);
  return <SplashScreen appName="SkillBridge" message={params.get("message") || "Connecting"} />;
}
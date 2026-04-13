import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SplashScreen from "../components/SplashScreen";

export default function LiveSplashPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      navigate("/live-session", { replace: true });
    }, 2500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [navigate]);

  return <SplashScreen appName="SkillBridge" message="Connecting" />;
}
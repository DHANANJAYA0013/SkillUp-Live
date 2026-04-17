import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();
  const [clickCount, setClickCount] = useState(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSkillBridgeClick = () => {
    // Clear previous timeout if it exists
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    const newClickCount = clickCount + 1;
    setClickCount(newClickCount);

    if (newClickCount === 10) {
      // Reset count and navigate to admin login
      setClickCount(0);
      navigate("/admin-login", { replace: true });
      return;
    }

    // Reset count after 3 seconds of inactivity
    clickTimeoutRef.current = setTimeout(() => {
      setClickCount(0);
    }, 3000);
  };

  return (
    <footer>
      <div className="border-t border-border/50 px-4 py-4 sm:py-6 text-center text-[11px] sm:text-sm text-muted-foreground">
        © 2026{" "}
        <span
          onClick={handleSkillBridgeClick}
          className="cursor-pointer hover:text-foreground transition-colors font-medium"
          title={clickCount > 0 ? `${10 - clickCount} more clicks to admin access` : ""}
        >
          SkillBridge
        </span>
        . Crafted for focused live learning experiences.
      </div>
    </footer>
  );
};

export default Footer;
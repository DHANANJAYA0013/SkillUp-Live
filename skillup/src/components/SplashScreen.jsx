import { motion } from "framer-motion";
import { Video, Wifi } from "lucide-react";
import "../SplashScreen.css";

export default function SplashScreen({ appName = "SkillBridge", message = "Connecting" }) {
  return (
    <div className="splash-screen" role="status" aria-live="polite">
      <div className="splash-bg-glow splash-bg-glow-1" />
      <div className="splash-bg-glow splash-bg-glow-2" />

      <div className="splash-content">
        <motion.div
          className="splash-icon-shell"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <motion.div
            className="splash-icon"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 1.4, ease: "easeInOut", repeat: Infinity }}
          >
            <Video size={34} />
          </motion.div>

          <div className="signal-rings" aria-hidden="true">
            <span className="signal-ring ring-1" />
            <span className="signal-ring ring-2" />
            <span className="signal-ring ring-3" />
          </div>
        </motion.div>

        <motion.h1
          className="splash-app-name"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          {appName}
        </motion.h1>

        <motion.div
          className="splash-connecting"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.4 }}
        >
          <Wifi size={16} />
          <span>{message}</span>
          <span className="loading-dots" aria-hidden="true">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </motion.div>
      </div>
    </div>
  );
}
import { io } from "socket.io-client";
import { API_BASE } from "@/features/authsystem/config";

const resolveSignalServerUrl = () => {
  const explicitSignalServer = import.meta.env.VITE_SIGNAL_SERVER_URL;
  if (explicitSignalServer) return explicitSignalServer;

  if (typeof API_BASE === "string" && API_BASE.startsWith("http")) {
    return API_BASE.replace(/\/api\/?$/, "");
  }

  return "http://localhost:4000";
};

export const appSocket = io(resolveSignalServerUrl(), {
  transports: ["websocket", "polling"],
  autoConnect: true,
});

import { useParams } from "react-router-dom";
import VideoChatApp from "../features/videochat/VideoChatApp";

export default function LiveSessionPage() {
  const { roomId } = useParams();
  return <VideoChatApp presetRoomId={roomId} />;
}

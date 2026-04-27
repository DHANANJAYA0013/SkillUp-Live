import React, { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useLocation, useNavigate } from "react-router-dom";
import * as faceapi from "face-api.js";
import { API_BASE } from "@/features/authsystem/config";
import { useAuth } from "@/features/authsystem/AuthContext";
import { usePeerConnections } from "./usePeerConnections";
import VideoTile from "./VideoTile";
import ChatPanel from "./ChatPanel";
import "./videochat.css";

const resolveSignalServerUrl = () => {
  const explicitSignalServer = import.meta.env.VITE_SIGNAL_SERVER_URL;
  if (explicitSignalServer) return explicitSignalServer;

  if (typeof API_BASE === "string" && API_BASE.startsWith("http")) {
    return API_BASE.replace(/\/api\/?$/, "");
  }

  return "http://localhost:4000";
};

const SIGNAL_SERVER = resolveSignalServerUrl();
// Files in public/models are served from BASE_URL + models.
const FACE_MODEL_URL = `${import.meta.env.BASE_URL}models`;

function Lobby({ onJoin, onBack }) {
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [err, setErr] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) return setErr("Enter your name");
    if (!room.trim()) return setErr("Enter a room ID");
    setErr("");
    onJoin(name.trim(), room.trim());
  };

  const randomRoom = () => setRoom(Math.random().toString(36).slice(2, 8).toUpperCase());

  return (
    <div className="lobby">
      <div className="lobby-bg">
        <div className="bg-orb orb1" />
        <div className="bg-orb orb2" />
        <div className="bg-orb orb3" />
        <div className="grid-lines" />
      </div>


      <div className="lobby-card">
        <button className="back-nav-btn" onClick={onBack} type="button" aria-label="Go back">
          <BackIcon />
          <span>Back</span>
        </button>

        <div className="lobby-logo">
          <div className="logo-mark">
            <span />
            <span />
            <span />
          </div>
          <h1>SkillBridge Live</h1>
        </div>
        <p className="lobby-tagline">Live video sessions, no friction.</p>

        <div className="field-group">
          <label>YOUR NAME</label>
          <input
            className="field"
            placeholder="e.g. Alex Chen"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            autoFocus
          />
        </div>

        <div className="field-group">
          <label>ROOM ID</label>
          <div className="field-row">
            <input
              className="field"
              placeholder="e.g. ALPHA7"
              value={room}
              onChange={(e) => setRoom(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <button className="btn-ghost" onClick={randomRoom} title="Generate random room">
              <DiceIcon />
            </button>
          </div>
        </div>

        {err && <p className="lobby-err">{err}</p>}

        <button className="btn-primary" onClick={handleSubmit}>
          <span>Join Session</span>
          <ArrowIcon />
        </button>

        <p className="lobby-hint">New room ID = new room. Share the ID with others to join.</p>
      </div>
    </div>
  );
}

function Room({ userName, roomId, onLeave, onBack }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const videoRef = useRef(null);
  const faceModelsLoadedRef = useRef(false);

  const [localStream, setLocalStream] = useState(null);
  const [peers, setPeers] = useState({});
  const [messages, setMessages] = useState([]);
  const [mySocketId, setMySocketId] = useState("");
  const [videoOn, setVideoOn] = useState(true);
  const [audioOn, setAudioOn] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [layout, setLayout] = useState("grid");
  const [spotlightId, setSpotlightId] = useState(null);
  const [faceModelReady, setFaceModelReady] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [attendanceAttemptToken, setAttendanceAttemptToken] = useState(0);
  const attendanceRequestInFlightRef = useRef(false);

  const addPeer = useCallback((id, info) => {
    setPeers((prev) => ({
      ...prev,
      [id]: { name: info.name, stream: null, videoOn: true, audioOn: true, ...prev[id] },
    }));
  }, []);

  const removePeer = useCallback((id) => {
    setPeers((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const setPeerStream = useCallback((id, stream) => {
    setPeers((prev) => ({
      ...prev,
      [id]: { ...prev[id], stream },
    }));
  }, []);

  const setPeerMedia = useCallback((id, { video, audio }) => {
    setPeers((prev) => ({
      ...prev,
      [id]: { ...prev[id], videoOn: video, audioOn: audio },
    }));
  }, []);

  const { makeOffer, handleOffer, handleAnswer, handleIceCandidate, replaceTrack, closeAll, closePC } =
    usePeerConnections({
      socketRef,
      localStreamRef,
      onRemoteStream: setPeerStream,
      onPeerLeft: removePeer,
    });

  // Preparation hook: preload face detection model for future integration.
  useEffect(() => {
    console.log("[face-api] Room mounted. Preparing TinyFaceDetector model load.");
    let cancelled = false;
    let retryTimer;

    const loadFaceDetectionModels = async () => {
      if (cancelled) return;

      if (faceModelsLoadedRef.current) {
        setFaceModelReady(true);
        console.log("[face-api] TinyFaceDetector already loaded. Skipping.");
        return;
      }

      console.log(`[face-api] Loading TinyFaceDetector from ${FACE_MODEL_URL} (public/models)...`);

      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(FACE_MODEL_URL);
        if (!cancelled) {
          faceModelsLoadedRef.current = true;
          setFaceModelReady(true);
          console.log("[face-api] TinyFaceDetector model loaded successfully.");
        }
      } catch (error) {
        if (!cancelled) {
          console.warn("[face-api] TinyFaceDetector model load failed. Retrying in 3s:", error);
          retryTimer = window.setTimeout(() => {
            void loadFaceDetectionModels();
          }, 3000);
        }
      }
    };

    void loadFaceDetectionModels();

    return () => {
      cancelled = true;
      if (retryTimer) {
        window.clearTimeout(retryTimer);
      }
      console.log("[face-api] Room unmounted. Face model loader cleanup done.");
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          setVideoOn(false);
        } catch {
          stream = new MediaStream();
          setVideoOn(false);
          setAudioOn(false);
        }
      }

      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      localStreamRef.current = stream;
      setLocalStream(stream);

      const socket = io(SIGNAL_SERVER, { transports: ["websocket"] });
      socketRef.current = socket;

      socket.on("connect", () => {
        setMySocketId(socket.id);
        console.log("[socket] Connected to signal server with socketId:", socket.id);
        socket.emit("join-room", { roomId, userName });
        console.log("[socket] Emitted join-room event:", { roomId, userName });

        const currentUserId = user?._id ?? null;
        const basePayload = {
          sessionId: roomId,
          sessionIdentifier: roomId,
          roomId,
          userId: currentUserId,
          name: userName,
        };

        console.log("[attendance] Creating attendance document for session:", {
          roomId,
          userName,
          userId: currentUserId ? `${currentUserId}` : "(no userId)",
        });

        void fetch(`${API_BASE}/attendance/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(basePayload),
        })
          .then((res) => {
            console.log("[attendance] Create attendance response:", res.status);
            return res.json();
          })
          .then((data) => {
            console.log("[attendance] Created attendance document:", {
              attendanceId: data?._id,
              roomId: data?.roomId,
              date: data?.date,
            });
          })
          .catch((error) => {
            console.warn("[attendance] Failed to create attendance document:", error);
          });

        console.log("[attendance] Registering user in waiting list:", {
          roomId,
          userName,
          userId: currentUserId ? `${currentUserId}` : "(no userId)",
        });

        void fetch(`${API_BASE}/attendance/join`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(basePayload),
        })
          .then((res) => {
            console.log("[attendance] Join attendance response:", res.status);
            return res.json();
          })
          .then((data) => {
            console.log("[attendance] User registered in waiting list:", {
              roomId: data?.roomId,
              waitingCount: data?.attendance?.waitingUsers?.length || 0,
            });
          })
          .catch((error) => {
            console.warn("[attendance] Failed to register joined user:", error);
          });
      });

      socket.on("room-users", (users) => {
        users.forEach((u) => {
          addPeer(u.socketId, u);
          makeOffer(u.socketId);
        });
      });

      socket.on("user-joined", (u) => {
        addPeer(u.socketId, u);
      });

      socket.on("offer", (data) => {
        addPeer(data.fromId, { name: data.fromName });
        handleOffer(data);
      });

      socket.on("answer", handleAnswer);
      socket.on("ice-candidate", handleIceCandidate);

      socket.on("user-left", ({ socketId }) => {
        closePC(socketId);
        removePeer(socketId);
      });

      socket.on("chat-message", (msg) => {
        setMessages((prev) => [...prev, msg]);
        setChatOpen((open) => {
          if (!open) setUnread((n) => n + 1);
          return open;
        });
      });

      socket.on("peer-media-state", ({ peerId, video, audio }) => {
        setPeerMedia(peerId, { video, audio });
      });
    }

    init();

    return () => {
      cancelled = true;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      closeAll();
      socketRef.current?.disconnect();
    };
  }, [addPeer, closeAll, closePC, handleAnswer, handleIceCandidate, handleOffer, makeOffer, removePeer, roomId, setPeerMedia, user?._id, userName]);

  useEffect(() => {
    if (!videoOn) {
      console.log("[face-api] Video is off, stopping detection.");
      setFaceDetected(false);
      return;
    }

    let cancelled = false;
    let detectionCount = 0;
    let successCount = 0;

    const detectFaces = async () => {
      const videoElement = videoRef.current;

      // More lenient checks - don't require localVideoReady to be true
      if (!videoElement || !localStreamRef.current || !faceModelsLoadedRef.current) {
        return;
      }

      // Check if video has data to process (less strict than readyState >= 2)
      if (videoElement.readyState < 1) {
        // HAVE_NOTHING - no video data yet
        return;
      }

      try {
        detectionCount++;
        
        // Use detectSingleFace() instead of detectAllFaces() for better performance
        const detection = await faceapi.detectSingleFace(
          videoElement,
          new faceapi.TinyFaceDetectorOptions({ 
            inputSize: 416,
            scoreThreshold: 0.5 
          })
        );

        if (!cancelled) {
          if (detection) {
            successCount++;
            console.log(
              `[face-api] Face detected (#${successCount}/${detectionCount}):`,
              {
                x: Math.round(detection.box.x),
                y: Math.round(detection.box.y),
                width: Math.round(detection.box.width),
                height: Math.round(detection.box.height),
                score: (detection.score * 100).toFixed(1) + "%",
              }
            );
            setFaceDetected(true);
          } else {
            console.log(`[face-api] No face detected (${detectionCount} attempts)`);
            setFaceDetected(false);
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.warn("[face-api] Detection error:", error.message);
          setFaceDetected(false);
        }
      }
    };

    // Start detection immediately and then on interval
    void detectFaces();
    const detectionInterval = window.setInterval(() => {
      void detectFaces();
    }, 1500); // 1.5s interval for balanced performance

    return () => {
      cancelled = true;
      window.clearInterval(detectionInterval);
      console.log(`[face-api] Detection stopped. Total attempts: ${detectionCount}, Successful: ${successCount}`);
    };
  }, [videoOn, localStream]);

  const handleLocalVideoReady = useCallback(() => {
    const videoEl = videoRef.current;
    if (videoEl) {
      console.log("[video] Local video ready:", {
        readyState: videoEl.readyState,
        videoWidth: videoEl.videoWidth,
        videoHeight: videoEl.videoHeight,
        duration: videoEl.duration,
      });
    }
  }, []);

  useEffect(() => {
    if (faceDetected && !attendanceMarked) {
      console.log("[face-api] Face detected! Triggering attendance marking...");
      setAttendanceAttemptToken((prev) => prev + 1);
    }
  }, [faceDetected, attendanceMarked]);

  useEffect(() => {
    if (!(faceDetected === true && attendanceMarked === false && attendanceAttemptToken > 0)) {
      return;
    }

    if (attendanceRequestInFlightRef.current) {
      console.log("[attendance] Request already in flight, skipping.");
      return;
    }

    const userId = user?._id ?? null;
    if (!roomId || !userName) {
      console.warn("[attendance] Missing roomId or userName, cannot mark attendance.");
      return;
    }

    attendanceRequestInFlightRef.current = true;

    let cancelled = false;
    let retryTimer;

    const markAttendance = async () => {
      const payload = {
        sessionId: roomId,
        sessionIdentifier: roomId,
        userId,
        name: userName,
      };

      console.log("[attendance] Sending mark attendance request:", {
        endpoint: `${API_BASE}/attendance/mark`,
        userName,
        userId: userId ? `${userId}` : "(no userId)",
        roomId,
        timestamp: new Date().toISOString(),
      });

      try {
        const res = await fetch(`${API_BASE}/attendance/mark`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => null);
        const alreadyMarked = data && typeof data === "object" && "message" in data && data.message === "Already marked";

        if (!cancelled && (res.ok || alreadyMarked)) {
          setAttendanceMarked(true);
          console.log("[attendance] Successfully marked attendance for user:", {
            userName,
            userId: userId ? `${userId}` : "(no userId)",
            response: data,
            timestamp: new Date().toISOString(),
          });
          return;
        }

        if (!cancelled) {
          console.warn("[attendance] Mark request returned non-success response:", {
            status: res.status,
            statusText: res.statusText,
            userName,
            data,
          });
          // Retry after 5 seconds
          retryTimer = window.setTimeout(() => {
            console.log("[attendance] Retrying attendance mark...");
            setAttendanceAttemptToken((prev) => prev + 1);
          }, 5000);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("[attendance] Failed to mark attendance:", {
            userName,
            error: error.message,
            timestamp: new Date().toISOString(),
          });
          // Retry after 5 seconds
          retryTimer = window.setTimeout(() => {
            console.log("[attendance] Retrying attendance mark after error...");
            setAttendanceAttemptToken((prev) => prev + 1);
          }, 5000);
        }
      } finally {
        if (!cancelled) {
          attendanceRequestInFlightRef.current = false;
        }
      }
    };

    void markAttendance();

    return () => {
      cancelled = true;
      attendanceRequestInFlightRef.current = false;
      if (retryTimer) {
        window.clearTimeout(retryTimer);
      }
    };
  }, [attendanceAttemptToken, attendanceMarked, faceDetected, roomId, user?._id, userName]);

  const toggleVideo = useCallback(async () => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const newState = !videoOn;
    setVideoOn(newState);

    if (newState) {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newTrack = newStream.getVideoTracks()[0];
        stream.getVideoTracks().forEach((t) => {
          t.stop();
          stream.removeTrack(t);
        });
        stream.addTrack(newTrack);
        replaceTrack("video", newTrack);
        setLocalStream(new MediaStream(stream.getTracks()));
      } catch {
        // Ignore camera re-enable errors and keep previous state.
      }
    } else {
      stream.getVideoTracks().forEach((t) => {
        t.enabled = false;
      });
    }

    socketRef.current?.emit("media-state", { video: newState, audio: audioOn });
  }, [videoOn, audioOn, replaceTrack]);

  const toggleAudio = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const newState = !audioOn;
    setAudioOn(newState);
    stream.getAudioTracks().forEach((t) => {
      t.enabled = newState;
    });
    socketRef.current?.emit("media-state", { video: videoOn, audio: newState });
  }, [audioOn, videoOn]);

  const sendChat = useCallback((msg) => {
    socketRef.current?.emit("chat-message", { message: msg });
  }, []);

  const openChat = () => {
    setChatOpen(true);
    setUnread(0);
  };

  const allParticipants = [
    { id: "local", name: userName, stream: localStream, isLocal: true, videoOn, audioOn },
    ...Object.entries(peers).map(([id, p]) => ({
      id,
      name: p.name,
      stream: p.stream,
      isLocal: false,
      videoOn: p.videoOn !== false,
      audioOn: p.audioOn !== false,
    })),
  ];

  const spotlightUser = spotlightId ? allParticipants.find((p) => p.id === spotlightId) : null;
  const sidebarUsers = spotlightId ? allParticipants.filter((p) => p.id !== spotlightId) : [];

  return (
    <div className="room" data-face-detected={faceDetected ? "true" : "false"}>
      <header className="room-header">
        <div className="header-left">
          <button className="back-nav-btn back-nav-btn-inline" onClick={onBack} type="button" aria-label="Go back">
            <BackIcon />
            <span>Back</span>
          </button>
          <div className="header-logo">SkillBridge</div>
        </div>
        <div className="header-center">
          <span className="mobile-brand">SkillBridge</span>
          <span className="participant-count">
            <UsersIcon />
            {allParticipants.length} participant{allParticipants.length !== 1 ? "s" : ""}
          </span>
          <div className="face-status" style={{ fontSize: 12, marginTop: 6, opacity: 0.95 }}>
            {!faceModelReady
              ? "Loading face model..."
              : attendanceMarked
              ? "Face Detected - Attendance Marked"
              : faceDetected
                ? "Face detected - Marking attendance..."
                : "Detecting Face..."}
          </div>
        </div>
        <div className="header-right">
          <button
            className={`layout-btn ${layout === "grid" ? "active" : ""}`}
            onClick={() => {
              setLayout("grid");
              setSpotlightId(null);
            }}
            title="Grid view"
          >
            <GridIcon />
          </button>
          <button
            className={`layout-btn ${layout === "spotlight" ? "active" : ""}`}
            onClick={() => {
              setLayout("spotlight");
              if (!spotlightId) setSpotlightId("local");
            }}
            title="Spotlight view"
          >
            <SpotlightIcon />
          </button>
        </div>
      </header>

      <div className={`room-body ${chatOpen ? "chat-visible" : ""}`}>
        <div className="video-area">
          {layout === "grid" ? (
            <div className={`video-grid count-${Math.min(allParticipants.length, 12)}`}>
              {allParticipants.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setLayout("spotlight");
                    setSpotlightId(p.id);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <VideoTile
                    stream={p.stream}
                    name={p.name}
                    muted={p.isLocal}
                    isLocal={p.isLocal}
                    videoOn={p.videoOn}
                    audioOn={p.audioOn}
                    externalVideoRef={p.isLocal ? videoRef : undefined}
                    onVideoReady={p.isLocal ? handleLocalVideoReady : undefined}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="spotlight-layout">
              <div className="spotlight-main">
                {spotlightUser && (
                  <VideoTile
                    stream={spotlightUser.stream}
                    name={spotlightUser.name}
                    muted={spotlightUser.isLocal}
                    isLocal={spotlightUser.isLocal}
                    videoOn={spotlightUser.videoOn}
                    audioOn={spotlightUser.audioOn}
                    externalVideoRef={spotlightUser.isLocal ? videoRef : undefined}
                    onVideoReady={spotlightUser.isLocal ? handleLocalVideoReady : undefined}
                  />
                )}
              </div>
              <div className="spotlight-strip">
                {sidebarUsers.map((p) => (
                  <div key={p.id} onClick={() => setSpotlightId(p.id)} style={{ cursor: "pointer" }}>
                    <VideoTile
                      stream={p.stream}
                      name={p.name}
                      muted={p.isLocal}
                      isLocal={p.isLocal}
                      videoOn={p.videoOn}
                      audioOn={p.audioOn}
                      externalVideoRef={p.isLocal ? videoRef : undefined}
                      onVideoReady={p.isLocal ? handleLocalVideoReady : undefined}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {chatOpen && (
          <div className="chat-sidebar">
            <button className="chat-close" onClick={() => setChatOpen(false)}>
              x
            </button>
            <ChatPanel messages={messages} onSend={sendChat} mySocketId={mySocketId} />
          </div>
        )}
      </div>

      <div className="controls">
        <button className={`ctrl-btn ${audioOn ? "" : "off"}`} onClick={toggleAudio} title={audioOn ? "Mute" : "Unmute"}>
          {audioOn ? <MicIcon /> : <MicOffIcon />}
          <span>{audioOn ? "Mute" : "Unmute"}</span>
        </button>

        <button
          className={`ctrl-btn ${videoOn ? "" : "off"}`}
          onClick={toggleVideo}
          title={videoOn ? "Stop Camera" : "Start Camera"}
        >
          {videoOn ? <CamIcon /> : <CamOffIcon />}
          <span>{videoOn ? "Camera" : "No Cam"}</span>
        </button>

        <button className={`ctrl-btn chat-ctrl ${unread > 0 ? "has-unread" : ""}`} onClick={openChat} title="Chat">
          <ChatIcon />
          <span>Chat</span>
          {unread > 0 && <span className="unread-badge">{unread}</span>}
        </button>

        <button className="ctrl-btn leave" onClick={onLeave} title="Leave room">
          <PhoneIcon />
          <span>Leave</span>
        </button>
      </div>
    </div>
  );
}

export default function VideoChatApp({ presetRoomId = "" }) {
  const [session, setSession] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!presetRoomId || session) return;
    const params = new URLSearchParams(location.search);
    const defaultName = params.get("name") || "Guest";
    setSession({ name: defaultName, room: presetRoomId });
  }, [presetRoomId, session, location.search]);

  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/landing");
  }, [navigate]);

  const handleLeaveRoom = useCallback(() => {
    setSession(null);
    navigate("/sessions", { replace: true });
  }, [navigate]);

  return (
    <div className="videochat-shell">
      {session ? (
        <Room userName={session.name} roomId={session.room} onLeave={handleLeaveRoom} onBack={handleBack} />
      ) : (
        <Lobby onJoin={(name, room) => setSession({ name, room })} onBack={handleBack} />
      )}
    </div>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function DiceIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="2" y="2" width="20" height="20" rx="3" />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" />
      <circle cx="16" cy="8" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="8" cy="16" r="1.5" fill="currentColor" />
      <circle cx="16" cy="16" r="1.5" fill="currentColor" />
    </svg>
  );
}
function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}
function SpotlightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="2" y="3" width="15" height="18" rx="2" />
      <rect x="19" y="3" width="3" height="5" rx="1" />
      <rect x="19" y="10" width="3" height="5" rx="1" />
      <rect x="19" y="17" width="3" height="4" rx="1" />
    </svg>
  );
}
function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}
function MicOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}
function CamIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M23 7l-7 5 7 5V7z" />
      <rect x="1" y="5" width="15" height="14" rx="2" />
    </svg>
  );
}
function CamOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}
function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.42 19.42 0 0 1 3.07 8.63 19.79 19.79 0 0 1 0 0a2 2 0 0 1 2-2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L6.18 5.68" />
      <line x1="23" y1="1" x2="1" y2="23" />
    </svg>
  );
}

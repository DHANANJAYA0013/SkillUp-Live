import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { Menu, X, BookOpen, Bell } from "lucide-react";
import { useAuth } from "@/features/authsystem/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { appSocket } from "@/lib/socket";

const navLinks = [
  { label: "Find Mentors", path: "/mentors" },
  { label: "Sessions", path: "/sessions" },
  // { label: "Dashboard", path: "/dashboard" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isProfile = location.pathname.startsWith("/profile");
  const navigate = useNavigate();
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  const broadcastUnread = useCallback((count) => {
    console.log("badge count:", count);
    window.dispatchEvent(new CustomEvent("notifications-unread-updated", { detail: { count } }));
  }, []);

  const fetchUnread = useCallback(async (signal) => {
    try {
      if (!user?._id) {
        setUnread(0);
        return;
      }
      const res = await fetch(`${import.meta.env.VITE_API_BASE || ""}/api/notifications/${user._id}`, { signal });
      if (!res.ok) return;
      const body = await res.json();
      const notes = Array.isArray(body.notifications) ? body.notifications : (body.notifications || []);
      const count = notes.reduce((acc, n) => acc + (n.isRead ? 0 : 1), 0);
      setUnread(count);
      broadcastUnread(count);
    } catch (e) {
      // ignore fetch abort or errors
    }
  }, [broadcastUnread, user?._id]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchUnread(controller.signal);
    const interval = setInterval(() => void fetchUnread(new AbortController().signal), 25000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [fetchUnread]);

  useEffect(() => {
    if (!user?._id) return;

    appSocket.emit("register-user", user._id);
    const onConnect = () => {
      appSocket.emit("register-user", user._id);
    };

    const onNotification = (notification) => {
      console.log("notification received:", notification);
      setUnread((prev) => {
        const next = prev + 1;
        broadcastUnread(next);
        return next;
      });
    };

    const onUnreadReset = (event) => {
      const count = Number(event?.detail?.count);
      const normalized = Number.isFinite(count) ? Math.max(0, count) : 0;
      setUnread(normalized);
      broadcastUnread(normalized);
    };

    appSocket.on("connect", onConnect);
    appSocket.on("new_notification", onNotification);
    window.addEventListener("notifications-unread-reset", onUnreadReset);

    return () => {
      appSocket.off("connect", onConnect);
      appSocket.off("new_notification", onNotification);
      window.removeEventListener("notifications-unread-reset", onUnreadReset);
    };
  }, [broadcastUnread, user?._id]);

  const handleBrandClick = () => {
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" onClick={handleBrandClick} className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-base sm:text-lg font-bold text-foreground truncate">SkillBridge</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  location.pathname === link.path
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              aria-label="Notifications"
              onClick={() => navigate("/notifications")}
              className="relative p-1 text-foreground hover:text-foreground/80"
            >
              <Bell className="w-6 h-6" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-destructive text-white text-[11px] px-1.5 py-0.5">
                  {unread}
                </span>
              )}
            </button>

            <Link to="/profile" className="flex items-center" aria-label="Profile">
              <Avatar
                className={`h-10 w-10 border ${isProfile ? "border-primary ring-2 ring-primary/30" : "border-transparent"}`}
              >
                <AvatarImage
                  src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=200&q=80"
                  alt="Profile"
                />
                <AvatarFallback>DH</AvatarFallback>
              </Avatar>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 text-foreground shrink-0" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card px-3 sm:px-4 py-4 space-y-2 max-h-[calc(100vh-4rem)] overflow-y-auto">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileOpen(false)}
              className={`block px-4 py-2.5 rounded-lg text-sm font-medium ${
                location.pathname === link.path
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/profile"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium ${
              isProfile ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
            }`}
          >
            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                aria-label="Notifications"
                onClick={() => {
                  setMobileOpen(false);
                  navigate("/notifications");
                }}
                className="relative p-1 text-foreground hover:text-foreground/80"
              >
                <Bell className="w-5 h-5" />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-destructive text-white text-[11px] px-1.5 py-0.5">
                    {unread}
                  </span>
                )}
              </button>

              <Avatar className="h-9 w-9 border border-border">
              <AvatarImage
                src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=200&q=80"
                alt="Profile"
              />
              <AvatarFallback>DH</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span>Profile</span>
                <span className="text-xs text-muted-foreground">View and update</span>
              </div>
            </div>
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

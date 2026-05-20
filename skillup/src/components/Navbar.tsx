import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { Menu, X, BookOpen, Bell } from "lucide-react";
import { useAuth } from "@/features/authsystem/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import axios from "axios";
import { API_BASE } from "@/features/authsystem/config";

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
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      if (!user?._id) {
        setUnreadCount(0);
        return;
      }
      const url = `${API_BASE}/notifications/unread-count/${user._id}`;
      console.log("Notification API:", url);
      const res = await axios.get(url);
      const count = Number(res.data?.count ?? 0);
      setUnreadCount(Number.isFinite(count) ? count : 0);
      console.log("Unread count:", count);
    } catch (err) {
      console.log("Unread fetch failed", err);
    }
  }, [user?._id]);

  useEffect(() => {
    void fetchUnreadCount();
  }, [fetchUnreadCount, location.pathname, user?._id]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void fetchUnreadCount();
      }
    };

    window.addEventListener("focus", fetchUnreadCount);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("focus", fetchUnreadCount);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [fetchUnreadCount]);

  useEffect(() => {
    const reset = () => {
      setUnreadCount(0);
    };

    window.addEventListener("notifications-unread-reset", reset);

    return () => {
      window.removeEventListener("notifications-unread-reset", reset);
    };
  }, []);

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
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-destructive text-white text-[11px] px-1.5 py-0.5">
                  {unreadCount}
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

          {/* Keep bell and profile in one row, but as separate tap targets */}
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg hover:bg-muted">
            <button
              type="button"
              aria-label="Notifications"
              onClick={() => {
                setMobileOpen(false);
                navigate("/notifications");
              }}
              className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-foreground hover:text-foreground/80"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-destructive text-white text-[11px] px-1.5 py-0.5">
                  {unreadCount}
                </span>
              )}
            </button>

            <Link
              to="/profile"
              onClick={() => setMobileOpen(false)}
              className={`flex flex-1 items-center gap-3 rounded-lg px-2 py-1 text-sm font-medium ${
                isProfile ? "text-primary" : "text-foreground hover:bg-muted"
              }`}
            >
              <Avatar className="h-9 w-9 border border-border shrink-0">
                <AvatarImage
                  src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=200&q=80"
                  alt="Profile"
                />
                <AvatarFallback>DH</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <span>Profile</span>
                <span className="text-xs text-muted-foreground">View and update</span>
              </div>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

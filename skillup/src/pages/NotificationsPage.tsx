import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "@/features/authsystem/AuthContext";
import { API_BASE } from "@/features/authsystem/config";

const timeAgo = (isoDate) => {
  if (!isoDate) return "";
  const then = new Date(isoDate).getTime();
  const now = Date.now();
  const diff = Math.max(0, Math.floor((now - then) / 1000));
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user, loading: authLoading } = useAuth();

  const fetchNotifications = useCallback(async ({ silent = false } = {}) => {
    console.log("user id:", user?._id);
    if (!user?._id) {
      setLoading(false);
      return;
    }
    if (!silent) {
      setLoading(true);
      setError("");
    }
    try {
      const url = `${API_BASE}/notifications/${user._id}`;
      console.log("Notification API:", url);
      const res = await axios.get(url);
      const notes = res.data?.notifications || res.data || [];
      console.log("Notifications fetched:", res.data);
      notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(notes);
    } catch (err) {
      console.error("Failed to load notifications:", err);
      if (!silent) {
        setError("Failed to load notifications");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [user?._id]);

  const unreadCount = useMemo(() => notifications.reduce((acc, n) => acc + (n.isRead ? 0 : 1), 0), [notifications]);

  const markAllRead = useCallback(async () => {
    if (!user?._id) return;
    try {
      const url = `${API_BASE}/notifications/read/${user._id}`;
      console.log("Notification API:", url);
      const res = await axios.put(url);
      if (res.status >= 200 && res.status < 300) {
        console.log("Marked all read");
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        window.dispatchEvent(new Event("notifications-unread-reset"));
      }
    } catch (e) {
      console.log("Mark read failed", e);
    }
  }, [user?._id]);

  useEffect(() => {
    if (authLoading) return;
    const loadNotifications = async () => {
      await fetchNotifications();
      await markAllRead();
    };

    void loadNotifications();
  }, [authLoading, fetchNotifications, markAllRead]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground mt-1">Stay on top of session updates and messages.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={markAllRead}>
              Mark all as read
            </Button>
            <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => void fetchNotifications()}>
              ↻ Refresh
            </Button>
          </div>
        </div>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Recent</CardTitle>
              <CardDescription>Latest updates across your sessions.</CardDescription>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{unreadCount} new</Badge>
          </CardHeader>
          <Separator />
          <CardContent className="divide-y divide-border p-0">
            {loading && <div className="p-4 text-sm text-muted-foreground">Loading notifications...</div>}
            {!loading && error && <div className="p-4 text-sm text-destructive">{error}</div>}
            {!loading && !error && notifications.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">No notifications yet</div>
            )}
            {!loading && notifications.map((note) => (
              <div key={note._id} className={`flex items-start gap-4 p-4 sm:p-5 ${note.isRead ? "bg-transparent" : "bg-white/5"}`}>
                <Avatar className="h-10 w-10 border border-border">
                  <AvatarImage src={note.senderAvatar || "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=200&q=80"} alt={note.senderName || ""} />
                  <AvatarFallback>{(note.senderName || "?").split(" ").map(s => s[0]).join("")}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-foreground">{note.senderName || ""}</div>
                      <div className="text-sm text-muted-foreground">{note.message}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">{timeAgo(note.createdAt)}</div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">{note.sessionTitle}</div>
                    {!note.isRead && <Badge className="bg-destructive text-white">New</Badge>}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default NotificationsPage;

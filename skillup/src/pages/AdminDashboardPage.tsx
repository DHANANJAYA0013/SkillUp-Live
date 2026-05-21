import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Users, UserCog, GraduationCap, Calendar, Radio, CheckCircle2, Trash2, UserX, UserCheck, LogOut, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_BASE } from "@/features/authsystem/config";

const ATTENTION_KEYS = ["engaged", "focused", "distracted", "inactive", "present", "rejoining"] as const;

const ADMIN_AUTH_TOKEN_KEY = "skillup_admin_token";

type UserRole = "mentor" | "learner" | null;

type SessionStatus = "scheduled" | "live" | "completed";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  profileCompleted: boolean;
  disabled?: boolean;
  createdAt: string;
}

interface AdminMentor {
  _id: string;
  name: string;
  email: string;
  profile?: { skills?: string[] };
  disabled?: boolean;
  createdAt: string;
}

interface AdminSession {
  _id: string;
  mentorName: string;
  mentorEmail: string;
  title: string;
  topic: string;
  scheduledAt: string;
  status: SessionStatus;
  roomId: string;
  durationMinutes: number;
  createdAt: string;
}

interface AdminStats {
  totalUsers: number;
  totalMentors: number;
  totalLearners: number;
  totalSessions: number;
  liveSessions: number;
  completedSessions: number;
}

interface AdminOverviewResponse {
  stats: AdminStats;
  users: AdminUser[];
  mentors: AdminMentor[];
  sessions: AdminSession[];
  sessionsByType: {
    upcoming: AdminSession[];
    live: AdminSession[];
    past: AdminSession[];
  };
  adminSettings: {
    updatedAt: string;
  };
}

interface EmotionSummaryStudent {
  userId: string | null;
  studentName: string;
  total: number;
  counts: Record<string, number>;
  percentages: Record<string, number>;
  engagement: number;
  latestEmotion: string;
  lastSeenAt: string;
}

interface EmotionSummaryResponse {
  sessionId: string;
  total: number;
  counts: Record<string, number>;
  percentages: Record<string, number>;
  engagement: number;
  students: EmotionSummaryStudent[];
}

type EmotionDoc = {
  name?: string;
  userId?: string | { _id?: string } | null;
  sessionId?: string;
  emotions?: Array<{ emotion?: string; status?: string; timestamp?: string | number | Date }>;
};

const normalizeAttentionKey = (value: unknown) => (typeof value === "string" ? value.trim().toLowerCase() : "");

const calculateAttentionSummaryFromDocs = (emotionDocs: EmotionDoc[]) => {
  const counts: Record<string, number> = {
    engaged: 0,
    focused: 0,
    distracted: 0,
    inactive: 0,
    present: 0,
    rejoining: 0,
  };

  const studentsByUserId = new Map<string, any>();

  emotionDocs.forEach((doc) => {
    const userId = typeof doc.userId === "string" ? doc.userId : doc.userId?._id || null;
    const studentKey = userId || doc.name || doc.sessionId || "unknown";
    const studentName = doc.name || "Unknown student";

    if (!studentsByUserId.has(studentKey)) {
      studentsByUserId.set(studentKey, {
        userId: userId || null,
        userRole: "learner",
        studentName,
        totalSamples: 0,
        counts: { engaged: 0, focused: 0, distracted: 0, inactive: 0 },
        percentages: { engaged: 0, focused: 0, distracted: 0, inactive: 0 },
        attentionScore: 0,
        allCounts: { engaged: 0, focused: 0, distracted: 0, inactive: 0, present: 0, rejoining: 0 },
        allPercentages: { engaged: 0, focused: 0, distracted: 0, inactive: 0, present: 0, rejoining: 0 },
        lastSeenAt: null,
      });
    }

    const student = studentsByUserId.get(studentKey);
    const samples = Array.isArray(doc.emotions) ? doc.emotions : [];

    samples.forEach((sample) => {
      const key = normalizeAttentionKey(sample?.emotion ?? sample?.status);
      if (!key) return;

      student.totalSamples += 1;

      if (key in counts) counts[key] += 1;
      if (student.allCounts && key in student.allCounts) student.allCounts[key] = (student.allCounts[key] || 0) + 1;
      if (key === "engaged" || key === "focused" || key === "distracted" || key === "inactive") {
        student.counts[key] += 1;
      }

      const timestamp = sample.timestamp ? new Date(sample.timestamp) : null;
      if (timestamp && !Number.isNaN(timestamp.getTime())) {
        const currentLastSeen = student.lastSeenAt ? new Date(student.lastSeenAt).getTime() : 0;
        if (!currentLastSeen || timestamp.getTime() > currentLastSeen) {
          student.lastSeenAt = timestamp.toISOString();
        }
      }
    });

    const sampleTotal = student.totalSamples;
    student.percentages = {
      engaged: sampleTotal ? Number(((student.counts.engaged / sampleTotal) * 100).toFixed(1)) : 0,
      focused: sampleTotal ? Number(((student.counts.focused / sampleTotal) * 100).toFixed(1)) : 0,
      distracted: sampleTotal ? Number(((student.counts.distracted / sampleTotal) * 100).toFixed(1)) : 0,
      inactive: sampleTotal ? Number(((student.counts.inactive / sampleTotal) * 100).toFixed(1)) : 0,
    };

    student.allPercentages = {
      engaged: sampleTotal ? Number(((student.allCounts?.engaged || 0) / sampleTotal * 100).toFixed(1)) : 0,
      focused: sampleTotal ? Number(((student.allCounts?.focused || 0) / sampleTotal * 100).toFixed(1)) : 0,
      distracted: sampleTotal ? Number(((student.allCounts?.distracted || 0) / sampleTotal * 100).toFixed(1)) : 0,
      inactive: sampleTotal ? Number(((student.allCounts?.inactive || 0) / sampleTotal * 100).toFixed(1)) : 0,
      present: sampleTotal ? Number(((student.allCounts?.present || 0) / sampleTotal * 100).toFixed(1)) : 0,
      rejoining: sampleTotal ? Number(((student.allCounts?.rejoining || 0) / sampleTotal * 100).toFixed(1)) : 0,
    };

    const weightedScore =
      (student.allCounts?.engaged || 0) * 1 +
      (student.allCounts?.focused || 0) * 1 +
      (student.allCounts?.present || 0) * 0.8 +
      (student.allCounts?.rejoining || 0) * 0.7 +
      (student.allCounts?.distracted || 0) * 0.4 +
      (student.allCounts?.inactive || 0) * 0;

    student.attentionScore = sampleTotal ? Number(((weightedScore / sampleTotal) * 100).toFixed(1)) : 0;
  });

  const students = Array.from(studentsByUserId.values()).sort((a, b) => b.totalSamples - a.totalSamples || a.studentName.localeCompare(b.studentName));
  const totalSamples = students.reduce((acc: number, student: any) => acc + student.totalSamples, 0);

  const percentages: Record<string, number> = Object.keys(counts).reduce((acc: Record<string, number>, key) => {
    acc[key] = totalSamples ? Number(((counts[key] / totalSamples) * 100).toFixed(1)) : 0;
    return acc;
  }, {} as Record<string, number>);

  const weightedSummaryScore =
    counts.engaged * 1 +
    counts.focused * 1 +
    counts.present * 0.8 +
    counts.rejoining * 0.7 +
    counts.distracted * 0.4 +
    counts.inactive * 0;

  const summary = {
    summary: {
      counts: { engaged: counts.engaged, focused: counts.focused, distracted: counts.distracted, inactive: counts.inactive },
      percentages,
      totalSamples,
      totalLearners: students.length,
      attentionScore: totalSamples ? Number(((weightedSummaryScore / totalSamples) * 100).toFixed(1)) : 0,
      scoredSamples: totalSamples,
    },
    students,
  };

  return summary;
};
const parseApiResponse = async (res: Response) => {
  const raw = await res.text();
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return raw;
  }
};

const formatDateTime = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
};

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [newAccessCode, setNewAccessCode] = useState("");
  const [settingsMessage, setSettingsMessage] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [emotionSessionId, setEmotionSessionId] = useState("");
  const [emotionSummary, setEmotionSummary] = useState<EmotionSummaryResponse | null>(null);
  const [emotionSummaryLoading, setEmotionSummaryLoading] = useState(false);
  const [emotionSummaryError, setEmotionSummaryError] = useState("");
  const [selectedMentor, setSelectedMentor] = useState("all");

  const adminToken = localStorage.getItem(ADMIN_AUTH_TOKEN_KEY) || "";

  const logoutAdmin = () => {
    localStorage.removeItem(ADMIN_AUTH_TOKEN_KEY);
    localStorage.removeItem("isAdminAuthenticated");
    navigate("/admin-login", { replace: true });
  };

  const adminFetch = async (path: string, init: RequestInit = {}) => {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
        ...(init.headers || {}),
      },
    });

    if (res.status === 401) {
      logoutAdmin();
      throw new Error("Session expired");
    }

    return res;
  };

  const loadOverview = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await adminFetch("/admin/overview", { method: "GET" });
      const data = await parseApiResponse(res);

      if (!res.ok) {
        const message = data && typeof data === "object" && "error" in data
          ? String((data as { error: unknown }).error)
          : "Failed to load admin dashboard";
        throw new Error(message);
      }

      setOverview(data as AdminOverviewResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem(ADMIN_AUTH_TOKEN_KEY);
    if (!token) {
      console.log("No admin token found, redirecting to login");
      navigate("/admin-login", { replace: true });
      return;
    }
    console.log("Admin authenticated, loading dashboard");
    console.log("Admin token exists:", !!token);
    void loadOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mentorOptions = useMemo(() => {
    if (!overview) return ["all"];
    const names = Array.from(new Set(overview.sessions.map((s) => s.mentorName)));
    return ["all", ...names];
  }, [overview]);

  const filteredSessions = useMemo(() => {
    if (!overview) return [] as AdminSession[];
    const sessions = overview.sessions;
    return selectedMentor === "all" ? sessions : sessions.filter((s) => s.mentorName === selectedMentor);
  }, [overview, selectedMentor]);

  const roleBadge = (role: UserRole) => {
    if (role === "mentor") return <Badge variant="outline">Mentor</Badge>;
    if (role === "learner") return <Badge variant="secondary">Learner</Badge>;
    return <Badge variant="outline">Unassigned</Badge>;
  };

  const handleToggleDisable = async (user: AdminUser) => {
    const nextDisabled = !Boolean(user.disabled);
    const label = nextDisabled ? "disable" : "enable";

    if (!window.confirm(`Are you sure you want to ${label} ${user.name}?`)) {
      return;
    }

    setWorkingId(user._id);
    try {
      console.log(`Toggling user ${user._id} disabled status to:`, nextDisabled);
      const res = await adminFetch(`/admin/users/${user._id}/disable`, {
        method: "PATCH",
        body: JSON.stringify({ disabled: nextDisabled }),
      });
      const data = await parseApiResponse(res);
      if (!res.ok) {
        const message = data && typeof data === "object" && "error" in data
          ? String((data as { error: unknown }).error)
          : "Failed to update user";
        throw new Error(message);
      }
      
      console.log("User updated on database, updating UI");
      
      // Update overview state immediately without refetching
      setOverview((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          users: prev.users.map((u) =>
            u._id === user._id ? { ...u, disabled: nextDisabled } : u
          ),
        };
      });
      console.log("User status updated in UI");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setWorkingId(null);
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (!window.confirm(`Remove user ${user.name}? This cannot be undone.`)) {
      return;
    }

    setWorkingId(user._id);
    try {
      console.log("Deleting user:", user._id);
      const res = await adminFetch(`/admin/users/${user._id}`, { method: "DELETE" });
      const data = await parseApiResponse(res);
      if (!res.ok) {
        const message = data && typeof data === "object" && "error" in data
          ? String((data as { error: unknown }).error)
          : "Failed to remove user";
        throw new Error(message);
      }
      
      console.log("User deleted from database, updating UI");
      
      // Update overview state immediately without refetching
      setOverview((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          users: prev.users.filter((u) => u._id !== user._id),
          stats: {
            ...prev.stats,
            totalUsers: Math.max(0, prev.stats.totalUsers - 1),
            totalLearners: user.role === "learner" ? Math.max(0, prev.stats.totalLearners - 1) : prev.stats.totalLearners,
            totalMentors: user.role === "mentor" ? Math.max(0, prev.stats.totalMentors - 1) : prev.stats.totalMentors,
          },
        };
      });
      console.log("User removed from UI");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove user");
    } finally {
      setWorkingId(null);
    }
  };

  const handleDeleteSession = async (session: AdminSession) => {
    if (!window.confirm(`Delete session \"${session.title}\"?`)) {
      return;
    }

    setWorkingId(session._id);
    try {
      console.log("Deleting session:", session._id);
      const res = await adminFetch(`/admin/sessions/${session._id}`, { method: "DELETE" });
      const data = await parseApiResponse(res);
      if (!res.ok) {
        const message = data && typeof data === "object" && "error" in data
          ? String((data as { error: unknown }).error)
          : "Failed to remove session";
        throw new Error(message);
      }

      console.log("Session deleted from database, updating UI");
      
      // Update overview state immediately without refetching
      setOverview((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          sessions: prev.sessions.filter((s) => s._id !== session._id),
          sessionsByType: {
            upcoming: prev.sessionsByType.upcoming.filter((s) => s._id !== session._id),
            live: prev.sessionsByType.live.filter((s) => s._id !== session._id),
            past: prev.sessionsByType.past.filter((s) => s._id !== session._id),
          },
          stats: {
            ...prev.stats,
            totalSessions: Math.max(0, prev.stats.totalSessions - 1),
          },
        };
      });
      console.log("Session removed from UI");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove session");
    } finally {
      setWorkingId(null);
    }
  };

  const handleUpdateCode = async () => {
    setSettingsMessage("");
    setSettingsError("");

    const normalizedCode = newAccessCode.trim();
    if (!/^\d{6}$/.test(normalizedCode)) {
      setSettingsError("Admin code must be exactly 6 digits.");
      return;
    }

    setWorkingId("admin-code");
    try {
      const res = await adminFetch("/admin/settings/access-code", {
        method: "PUT",
        body: JSON.stringify({ newCode: normalizedCode }),
      });
      const data = await parseApiResponse(res);
      if (!res.ok) {
        const message = data && typeof data === "object" && "error" in data
          ? String((data as { error: unknown }).error)
          : "Failed to update admin code";
        throw new Error(message);
      }

      setSettingsMessage("Admin access code updated successfully.");
      setNewAccessCode("");
      await loadOverview();
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : "Failed to update admin code");
    } finally {
      setWorkingId(null);
    }
  };

  const statCards = useMemo(() => {
    if (!overview) return [];

    return [
      { label: "Total Users", value: overview.stats.totalUsers, icon: Users },
      { label: "Total Mentors", value: overview.stats.totalMentors, icon: UserCog },
      { label: "Total Learners", value: overview.stats.totalLearners, icon: GraduationCap },
      { label: "Total Sessions", value: overview.stats.totalSessions, icon: Calendar },
      { label: "Live Sessions", value: overview.stats.liveSessions, icon: Radio },
      { label: "Completed Sessions", value: overview.stats.completedSessions, icon: CheckCircle2 },
    ];
  }, [overview]);

  const loadEmotionSummary = async () => {
    const sessionId = emotionSessionId.trim();

    if (!sessionId) {
      setEmotionSummaryError("Enter a session or room ID.");
      return;
    }

    setEmotionSummaryLoading(true);
    setEmotionSummaryError("");

    try {
      const res = await fetch(`${API_BASE}/emotion/debug/${encodeURIComponent(sessionId)}`);
      const data = await parseApiResponse(res);

      if (!res.ok) {
        const message = data && typeof data === "object" && "error" in data
          ? String((data as { error: unknown }).error)
          : "Failed to load attention summary";
        throw new Error(message);
      }

      const emotionDocs = Array.isArray(data?.emotions) ? (data.emotions as EmotionDoc[]) : Array.isArray(data) ? (data as EmotionDoc[]) : [];
      const summary = calculateAttentionSummaryFromDocs(emotionDocs as EmotionDoc[]);

      // Normalize into EmotionSummaryResponse for admin UI
      const normalized: EmotionSummaryResponse = {
        sessionId: data?.session?._id || sessionId,
        total: summary.summary.totalSamples,
        counts: summary.summary.counts,
        percentages: summary.summary.percentages,
        engagement: summary.summary.attentionScore,
        students: summary.students.map((s: any) => ({
          userId: s.userId,
          studentName: s.studentName,
          total: s.totalSamples,
          counts: s.counts,
          percentages: s.percentages,
          engagement: s.attentionScore,
          latestEmotion: s.lastSeenAt || "",
          lastSeenAt: s.lastSeenAt || "",
        })),
      };

      console.log("Fetched summary:", normalized);
      setEmotionSummary(normalized);
    } catch (err) {
      setEmotionSummaryError(err instanceof Error ? err.message : "Failed to load emotion summary");
    } finally {
      setEmotionSummaryLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen grid place-items-center bg-background text-sm sm:text-base">Loading admin dashboard...</div>;
  }

  if (!overview) {
    return (
      <div className="min-h-screen grid place-items-center bg-background px-3 sm:px-4 py-6">
        <Card className="w-full max-w-lg border-border/60">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Unable to load admin dashboard</CardTitle>
            <CardDescription className="text-xs sm:text-sm">{error || "Please log in again."}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button onClick={() => void loadOverview()} variant="outline" className="text-xs sm:text-sm h-9 sm:h-10">Retry</Button>
            <Button onClick={logoutAdmin} className="text-xs sm:text-sm h-9 sm:h-10">Back to Admin Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-10 space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground truncate">Admin Dashboard</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">Secure platform control panel with code-based access.</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 flex-shrink-0">
            <Button variant="outline" className="gap-1 sm:gap-2 text-xs sm:text-sm h-9 sm:h-10" onClick={() => void loadOverview()}>
              Refresh
            </Button>
            <Button variant="destructive" className="gap-1 sm:gap-2 text-xs sm:text-sm h-9 sm:h-10" onClick={logoutAdmin}>
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>

        {error && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs sm:text-sm text-destructive">
            {error}
          </p>
        )}

        <section className="space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">Platform Stats</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
            {statCards.map((stat) => (
              <Card key={stat.label} className="border-border/60">
                <CardContent className="p-3 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{stat.label}</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 text-primary grid place-items-center flex-shrink-0">
                    <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">User Management</h2>
          <Card className="border-border/60">
            <CardHeader className="px-3 sm:px-6 py-4">
              <CardTitle className="text-base sm:text-lg">All Users</CardTitle>
              <CardDescription className="text-xs sm:text-sm">View, disable, enable, or remove platform accounts.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 sm:px-6 pb-4 overflow-x-auto">
              <div className="inline-block min-w-full">
              <table className="w-full text-xs sm:text-sm">
              <thead>
                  <tr className="border-b border-border/60 text-muted-foreground bg-muted/20">
                    <th className="text-left py-2.5 px-2 sm:px-3 font-medium">Name</th>
                    <th className="text-left py-2.5 px-2 sm:px-3 font-medium hidden sm:table-cell">Email</th>
                    <th className="text-left py-2.5 px-2 sm:px-3 font-medium">Role</th>
                    <th className="text-left py-2.5 px-2 sm:px-3 font-medium">Status</th>
                    <th className="text-left py-2.5 px-2 sm:px-3 font-medium hidden md:table-cell">Joined</th>
                    <th className="text-right py-2.5 px-2 sm:px-3 font-medium">Actions</th>
                  </tr>
                </thead>
              <tbody>
                  {overview.users.map((user) => {
                    const disabled = Boolean(user.disabled);
                    return (
                      <tr key={user._id} className="border-b border-border/40 hover:bg-muted/50 transition-colors">
                        <td className="py-2.5 px-2 sm:px-3 font-medium text-foreground truncate">{user.name}</td>
                        <td className="py-2.5 px-2 sm:px-3 text-muted-foreground hidden sm:table-cell truncate text-xs">{user.email}</td>
                        <td className="py-2.5 px-2 sm:px-3">{roleBadge(user.role)}</td>
                        <td className="py-2.5 px-2 sm:px-3">
                          {disabled ? (
                            <Badge className="bg-destructive/10 text-destructive border-0 text-xs">Disabled</Badge>
                          ) : (
                            <Badge className="bg-secondary/10 text-secondary border-0 text-xs">Active</Badge>
                          )}
                        </td>
                        <td className="py-2.5 px-2 sm:px-3 text-muted-foreground hidden md:table-cell text-xs">{formatDateTime(user.createdAt)}</td>
                        <td className="py-2.5 px-2 sm:px-3">
                          <div className="flex justify-end gap-1 sm:gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-0.5 sm:gap-1 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                              onClick={() => void handleToggleDisable(user)}
                              disabled={workingId === user._id}
                            >
                              {disabled ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                              <span className="hidden sm:inline">{disabled ? "Enable" : "Disable"}</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-0.5 sm:gap-1 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                              onClick={() => void handleDeleteUser(user)}
                              disabled={workingId === user._id}
                            >
                              <Trash2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Remove</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="px-3 sm:px-6 py-4">
              <CardTitle className="text-base sm:text-lg">Mentor Directory</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Quick view of mentors and their listed skills.</CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {overview.mentors.length > 0 ? overview.mentors.map((mentor) => (
                <div key={mentor._id} className="rounded-lg border border-border/60 p-3 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <p className="font-medium text-foreground text-sm truncate">{mentor.name}</p>
                  <p className="text-xs text-muted-foreground break-all mt-1">{mentor.email}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Skills: {Array.isArray(mentor.profile?.skills) && mentor.profile.skills.length > 0 ? mentor.profile.skills.slice(0, 3).join(", ") : "Not provided"}
                  </p>
                  <div className="mt-3">
                    {mentor.disabled ? (
                      <Badge className="bg-destructive/10 text-destructive border-0 text-xs">Disabled</Badge>
                    ) : (
                      <Badge className="bg-secondary/10 text-secondary border-0 text-xs">Active</Badge>
                    )}
                  </div>
                </div>
              )) : <p className="text-xs sm:text-sm text-muted-foreground">No mentors found.</p>}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">Session Management</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
            <Card className="border-border/60">
              <CardContent className="p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-muted-foreground">Upcoming Sessions</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{overview.sessionsByType.upcoming.length}</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-muted-foreground">Live Sessions</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{overview.sessionsByType.live.length}</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-muted-foreground">Past Sessions</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{overview.sessionsByType.past.length}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/60">
            <CardHeader className="px-3 sm:px-6 py-4">
              <CardTitle className="text-base sm:text-lg">All Sessions</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Review upcoming, live, and past sessions. Remove inappropriate sessions if needed.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 sm:px-6 pb-4 overflow-x-auto">
              <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <label className="text-sm sm:text-base font-medium">Sessions by Mentor</label>
                  <select
                    value={selectedMentor}
                    onChange={(e) => setSelectedMentor(e.target.value)}
                    className="ml-3 h-9 text-sm border border-border/60 rounded px-2 bg-background"
                    aria-label="Filter by mentor"
                  >
                    <option value="all">All Mentors</option>
                    {mentorOptions.filter((m) => m !== "all").map((mentor) => (
                      <option key={mentor} value={mentor}>{mentor}</option>
                    ))}
                  </select>
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {selectedMentor === "all" ? `Showing ${filteredSessions.length} sessions` : `Showing ${filteredSessions.length} sessions from ${selectedMentor}`}
                </div>
              </div>
              <div className="inline-block min-w-full">
              <table className="w-full text-xs sm:text-sm">
              <thead>
                  <tr className="border-b border-border/60 text-muted-foreground bg-muted/20">
                    <th className="text-left py-2.5 px-2 sm:px-3 font-medium">Session</th>
                    <th className="text-left py-2.5 px-2 sm:px-3 font-medium hidden sm:table-cell">Mentor</th>
                    <th className="text-left py-2.5 px-2 sm:px-3 font-medium hidden md:table-cell">Schedule</th>
                    <th className="text-left py-2.5 px-2 sm:px-3 font-medium">Status</th>
                    <th className="text-right py-2.5 px-2 sm:px-3 font-medium">Actions</th>
                  </tr>
                </thead>
              <tbody>
                  {filteredSessions.map((session) => (
                    <tr key={session._id} className="border-b border-border/40 hover:bg-muted/50 transition-colors">
                      <td className="py-2.5 px-2 sm:px-3">
                        <p className="font-medium text-foreground text-sm truncate">{session.title}</p>
                        <p className="text-xs text-muted-foreground">{session.topic} · Room {session.roomId}</p>
                      </td>
                      <td className="py-2.5 px-2 sm:px-3 hidden sm:table-cell">
                        <p className="text-foreground text-sm truncate">{session.mentorName}</p>
                        <p className="text-xs text-muted-foreground break-all">{session.mentorEmail}</p>
                      </td>
                      <td className="py-2.5 px-2 sm:px-3 text-muted-foreground hidden md:table-cell text-sm">{formatDateTime(session.scheduledAt)}</td>
                      <td className="py-2.5 px-2 sm:px-3">
                        {session.status === "live" && <Badge className="bg-destructive/10 text-destructive border-0 text-xs">Live</Badge>}
                        {session.status === "scheduled" && <Badge className="bg-primary/10 text-primary border-0 text-xs">Upcoming</Badge>}
                        {session.status === "completed" && <Badge className="bg-secondary/10 text-secondary border-0 text-xs">Completed</Badge>}
                      </td>
                      <td className="py-2.5 px-2 sm:px-3 text-right">
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-0.5 sm:gap-1 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                          onClick={() => void handleDeleteSession(session)}
                          disabled={workingId === session._id}
                        >
                          <Trash2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Delete</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">Attention Insights</h2>
          <Card className="border-border/60">
            <CardHeader className="px-3 sm:px-6 py-4">
              <CardTitle className="text-base sm:text-lg">Session Attention Summary</CardTitle>
              <CardDescription className="text-xs sm:text-sm">View attention tracking metrics and engagement for any live session or room ID.</CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-4 space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-end">
                <div className="flex-1">
                  <Label htmlFor="emotion-session-id" className="text-xs sm:text-sm">Session / Room ID</Label>
                  <Input
                    id="emotion-session-id"
                    value={emotionSessionId}
                    onChange={(event) => setEmotionSessionId(event.target.value)}
                    placeholder="Enter session or room ID"
                    className="mt-2 text-sm sm:text-base h-10 sm:h-11"
                  />
                </div>
                <Button onClick={() => void loadEmotionSummary()} disabled={emotionSummaryLoading} className="text-xs sm:text-sm h-9 sm:h-10">
                  {emotionSummaryLoading ? "Loading..." : "Load Summary"}
                </Button>
              </div>
              {emotionSummaryError && <p className="text-xs sm:text-sm text-destructive">{emotionSummaryError}</p>}
            </CardContent>
          </Card>

          {emotionSummary && (
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
                {ATTENTION_KEYS.map((key) => (
                  <Card key={key} className="border-border/60">
                    <CardContent className="p-3 sm:p-4">
                      <p className="text-xs text-muted-foreground capitalize">{key}</p>
                      <p className="text-lg sm:text-xl font-bold text-foreground mt-1">{emotionSummary?.percentages?.[key] ?? 0}%</p>
                      <p className="text-[11px] text-muted-foreground mt-1">{emotionSummary?.counts?.[key] ?? 0} samples</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                <Card className="border-border/60">
                  <CardContent className="p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-muted-foreground">Total Samples</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{emotionSummary?.total ?? 0}</p>
                  </CardContent>
                </Card>
                <Card className="border-border/60">
                  <CardContent className="p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-muted-foreground">Engagement Score</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{emotionSummary?.engagement ?? 0}%</p>
                  </CardContent>
                </Card>
                <Card className="border-border/60">
                  <CardContent className="p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-muted-foreground">Session ID</p>
                    <p className="text-sm sm:text-base font-medium text-foreground mt-1 break-all">{emotionSummary?.sessionId ?? ""}</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-border/60">
                <CardHeader className="px-3 sm:px-6 py-4">
                  <CardTitle className="text-base sm:text-lg">Student Attention Breakdown</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Each student’s attention percentages and engagement score.</CardDescription>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-4 space-y-3">
                  {emotionSummary.students.length > 0 ? emotionSummary.students.map((student) => (
                    <div key={student.userId || student.studentName} className="rounded-lg border border-border/60 bg-muted/20 p-3 sm:p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <p className="font-medium text-foreground text-sm sm:text-base">{student.studentName}</p>
                          <p className="text-xs text-muted-foreground">Latest state: {student.latestEmotion}</p>
                        </div>
                        <Badge className="w-fit bg-primary/10 text-primary border-0 text-xs">Engagement {student.engagement}%</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {ATTENTION_KEYS.map((key) => (
                          <span key={key} className="rounded-full border border-border/70 bg-background px-2.5 py-1 text-[11px] text-muted-foreground">
                            {key}: {student.percentages?.[key] ?? 0}%
                          </span>
                        ))}
                      </div>
                    </div>
                  )) : (
                    <p className="text-xs sm:text-sm text-muted-foreground">No attention summary available for this session.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </section>

        <section className="space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">Admin Settings</h2>
          <Card className="border-border/60">
            <CardHeader className="px-3 sm:px-6 py-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <KeyRound className="w-4 h-4 flex-shrink-0" /> Change 6-Digit Admin Access Code
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-2">
                Last updated: {formatDateTime(overview.adminSettings.updatedAt)}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-4 space-y-3 sm:space-y-4">
              <div className="w-full sm:max-w-xs">
                <Label htmlFor="new-admin-code" className="text-xs sm:text-sm">New Access Code</Label>
                <Input
                  id="new-admin-code"
                  type="password"
                  value={newAccessCode}
                  onChange={(event) => setNewAccessCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  inputMode="numeric"
                  maxLength={6}
                  className="mt-2 text-sm sm:text-base h-10 sm:h-11"
                />
              </div>
              <Button onClick={() => void handleUpdateCode()} disabled={workingId === "admin-code"} className="text-xs sm:text-sm h-9 sm:h-10">
                {workingId === "admin-code" ? "Updating..." : "Update Admin Code"}
              </Button>
              {settingsMessage && <p className="text-xs sm:text-sm text-secondary">{settingsMessage}</p>}
              {settingsError && <p className="text-xs sm:text-sm text-destructive">{settingsError}</p>}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboardPage;

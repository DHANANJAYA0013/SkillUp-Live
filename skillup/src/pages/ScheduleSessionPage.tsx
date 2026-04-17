import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/features/authsystem/AuthContext";
import { API_BASE } from "@/features/authsystem/config";

const parseApiResponse = async (res: Response) => {
  const raw = await res.text();
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return raw;
  }
};

const ScheduleSessionPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: authUser, token } = useAuth();

  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionDescription, setSessionDescription] = useState("");
  const [sessionDateTime, setSessionDateTime] = useState("");
  const [sessionDuration, setSessionDuration] = useState("");
  const [sessionTopic, setSessionTopic] = useState("");
  const [creatingSession, setCreatingSession] = useState(false);

  useEffect(() => {
    if (!authUser) {
      navigate("/signin", { replace: true });
      return;
    }

    if (authUser.role !== "mentor") {
      toast({
        title: "Access denied",
        description: "Only mentors can schedule sessions.",
        variant: "destructive",
      });
      navigate("/profile", { replace: true });
    }
  }, [authUser, navigate, toast]);

  const handleCreateSession = async () => {
    if (!token) {
      toast({ title: "Not signed in", description: "Sign in to create sessions.", variant: "destructive" });
      return;
    }

    if (authUser?.role !== "mentor") {
      toast({ title: "Access denied", description: "Only mentors can create sessions.", variant: "destructive" });
      return;
    }

    const normalizedTitle = sessionTitle.trim();
    const normalizedDescription = sessionDescription.trim();
    const normalizedTopic = sessionTopic.trim();
    const durationValue = Number(sessionDuration);

    if (!normalizedTitle || !normalizedDescription || !sessionDateTime || !normalizedTopic || !Number.isFinite(durationValue) || durationValue <= 0) {
      toast({
        title: "Missing fields",
        description: "Provide title, description, date and time, duration, and topic.",
        variant: "destructive",
      });
      return;
    }

    setCreatingSession(true);

    try {
      const res = await fetch(`${API_BASE}/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: normalizedTitle,
          description: normalizedDescription,
          dateTime: new Date(sessionDateTime).toISOString(),
          date: sessionDateTime.split("T")[0] || "",
          startTime: sessionDateTime.split("T")[1] || "",
          duration: durationValue,
          topic: normalizedTopic,
        }),
      });

      const data = await parseApiResponse(res);
      if (!res.ok) {
        const message =
          data && typeof data === "object" && "error" in data
            ? String((data as { error: unknown }).error)
            : typeof data === "string" && data.trim()
              ? data
              : "Failed to create session";
        throw new Error(message);
      }

      setSessionTitle("");
      setSessionDescription("");
      setSessionDateTime("");
      setSessionDuration("");
      setSessionTopic("");

      toast({
        title: "Session created",
        description: "Your session was saved in the sessions collection.",
      });
    } catch (error) {
      toast({
        title: "Creation failed",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setCreatingSession(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/profile")}> 
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Profile
        </Button>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Schedule Session</h1>
          <p className="text-muted-foreground mt-1">Create a new mentoring session in the sessions collection.</p>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">New Session</CardTitle>
            <CardDescription>Fill in all required details to publish your session.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="sessionTitle">Title</Label>
                <Input
                  id="sessionTitle"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="Frontend Interview Preparation"
                  className="bg-card"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="sessionDescription">Description</Label>
                <Textarea
                  id="sessionDescription"
                  rows={4}
                  value={sessionDescription}
                  onChange={(e) => setSessionDescription(e.target.value)}
                  placeholder="What this session will cover."
                  className="bg-card"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sessionDateTime">Date & Time</Label>
                <Input
                  id="sessionDateTime"
                  type="datetime-local"
                  value={sessionDateTime}
                  onChange={(e) => setSessionDateTime(e.target.value)}
                  className="bg-card"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sessionDuration">Duration (minutes)</Label>
                <Input
                  id="sessionDuration"
                  type="number"
                  min="1"
                  value={sessionDuration}
                  onChange={(e) => setSessionDuration(e.target.value)}
                  placeholder="60"
                  className="bg-card"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="sessionTopic">Topic</Label>
                <Input
                  id="sessionTopic"
                  value={sessionTopic}
                  onChange={(e) => setSessionTopic(e.target.value)}
                  placeholder="React, Node.js, System Design"
                  className="bg-card"
                />
              </div>
              <div className="sm:col-span-2">
                <Button onClick={handleCreateSession} disabled={creatingSession}>
                  {creatingSession ? "Creating..." : "Create session"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ScheduleSessionPage;

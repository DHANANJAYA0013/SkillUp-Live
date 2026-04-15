import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/features/authsystem/AuthContext";
import { API_BASE } from "@/features/authsystem/config";
import type { AuthUser } from "@/features/authsystem/types";

const profileSkills = ["React", "TypeScript", "System Design", "GraphQL"];

const particlesOptions = {
  background: {
    color: {
      value: "transparent",
    },
  },
  fpsLimit: 60,
  interactivity: {
    events: {
      onHover: {
        enable: true,
        mode: "grab" as const,
      },
      resize: {
        enable: true,
      },
    },
    modes: {
      grab: {
        distance: 140,
        links: {
          opacity: 0.3,
        },
      },
    },
  },
  particles: {
    color: {
      value: "#6b8cff",
    },
    links: {
      color: "#8aa6ff",
      distance: 140,
      enable: true,
      opacity: 0.25,
      width: 1,
    },
    move: {
      direction: "none" as const,
      enable: true,
      outModes: {
        default: "out" as const,
      },
      random: false,
      speed: 0.8,
      straight: false,
    },
    number: {
      density: {
        enable: true,
      },
      value: 60,
    },
    opacity: {
      value: 0.25,
    },
    shape: {
      type: "circle" as const,
    },
    size: {
      value: { min: 1, max: 3 },
    },
  },
  detectRetina: true,
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: authUser, token, logout } = useAuth();
  const [particlesReady, setParticlesReady] = useState(false);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setParticlesReady(true);
    });
  }, []);

  const loadUsers = async () => {
    if (!token) {
      toast({ title: "Not signed in", description: "Sign in via authsystem first.", variant: "destructive" });
      return;
    }

    setLoadingUsers(true);
    try {
      const res = await fetch(`${API_BASE}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch users");
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (error) {
      toast({
        title: "Cannot load users",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSignout = () => {
    logout();
    navigate("/auth", { replace: true });
  };

  const displayName = authUser?.name || "Dhananjaya";
  const displayEmail = authUser?.email || "dhananjaya@skillbridge.io";
  const displayRole = authUser?.role || "teacher";
  const displayAvatar = authUser?.avatar || "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=400&q=80";
  const profile = authUser?.profile || {};
  const profileBio = typeof profile.bio === "string" && profile.bio.trim().length > 0
    ? profile.bio
    : "Full-stack mentor helping learners master React, TypeScript, and system design through real-world projects.";

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-70" aria-hidden="true">
        {particlesReady && <Particles id="profile-particles" className="h-full w-full" options={particlesOptions} />}
      </div>

      <div className="relative z-10">
        <Navbar />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground mt-1">Edit your profile, update your password, and manage teaching skills.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="shadow-card">
            <CardContent className="pt-6 flex flex-col items-center text-center gap-4">
              <Avatar className="h-28 w-28 shadow-card">
                <AvatarImage
                  src={displayAvatar}
                  alt={displayName}
                />
                <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-foreground">{displayName}</h2>
                <p className="text-sm text-muted-foreground" style={{ textTransform: "capitalize" }}>{displayRole} · Bengaluru, IN</p>
                <p className="text-sm text-muted-foreground">{displayEmail}</p>
              </div>
              <Button variant="outline" className="mt-2 w-full max-w-[180px]">Upload picture</Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-card">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-0 gap-3 pb-4">
                <div>
                  <CardTitle className="text-xl">Edit profile</CardTitle>
                  <CardDescription>Basic info, bio, and teaching role.</CardDescription>
                </div>
                <Button size="sm">Save changes</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName">Full name</Label>
                    <Input id="fullName" defaultValue={displayName} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={displayEmail} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" defaultValue="Bengaluru, IN" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Role</Label>
                    <Select defaultValue={displayRole || "teacher"}>
                      <SelectTrigger className="bg-card">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="learner">Learner</SelectItem>
                        <SelectItem value="mentor">Mentor</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      rows={4}
                      defaultValue={profileBio}
                      className="bg-card"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-0 gap-3 pb-4">
                <div>
                  <CardTitle className="text-lg">Auth Account Actions</CardTitle>
                  <CardDescription>Moved from auth/home. Manage auth session and inspect registered users.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={loadUsers} disabled={loadingUsers}>
                    {loadingUsers ? "Loading users..." : "Load all users"}
                  </Button>
                  <Button variant="outline" onClick={handleSignout}>Sign out</Button>
                </div>

                {users.length > 0 && (
                  <>
                    <p className="text-sm text-muted-foreground">Total users: {users.length}</p>
                    <div className="space-y-3">
                      {users.map((item) => {
                        const itemProfile = item.profile || {};
                        const provider = item.googleId ? "google" : item.githubId ? "github" : "unknown";

                        return (
                          <div key={item._id} className="rounded-md border p-3 space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-muted-foreground">{item.email}</p>
                              </div>
                              <div className="text-xs text-muted-foreground text-right">
                                <p>Provider: {provider}</p>
                                <p>Joined: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "N/A"}</p>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 text-xs">
                              <span className="rounded-full border px-2 py-1">role: {item.role || "pending"}</span>
                              <span className="rounded-full border px-2 py-1">
                                profile: {item.profileCompleted ? "complete" : "incomplete"}
                              </span>
                            </div>

                            {item.role === "teacher" ? (
                              <div className="space-y-1 text-sm">
                                {Array.isArray(itemProfile.skills) && itemProfile.skills.length > 0 && (
                                  <p><strong>Skills:</strong> {itemProfile.skills.join(", ")}</p>
                                )}
                                {itemProfile.yearsOfExperience !== null && itemProfile.yearsOfExperience !== undefined && (
                                  <p><strong>Experience:</strong> {itemProfile.yearsOfExperience} years</p>
                                )}
                                {typeof itemProfile.bio === "string" && itemProfile.bio.trim().length > 0 && (
                                  <p><strong>Bio:</strong> {itemProfile.bio}</p>
                                )}
                                {Array.isArray(itemProfile.certifications) && itemProfile.certifications.length > 0 && (
                                  <p><strong>Certifications:</strong> {itemProfile.certifications.join(", ")}</p>
                                )}
                                {Array.isArray(itemProfile.portfolioLinks) && itemProfile.portfolioLinks.length > 0 && (
                                  <p><strong>Portfolio:</strong> {itemProfile.portfolioLinks.join(", ")}</p>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-1 text-sm">
                                {Array.isArray(itemProfile.learningInterests) && itemProfile.learningInterests.length > 0 && (
                                  <p><strong>Learning Interests:</strong> {itemProfile.learningInterests.join(", ")}</p>
                                )}
                                {Array.isArray(itemProfile.preferredLanguages) && itemProfile.preferredLanguages.length > 0 && (
                                  <p><strong>Preferred Languages:</strong> {itemProfile.preferredLanguages.join(", ")}</p>
                                )}
                                {typeof itemProfile.experienceLevel === "string" && itemProfile.experienceLevel.trim().length > 0 && (
                                  <p style={{ textTransform: "capitalize" }}><strong>Experience Level:</strong> {itemProfile.experienceLevel}</p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-0 gap-3 pb-4">
                <div>
                  <CardTitle className="text-lg">Skills (for teachers)</CardTitle>
                  <CardDescription>Showcase the topics you mentor in.</CardDescription>
                </div>
                <Button size="sm">Add skill</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-2">
                  <Input placeholder="e.g. Next.js, Data Structures" className="bg-card" />
                  <div className="flex items-center justify-end text-xs text-muted-foreground">Press Enter to add</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profileSkills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="outline"
                      className="bg-primary/10 text-primary border-primary/20 px-3 py-1"
                    >
                      {skill}
                      <span className="ml-1 text-muted-foreground">×</span>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-0 gap-3 pb-4">
                <div>
                  <CardTitle className="text-lg">Create a session</CardTitle>
                  <CardDescription>Set up a new class slot for learners.</CardDescription>
                </div>
                <Button size="sm">Create session</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="sessionTitle">Session title</Label>
                    <Input id="sessionTitle" placeholder="e.g. Advanced TypeScript" className="bg-card" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="instructorName">Instructor name</Label>
                    <Input id="instructorName" placeholder="Your name" className="bg-card" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="instructorId">Instructor ID</Label>
                    <Input id="instructorId" placeholder="e.g. TCH-204" className="bg-card" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sessionDate">Date</Label>
                    <Input id="sessionDate" type="date" className="bg-card" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="startTime">Start time</Label>
                    <Input id="startTime" type="time" className="bg-card" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="duration">Duration</Label>
                    <Input id="duration" placeholder="e.g. 60 minutes" className="bg-card" />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" rows={3} placeholder="What will you cover?" className="bg-card" />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label htmlFor="sessionLink">Session link / room ID</Label>
                    <Input id="sessionLink" placeholder="Paste meeting link or room code" className="bg-card" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-0 gap-3 pb-4">
                <div>
                  <CardTitle className="text-lg">Change password</CardTitle>
                  <CardDescription>Secure your account with a new password.</CardDescription>
                </div>
                <Button size="sm">Update password</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="currentPassword">Current password</Label>
                    <Input id="currentPassword" type="password" defaultValue="********" className="bg-card" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="newPassword">New password</Label>
                    <Input id="newPassword" type="password" defaultValue="********" className="bg-card" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword">Confirm new password</Label>
                    <Input id="confirmPassword" type="password" defaultValue="********" className="bg-card" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        </main>
      </div>
    </div>
  );
};

export default ProfilePage;

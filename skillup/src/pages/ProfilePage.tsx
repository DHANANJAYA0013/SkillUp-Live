import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import type { UserRole } from "@/features/authsystem/types";

const splitList = (value: string) => value.split(",").map((v) => v.trim()).filter(Boolean);

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
  const { user: authUser, token, logout, updateUser } = useAuth();
  const [particlesReady, setParticlesReady] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(authUser?.role || null);

  const initial = useMemo(() => {
    const profile = authUser?.profile || {};
    return {
      interests: Array.isArray(profile.learningInterests) ? profile.learningInterests.join(", ") : "",
      languages: Array.isArray(profile.preferredLanguages) ? profile.preferredLanguages.join(", ") : "",
      experienceLevel: typeof profile.experienceLevel === "string" ? profile.experienceLevel : "",
      skills: Array.isArray(profile.skills) ? profile.skills.join(", ") : "",
      yearsOfExperience:
        profile.yearsOfExperience === null || profile.yearsOfExperience === undefined
          ? ""
          : String(profile.yearsOfExperience),
      bio: typeof profile.bio === "string" ? profile.bio : "",
      certifications: Array.isArray(profile.certifications) ? profile.certifications.join(", ") : "",
      portfolioLinks: Array.isArray(profile.portfolioLinks) ? profile.portfolioLinks.join(", ") : "",
    };
  }, [authUser]);

  const [interests, setInterests] = useState(initial.interests);
  const [languages, setLanguages] = useState(initial.languages);
  const [experienceLevel, setExperienceLevel] = useState<"beginner" | "intermediate" | "advanced" | "">(
    initial.experienceLevel as "beginner" | "intermediate" | "advanced" | ""
  );
  const [skills, setSkills] = useState(initial.skills);
  const [yearsOfExperience, setYearsOfExperience] = useState(initial.yearsOfExperience);
  const [bio, setBio] = useState(initial.bio);
  const [certifications, setCertifications] = useState(initial.certifications);
  const [portfolioLinks, setPortfolioLinks] = useState(initial.portfolioLinks);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setParticlesReady(true);
    });
  }, []);

  useEffect(() => {
    setSelectedRole(authUser?.role || null);
    setInterests(initial.interests);
    setLanguages(initial.languages);
    setExperienceLevel(initial.experienceLevel as "beginner" | "intermediate" | "advanced" | "");
    setSkills(initial.skills);
    setYearsOfExperience(initial.yearsOfExperience);
    setBio(initial.bio);
    setCertifications(initial.certifications);
    setPortfolioLinks(initial.portfolioLinks);
  }, [authUser, initial]);

  const isRoleLocked = Boolean(authUser?.role);
  const handleSave = async () => {
    if (!token) {
      toast({ title: "Not signed in", description: "Sign in to edit your profile.", variant: "destructive" });
      return;
    }

    if (!selectedRole) {
      toast({ title: "Select role", description: "Choose learner or mentor.", variant: "destructive" });
      return;
    }

    if (authUser?.role && selectedRole !== authUser.role) {
      toast({
        title: "Role locked",
        description: "Role is fixed once set and cannot be changed.",
        variant: "destructive",
      });
      setSelectedRole(authUser.role);
      return;
    }

    const learnerPayload = {
      learningInterests: splitList(interests),
      preferredLanguages: splitList(languages),
      experienceLevel,
    };

    const mentorPayload = {
      skills: splitList(skills),
      yearsOfExperience: yearsOfExperience.trim() === "" ? null : Number(yearsOfExperience),
      bio: bio.trim(),
      certifications: splitList(certifications),
      portfolioLinks: splitList(portfolioLinks),
    };

    if (selectedRole === "learner" && (!learnerPayload.learningInterests.length || !learnerPayload.experienceLevel)) {
      toast({
        title: "Missing fields",
        description: "Learner profile needs interests and experience level.",
        variant: "destructive",
      });
      return;
    }

    if (selectedRole === "mentor" && (!mentorPayload.skills.length || !mentorPayload.bio)) {
      toast({
        title: "Missing fields",
        description: "Mentor profile needs skills and bio.",
        variant: "destructive",
      });
      return;
    }

    if (selectedRole === "mentor" && mentorPayload.yearsOfExperience !== null && Number.isNaN(mentorPayload.yearsOfExperience)) {
      toast({
        title: "Invalid value",
        description: "Years of experience must be a number.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/auth/complete-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          role: selectedRole,
          profile: selectedRole === "mentor" ? mentorPayload : learnerPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save profile");

      updateUser(data.user);
      toast({ title: "Profile updated", description: "Your details were saved to database." });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const displayName = authUser?.name || "Dhananjaya";
  const displayEmail = authUser?.email || "dhananjaya@skillbridge.io";
  const displayAvatar = authUser?.avatar || "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=400&q=80";
  const roleLabel = selectedRole === "mentor" ? "mentor" : "learner";

  if (!authUser) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-muted-foreground">
        Please sign in to access your profile.
      </div>
    );
  }

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
          <p className="text-muted-foreground mt-1">Edit your role-based profile details and sync them to your users collection.</p>
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
                <p className="text-sm text-muted-foreground" style={{ textTransform: "capitalize" }}>{roleLabel} · Bengaluru, IN</p>
                <p className="text-sm text-muted-foreground">{displayEmail}</p>
              </div>
              <Button variant="outline" className="mt-2 w-full max-w-[180px]" onClick={handleSignout}>Sign out</Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-card">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-0 gap-3 pb-4">
                <div>
                  <CardTitle className="text-xl">Role-based profile</CardTitle>
                  <CardDescription>Choose role and edit profile details from database.</CardDescription>
                </div>
                <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName">Full name</Label>
                    <Input id="fullName" value={displayName} disabled />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={displayEmail} disabled />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Role</Label>
                    <Select
                      value={selectedRole || ""}
                      onValueChange={(v) => setSelectedRole(v as UserRole)}
                      disabled={isRoleLocked}
                    >
                      <SelectTrigger className="bg-card">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mentor">Mentor</SelectItem>
                        <SelectItem value="learner">Learner</SelectItem>
                      </SelectContent>
                    </Select>
                    {isRoleLocked && (
                      <p className="text-xs text-muted-foreground">Role is fixed once set.</p>
                    )}
                  </div>
                  {selectedRole === "mentor" ? (
                    <>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label>Skills (comma separated)</Label>
                        <Input
                          value={skills}
                          onChange={(e) => setSkills(e.target.value)}
                          placeholder="React, Node.js, Python"
                          className="bg-card"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Years of experience</Label>
                        <Input
                          type="number"
                          min="0"
                          max="60"
                          value={yearsOfExperience}
                          onChange={(e) => setYearsOfExperience(e.target.value)}
                          className="bg-card"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Certifications (comma separated)</Label>
                        <Input
                          value={certifications}
                          onChange={(e) => setCertifications(e.target.value)}
                          placeholder="AWS SAA, Google ACE"
                          className="bg-card"
                        />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label>Bio</Label>
                        <Textarea
                          rows={4}
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="Tell learners about your teaching style and expertise."
                          className="bg-card"
                        />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label>Portfolio links (comma separated)</Label>
                        <Input
                          value={portfolioLinks}
                          onChange={(e) => setPortfolioLinks(e.target.value)}
                          placeholder="https://portfolio.com, https://github.com/username"
                          className="bg-card"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label>Learning interests (comma separated)</Label>
                        <Input
                          value={interests}
                          onChange={(e) => setInterests(e.target.value)}
                          placeholder="Web Development, Machine Learning, Data Science"
                          className="bg-card"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Preferred languages (comma separated)</Label>
                        <Input
                          value={languages}
                          onChange={(e) => setLanguages(e.target.value)}
                          placeholder="JavaScript, Python"
                          className="bg-card"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Experience level</Label>
                        <Select
                          value={experienceLevel}
                          onValueChange={(v) => setExperienceLevel(v as typeof experienceLevel)}
                        >
                          <SelectTrigger className="bg-card">
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-0 gap-3 pb-4">
                <div>
                  <CardTitle className="text-lg">Quick actions</CardTitle>
                  <CardDescription>Manage session and save profile changes.</CardDescription>
                </div>
                <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save now"}</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={handleSignout}>Sign out</Button>
                  <Button variant="outline" onClick={() => navigate("/landing")}>Back to landing</Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Role-specific details are loaded from the users collection and saved through the authenticated profile API.
                </p>
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

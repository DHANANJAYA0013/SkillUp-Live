import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import signupBackground from "@/Assets/background_signup.webp";

const SignupPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"learner" | "mentor">("learner");

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#f3f7ff,_transparent_45%),radial-gradient(circle_at_bottom,_#f9fbff,_transparent_40%)]">
      <div
        className="absolute inset-0 lg:hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${signupBackground})` }}
      />
      <div className="absolute inset-0 lg:hidden bg-black/35" />

      <div className="relative z-10 grid min-h-screen lg:grid-cols-2">
        {/* Left panel */}
        <div
          className="hidden lg:flex items-center justify-center p-10 xl:p-16 bg-cover bg-right bg-no-repeat relative"
          style={{ backgroundImage: `url(${signupBackground})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/20 to-black/10" />
          <div className="max-w-md text-primary-foreground space-y-6 relative z-10 lg:ml-48 xl:ml-64">
            <div className="flex items-center gap-2">
              <div className="w-11 h-11 rounded-2xl bg-primary-foreground/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold tracking-tight">SkillBridge</span>
            </div>
            <div className="space-y-3">
              <p className="inline-flex items-center gap-2 text-sm font-medium uppercase tracking-[0.14em] bg-primary-foreground/15 text-primary-foreground px-3 py-1 rounded-full w-fit">
                Join the community
              </p>
              <h2 className="text-3xl xl:text-4xl font-bold leading-tight">Start your learning journey today.</h2>
              <p className="text-primary-foreground/80">Learn with mentors, build projects, and grow faster with a supportive cohort.</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 lg:px-16">
          <Card className="w-full max-w-md shadow-2xl border-border/60 bg-background/65 backdrop-blur-sm lg:bg-card lg:backdrop-blur-none">
            <CardHeader className="space-y-4">
              <div className="lg:hidden flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold text-foreground">SkillBridge</span>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-2xl">Create an account</CardTitle>
                  <CardDescription>Get started with SkillBridge for free.</CardDescription>
                </div>
                <Link to="/">
                  <Button variant="ghost" size="sm">Home</Button>
                </Link>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Role toggle */}
              <div className="flex rounded-lg bg-muted p-1">
                <button
                  onClick={() => setRole("learner")}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${role === "learner" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
                >
                  I want to Learn
                </button>
                <button
                  onClick={() => setRole("mentor")}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${role === "mentor" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
                >
                  I want to Teach
                </button>
              </div>

              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="John Doe" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@skillbridge.io" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative mt-1.5">
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="Min 8 characters" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div><br />
                <Link to="/admin-dashboard">
                  <Button type="submit" className="w-full gradient-primary text-primary-foreground border-0 shadow-md hover:opacity-90">
                    Create Account
                  </Button>
                </Link>
              </form>

              <div className="rounded-lg bg-muted/60 border border-border/60 p-3 text-sm text-muted-foreground">
                By creating an account you agree to receive updates about your learning progress and reminders.
              </div>

              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{" "}
                <Link to="/signin" className="text-primary font-medium hover:underline">Sign in</Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;

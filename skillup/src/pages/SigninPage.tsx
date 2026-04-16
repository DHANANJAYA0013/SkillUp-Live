import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import signinBackground from "@/Assets/background_signin.webp";

const SigninPage = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative min-h-screen bg-background flex overflow-hidden">
      <div
        className="absolute inset-0 lg:hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${signinBackground})` }}
      />
      <div className="absolute inset-0 lg:hidden bg-black/35" />

      <div
        className="hidden lg:flex lg:w-1/2 items-center justify-center p-10 xl:p-12 bg-cover bg-center bg-no-repeat relative z-10"
        style={{ backgroundImage: `url(${signinBackground})` }}
      >
        <div className="absolute inset-0 bg-black/35" />
        <div className="max-w-md text-primary-foreground relative z-10">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">SkillBridge</span>
          </div>
          <h2 className="text-3xl xl:text-4xl font-bold mb-4">Welcome back</h2>
          <p className="text-primary-foreground/70">Continue your learning journey. Your mentors and sessions are waiting for you.</p>
        </div>
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 lg:px-16">
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
                <CardTitle className="text-2xl">Sign in</CardTitle>
                <CardDescription>Enter your credentials to continue.</CardDescription>
              </div>
              <Link to="/">
                <Button variant="ghost" size="sm">Back to Home</Button>
              </Link>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="john@example.com" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1.5">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded border-border" />
                  <span className="text-muted-foreground">Remember me</span>
                </label>
                <a href="#" className="text-sm text-primary hover:underline">Forgot password?</a>
              </div><br />
              <Link to="/mentor-dashboard">
                <Button type="submit" className="w-full gradient-primary text-primary-foreground border-0 shadow-md hover:opacity-90">
                  Sign in
                </Button>
              </Link>
            </form>
            <p className="text-sm text-center text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary font-medium hover:underline">Sign up</Link>
            </p>
            <p className="text-sm text-center text-muted-foreground">
              Admin?{" "}
              <Link to="/admin-login" className="text-primary font-medium hover:underline">Use admin login</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SigninPage;

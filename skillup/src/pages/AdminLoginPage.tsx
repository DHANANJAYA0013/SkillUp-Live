import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ADMIN_EMAIL = "admin@skillbridge.io";
const ADMIN_PASSWORD = "admin123";

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      localStorage.setItem("isAdminAuthenticated", "true");
      navigate("/admin-dashboard", { replace: true });
      return;
    }

    setError("Invalid admin credentials. Please try again.");
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f1f5ff,_transparent_45%),radial-gradient(circle_at_bottom_right,_#eef9ff,_transparent_40%)] flex items-center justify-center px-4 sm:px-6 py-10">
      <Card className="w-full max-w-md border-border/60 shadow-2xl bg-card/95 backdrop-blur-sm">
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary text-primary-foreground grid place-items-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-2xl">Admin Login</CardTitle>
              <CardDescription>Sign in to access admin controls.</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="admin-email">Admin Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@skillbridge.io"
                className="mt-1.5"
                required
              />
            </div>

            <div>
              <Label htmlFor="admin-password">Password</Label>
              <div className="relative mt-1.5">
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter admin password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            )}

            <Button type="submit" className="w-full gradient-primary text-primary-foreground border-0 hover:opacity-90">
              Enter Admin Dashboard
            </Button>
          </form>

          <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            Demo credentials: <span className="font-medium text-foreground">admin@skillbridge.io</span> / <span className="font-medium text-foreground">admin123</span>
          </div>

          <Link to="/signin" className="block text-center text-sm text-primary hover:underline">
            Back to user sign in
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLoginPage;
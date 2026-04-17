import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, AlertCircle, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { API_BASE } from "@/features/authsystem/config";

const ADMIN_AUTH_TOKEN_KEY = "skillup_admin_token";

const parseApiResponse = async (res: Response) => {
  const raw = await res.text();
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return raw;
  }
};

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [adminCode, setAdminCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (localStorage.getItem(ADMIN_AUTH_TOKEN_KEY)) {
      navigate("/admin-dashboard", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const normalizedCode = adminCode.trim();
    if (!/^\d{6}$/.test(normalizedCode)) {
      setError("Admin code must be exactly 6 digits.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: normalizedCode }),
      });

      const data = await parseApiResponse(res);
      if (!res.ok) {
        setError("Invalid Admin Code");
        return;
      }

      const token = data && typeof data === "object" && "token" in data ? String((data as { token: unknown }).token) : "";
      if (!token) {
        setError("Invalid Admin Code");
        return;
      }

      localStorage.setItem(ADMIN_AUTH_TOKEN_KEY, token);
      localStorage.setItem("isAdminAuthenticated", "true");
      navigate("/admin-dashboard", { replace: true });
    } catch {
      setError("Unable to verify admin code right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f1f5ff,_transparent_45%),radial-gradient(circle_at_bottom_right,_#eef9ff,_transparent_40%)] flex items-center justify-center px-3 sm:px-4 md:px-6 py-8 sm:py-10 md:py-12">
      <Card className="w-full max-w-md border-border/60 shadow-2xl bg-card/95 backdrop-blur-sm">
        <CardHeader className="space-y-3 sm:space-y-4 px-4 sm:px-6 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl gradient-primary text-primary-foreground grid place-items-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-xl sm:text-2xl md:text-3xl truncate">Admin Login</CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">Enter the 6-digit admin access code.</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 px-4 sm:px-6 pb-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="admin-code" className="text-xs sm:text-sm">Admin Access Code</Label>
              <Input
                id="admin-code"
                type="password"
                value={adminCode}
                onChange={(event) => setAdminCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Enter 6-digit code"
                inputMode="numeric"
                maxLength={6}
                className="mt-2 text-sm sm:text-base h-10 sm:h-11"
                required
              />
            </div>

            {error && (
              <p className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-xs sm:text-sm text-destructive">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </p>
            )}

            <Button
              type="submit"
              className="w-full gradient-primary text-primary-foreground border-0 hover:opacity-90 h-10 sm:h-11 text-sm sm:text-base"
              disabled={submitting}
            >
              {submitting ? "Verifying..." : "Enter Admin Dashboard"}
            </Button>
          </form>

          <div className="rounded-lg bg-muted/50 p-3 text-xs sm:text-sm text-muted-foreground flex items-start gap-2 space-y-1">
            <KeyRound className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Only admins with the correct 6-digit code can access the control panel.</span>
          </div>

          <Link to="/landing" className="block text-center text-xs sm:text-sm text-primary hover:underline mt-4 transition-colors">
            Back to landing page
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLoginPage;
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../AuthContext";
import { API_BASE } from "../config";
import type { AuthUser } from "../types";

export default function AuthHomePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, token } = useAuth();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (!user?.profileCompleted) {
      navigate("/auth/onboard", { replace: true });
    }
  }, [user, navigate]);

  const loadUsers = async () => {
    if (!token) return;
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
        title: "Cannot fetch users",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Auth Feature Home</CardTitle>
            <CardDescription>This flow was migrated from authsystem into skillup.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role || "Not set"}</p>
            <p><strong>Profile Complete:</strong> {String(user.profileCompleted)}</p>
            <p className="text-sm text-muted-foreground">Account actions were moved to the main Profile page.</p>
          </CardContent>
        </Card>

        {users.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Registered users</CardTitle>
              <CardDescription>Total: {users.length}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.map((item) => (
                  <div key={item._id} className="rounded-md border p-3">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.email}</p>
                    <p className="text-xs text-muted-foreground">role: {item.role || "pending"}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

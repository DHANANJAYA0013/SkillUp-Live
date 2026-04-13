import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Bell, CheckCircle2, MessageCircle, ShieldCheck } from "lucide-react";

const notifications = [
  {
    id: 1,
    title: "Session confirmed",
    message: "Your 1:1 with Alex Carter is confirmed for tomorrow at 4:00 PM.",
    time: "2h ago",
    icon: CheckCircle2,
    tone: "success",
  },
  {
    id: 2,
    title: "New message",
    message: "Alex sent you prep materials for the system design session.",
    time: "5h ago",
    icon: MessageCircle,
    tone: "info",
  },
  {
    id: 3,
    title: "Payout processed",
    message: "Your latest teaching payout has been processed to your account.",
    time: "Yesterday",
    icon: ShieldCheck,
    tone: "neutral",
  },
];

const toneMap: Record<string, string> = {
  success: "bg-green-50 text-green-700 border-green-100",
  info: "bg-blue-50 text-blue-700 border-blue-100",
  neutral: "bg-muted text-foreground border-border",
};

const NotificationsPage = () => {
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
            <Button variant="outline" size="sm" className="w-full sm:w-auto">Mark all as read</Button>
            <Button size="sm" className="gradient-primary text-primary-foreground border-0 w-full sm:w-auto">Notification settings</Button>
          </div>
        </div>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <div>
                <CardTitle className="text-lg">Recent</CardTitle>
                <CardDescription>Latest updates across your sessions.</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">4 new</Badge>
          </CardHeader>
          <Separator />
          <CardContent className="divide-y divide-border p-0">
            {notifications.map((item) => {
              const Icon = item.icon;
              const tone = toneMap[item.tone] ?? toneMap.neutral;
              return (
                <div key={item.id} className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-4 sm:p-5">
                  <div className={`h-10 w-10 rounded-lg border flex items-center justify-center ${tone}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                      <span className="text-xs text-muted-foreground">{item.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{item.message}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="self-start sm:self-center">Mark read</Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default NotificationsPage;

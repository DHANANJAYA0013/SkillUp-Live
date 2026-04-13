import { Users, BookOpen, Calendar, DollarSign, TrendingUp, TrendingDown, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { mentors, sessions } from "@/data/mockData";

const adminStats = [
  { label: "Total Users", value: "1,248", icon: Users, change: "+8%", up: true, color: "bg-primary/10 text-primary" },
  { label: "Total Mentors", value: "326", icon: BookOpen, change: "+12%", up: true, color: "bg-secondary/10 text-secondary" },
  { label: "Total Sessions", value: "5,432", icon: Calendar, change: "+5%", up: true, color: "bg-accent/10 text-accent" },
  { label: "Revenue", value: "$42,500", icon: DollarSign, change: "-2%", up: false, color: "bg-secondary/10 text-secondary" },
];

const pendingMentors = [
  { id: "p1", name: "Tom Baker", email: "tom@email.com", skill: "DevOps", date: "2026-03-15" },
  { id: "p2", name: "Nina Patel", email: "nina@email.com", skill: "Graphic Design", date: "2026-03-14" },
  { id: "p3", name: "Carlos Ruiz", email: "carlos@email.com", skill: "Spanish", date: "2026-03-14" },
];

const AdminDashboardPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Platform overview and management</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {adminStats.map((stat) => (
            <div key={stat.label} className="bg-card rounded-xl shadow-card border border-border/50 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <span className={`text-xs font-medium flex items-center gap-0.5 ${stat.up ? "text-secondary" : "text-destructive"}`}>
                  {stat.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {stat.change}
                </span>
              </div>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Mentor Approvals */}
          <div className="bg-card rounded-xl shadow-card border border-border/50 p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Pending Mentor Approvals</h2>
            <div className="space-y-3">
              {pendingMentors.map((m) => (
                <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="text-sm font-medium text-foreground">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.email} · {m.skill}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button className="p-1.5 rounded-md text-secondary hover:bg-secondary/10 transition-colors">
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <button className="p-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors">
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Sessions */}
          <div className="bg-card rounded-xl shadow-card border border-border/50 p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Recent Sessions</h2>
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="text-sm font-medium text-foreground">{session.skillTitle}</p>
                    <p className="text-xs text-muted-foreground">{session.mentorName} · {session.date}</p>
                  </div>
                  <Badge variant={session.status === "upcoming" ? "default" : session.status === "completed" ? "secondary" : "destructive"} className={session.status === "upcoming" ? "gradient-primary text-primary-foreground border-0" : ""}>
                    {session.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* User Management */}
          <div className="lg:col-span-2 bg-card rounded-xl shadow-card border border-border/50 overflow-hidden">
            <div className="p-6 border-b border-border/50">
              <h2 className="text-lg font-semibold text-foreground">User Management</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3 uppercase tracking-wider">User</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3 uppercase tracking-wider">Role</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3 uppercase tracking-wider">Status</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3 uppercase tracking-wider">Sessions</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {mentors.slice(0, 4).map((m) => (
                    <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={m.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                          <div>
                            <p className="text-sm font-medium text-foreground">{m.name}</p>
                            <p className="text-xs text-muted-foreground">{m.title}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4"><Badge variant="outline" className="text-xs">Mentor</Badge></td>
                      <td className="px-6 py-4"><Badge className="bg-secondary/10 text-secondary border-0 text-xs">Active</Badge></td>
                      <td className="px-6 py-4 text-sm text-foreground">{m.sessionsCompleted}</td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" className="text-xs">View Details</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;

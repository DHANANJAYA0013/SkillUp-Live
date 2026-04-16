import { useState } from "react";
import { Plus, Edit, Trash2, DollarSign, Users, BookOpen, Calendar, Star, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { skills, sessions, reviews } from "@/data/mockData";

const mentorStats = [
  { label: "Total Earnings", value: "₹4,250", icon: DollarSign, color: "bg-secondary/10 text-secondary" },
  { label: "Total Students", value: "48", icon: Users, color: "bg-primary/10 text-primary" },
  { label: "Active Skills", value: "6", icon: BookOpen, color: "bg-accent/10 text-accent" },
  { label: "Avg Rating", value: "4.8", icon: Star, color: "bg-accent/10 text-accent" },
];

const MentorDashboardPage = () => {
  const [activeTab, setActiveTab] = useState<"skills" | "bookings" | "earnings">("skills");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Mentor Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your skills, bookings, and earnings</p>
          </div>
          <Button className="gradient-primary text-primary-foreground border-0 gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" /> Add Skill
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {mentorStats.map((stat) => (
            <div key={stat.label} className="bg-card rounded-xl shadow-card border border-border/50 p-5">
              <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted p-1 rounded-lg mb-6 w-full sm:w-fit overflow-x-auto">
          {(["skills", "bookings", "earnings"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-all ${
                activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "skills" && (
          <div className="bg-card rounded-xl shadow-card border border-border/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3 uppercase tracking-wider">Skill</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3 uppercase tracking-wider">Category</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3 uppercase tracking-wider">Price</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3 uppercase tracking-wider">Students</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3 uppercase tracking-wider">Rating</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {skills.slice(0, 4).map((skill) => (
                    <tr key={skill.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-foreground">{skill.title}</td>
                      <td className="px-6 py-4"><Badge variant="outline" className="text-xs">{skill.category}</Badge></td>
                      <td className="px-6 py-4 text-sm text-foreground">₹{skill.price}/hr</td>
                      <td className="px-6 py-4 text-sm text-foreground">{skill.studentsEnrolled}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-accent text-accent" />
                          <span className="text-sm">{skill.rating}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "bookings" && (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div key={session.id} className="bg-card rounded-xl shadow-card border border-border/50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-medium text-foreground">{session.skillTitle}</h3>
                  <p className="text-sm text-muted-foreground">{session.date} at {session.time}</p>
                </div>
                <Badge variant={session.status === "upcoming" ? "default" : session.status === "completed" ? "secondary" : "destructive"} className={session.status === "upcoming" ? "gradient-primary text-primary-foreground border-0" : ""}>
                  {session.status}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {activeTab === "earnings" && (
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl shadow-card border border-border/50 p-6">
              <h3 className="font-semibold text-foreground mb-4">Earnings This Month</h3>
              <div className="text-4xl font-bold text-foreground mb-2">₹1,850</div>
              <p className="text-sm text-secondary flex items-center gap-1"><TrendingUp className="w-4 h-4" /> +12% from last month</p>
            </div>
            <div className="bg-card rounded-xl shadow-card border border-border/50 p-6">
              <h3 className="font-semibold text-foreground mb-4">Recent Reviews</h3>
              <div className="space-y-3">
                {reviews.slice(0, 2).map((r) => (
                  <div key={r.id} className="flex gap-2">
                    <img src={r.userAvatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                    <div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-accent text-accent" />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{r.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorDashboardPage;

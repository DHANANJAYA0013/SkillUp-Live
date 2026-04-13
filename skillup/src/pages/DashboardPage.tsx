import { Calendar, Clock, BookOpen, TrendingUp, Star, ArrowRight, Video } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import MentorCard from "@/components/MentorCard";
import { mentors, sessions, skills } from "@/data/mockData";

const statCards = [
  { label: "Upcoming Sessions", value: "3", icon: Calendar, color: "bg-primary/10 text-primary" },
  { label: "Hours Learned", value: "24", icon: Clock, color: "bg-secondary/10 text-secondary" },
  { label: "Skills Enrolled", value: "5", icon: BookOpen, color: "bg-accent/10 text-accent" },
  { label: "Completion Rate", value: "87%", icon: TrendingUp, color: "bg-primary/10 text-primary" },
];

const DashboardPage = () => {
  const upcomingSessions = sessions.filter((s) => s.status === "upcoming");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Welcome back, Alex! 👋</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your learning journey</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {statCards.map((stat) => (
            <div key={stat.label} className="bg-card rounded-xl shadow-card border border-border/50 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upcoming sessions */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Upcoming Sessions</h2>
              <Link to="#" className="text-sm text-primary hover:underline">View all</Link>
            </div>
            <div className="space-y-3">
              {upcomingSessions.map((session) => (
                <div key={session.id} className="bg-card rounded-xl shadow-card border border-border/50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Video className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-foreground">{session.skillTitle}</h3>
                      <p className="text-sm text-muted-foreground truncate">with {session.mentorName}</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-sm font-medium text-foreground">{session.date}</div>
                    <div className="text-xs text-muted-foreground">{session.time}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recommended mentors */}
            <div className="mt-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">Recommended Mentors</h2>
                <Link to="/mentors" className="text-sm text-primary hover:underline">View all</Link>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {mentors.slice(0, 2).map((mentor) => (
                  <MentorCard key={mentor.id} mentor={mentor} />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-card rounded-xl shadow-card border border-border/50 p-6">
              <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link to="/mentors">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <BookOpen className="w-4 h-4" /> Find a Mentor
                  </Button>
                </Link>
                <Link to="/skills">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Star className="w-4 h-4" /> Browse Skills
                  </Button>
                </Link>
              </div>
            </div>

            <div className="bg-card rounded-xl shadow-card border border-border/50 p-6">
              <h3 className="font-semibold text-foreground mb-4">Recently Added Skills</h3>
              <div className="space-y-3">
                {skills.slice(0, 3).map((skill) => (
                  <div key={skill.id} className="flex items-center gap-3">
                    <img src={skill.mentorAvatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{skill.title}</p>
                      <p className="text-xs text-muted-foreground">${skill.price}/hr</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

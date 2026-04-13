import { FormEvent, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Send, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { mentors } from "@/data/mockData";

interface Message {
  id: number;
  author: "You" | "Mentor";
  text: string;
  timestamp: string;
}

const starterMessages: Message[] = [
  { id: 1, author: "Mentor", text: "Hey there! Thanks for reaching out. How can I help with your next milestone?", timestamp: "Today · 9:12 AM" },
  { id: 2, author: "You", text: "I need guidance on structuring a system design doc for a payments feature.", timestamp: "Today · 9:15 AM" },
  { id: 3, author: "Mentor", text: "Great topic. Share your current outline and we can iterate together.", timestamp: "Today · 9:17 AM" },
];

const ChatPage = () => {
  const { id } = useParams();
  const mentor = useMemo(() => mentors.find((m) => m.id === id), [id]);
  const [messages, setMessages] = useState<Message[]>(starterMessages);
  const [draft, setDraft] = useState("");

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;

    const next: Message = {
      id: messages.length + 1,
      author: "You",
      text,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, next]);
    setDraft("");
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,#f3f5ff,transparent_30%),radial-gradient(circle_at_80%_0,#f6f7ff,transparent_28%),#f9fafb]">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to={mentor ? `/mentors/${mentor.id}` : "/mentors"} className="inline-flex items-center gap-1 hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <span>•</span>
          <span>Direct messages</span>
        </div>

        <Card className="shadow-card border-border/60">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={mentor?.avatar}
                alt={mentor?.name ?? "Mentor"}
                className="w-14 h-14 rounded-xl object-cover border border-border/70"
              />
              <div>
                <CardTitle className="text-lg sm:text-xl">
                  {mentor?.name ?? "Mentor"}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <span>{mentor?.title ?? "Experienced mentor"}</span>
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </Badge>
                </CardDescription>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Typically replies in under 2 hours
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="bg-muted/40 border border-border/70 rounded-xl p-3 sm:p-4 h-[55vh] min-h-[320px] max-h-[520px] overflow-y-auto space-y-4">
              {messages.map((msg) => {
                const isMe = msg.author === "You";
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[92%] sm:max-w-[80%] rounded-2xl px-4 py-3 shadow-sm border ${
                        isMe
                          ? "bg-primary text-primary-foreground border-primary/40"
                          : "bg-card text-foreground border-border/70"
                      }`}
                    >
                      <div className="text-xs uppercase tracking-wide opacity-80 mb-1">{msg.author}</div>
                      <div className="text-sm leading-relaxed">{msg.text}</div>
                      <div className={`text-[11px] mt-2 ${isMe ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                        {msg.timestamp}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSend} className="flex flex-col sm:flex-row gap-3">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write a message..."
                className="bg-white"
              />
              <Button type="submit" className="gradient-primary text-primary-foreground border-0 px-5 gap-2 hover:opacity-90 w-full sm:w-auto">
                <Send className="w-4 h-4" /> Send
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ChatPage;

export interface Mentor {
  id: string;
  name: string;
  avatar: string;
  title: string;
  bio: string;
  skills: string[];
  rating: number;
  reviewCount: number;
  sessionsCompleted: number;
  pricePerSession: number;
  experience: string;
  availability: string[];
  category: string;
}

export interface Skill {
  id: string;
  title: string;
  description: string;
  category: string;
  mentorName: string;
  mentorAvatar: string;
  price: number;
  rating: number;
  reviewCount: number;
  studentsEnrolled: number;
  level: "Beginner" | "Intermediate" | "Advanced";
}

export interface Session {
  id: string;
  skillTitle: string;
  mentorName: string;
  date: string;
  time: string;
  status: "upcoming" | "completed" | "cancelled";
  meetingLink?: string;
}

export interface Review {
  id: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  date: string;
}

export const mentors: Mentor[] = [
  {
    id: "1",
    name: "Sarah Chen",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    title: "Senior Full-Stack Developer",
    bio: "10+ years building scalable web applications. Passionate about mentoring the next generation of developers.",
    skills: ["React", "Node.js", "TypeScript", "System Design"],
    rating: 4.9,
    reviewCount: 127,
    sessionsCompleted: 340,
    pricePerSession: 75,
    experience: "10 years",
    availability: ["Mon", "Wed", "Fri"],
    category: "Programming",
  },
  {
    id: "2",
    name: "Marcus Johnson",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    title: "UI/UX Design Lead",
    bio: "Design leader at a Fortune 500 company. Specializing in user-centered design and design systems.",
    skills: ["Figma", "UI Design", "UX Research", "Prototyping"],
    rating: 4.8,
    reviewCount: 98,
    sessionsCompleted: 215,
    pricePerSession: 65,
    experience: "8 years",
    availability: ["Tue", "Thu", "Sat"],
    category: "Design",
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    title: "Data Science Manager",
    bio: "Leading data teams at top tech companies. Expert in ML, AI, and data-driven decision making.",
    skills: ["Python", "Machine Learning", "Data Analysis", "SQL"],
    rating: 4.9,
    reviewCount: 156,
    sessionsCompleted: 420,
    pricePerSession: 85,
    experience: "12 years",
    availability: ["Mon", "Tue", "Thu"],
    category: "Data Science",
  },
  {
    id: "4",
    name: "Alex Kim",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    title: "Music Producer & Instructor",
    bio: "Grammy-nominated producer teaching music production, mixing, and mastering techniques.",
    skills: ["Music Production", "Mixing", "Ableton Live", "Sound Design"],
    rating: 4.7,
    reviewCount: 72,
    sessionsCompleted: 180,
    pricePerSession: 55,
    experience: "7 years",
    availability: ["Wed", "Fri", "Sun"],
    category: "Music",
  },
  {
    id: "5",
    name: "Priya Sharma",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
    title: "Cloud Architecture Specialist",
    bio: "AWS certified architect helping teams build reliable, scalable cloud infrastructure.",
    skills: ["AWS", "Docker", "Kubernetes", "Terraform"],
    rating: 4.8,
    reviewCount: 89,
    sessionsCompleted: 250,
    pricePerSession: 90,
    experience: "9 years",
    availability: ["Mon", "Wed", "Sat"],
    category: "Programming",
  },
  {
    id: "6",
    name: "James Williams",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    title: "Language & Communication Coach",
    bio: "Polyglot and certified language instructor specializing in English, Spanish, and Mandarin.",
    skills: ["English", "Spanish", "Mandarin", "Public Speaking"],
    rating: 4.6,
    reviewCount: 63,
    sessionsCompleted: 150,
    pricePerSession: 45,
    experience: "6 years",
    availability: ["Tue", "Thu", "Fri"],
    category: "Language",
  },
];

export const skills: Skill[] = [
  {
    id: "1", title: "React Masterclass", description: "Learn React from fundamentals to advanced patterns including hooks, context, and performance optimization.",
    category: "Programming", mentorName: "Sarah Chen", mentorAvatar: mentors[0].avatar, price: 75, rating: 4.9, reviewCount: 89, studentsEnrolled: 234, level: "Intermediate",
  },
  {
    id: "2", title: "UI/UX Design Fundamentals", description: "Master the principles of user-centered design, from wireframing to high-fidelity prototypes.",
    category: "Design", mentorName: "Marcus Johnson", mentorAvatar: mentors[1].avatar, price: 65, rating: 4.8, reviewCount: 67, studentsEnrolled: 189, level: "Beginner",
  },
  {
    id: "3", title: "Machine Learning with Python", description: "Build ML models from scratch. Covers regression, classification, neural networks, and deployment.",
    category: "Data Science", mentorName: "Emily Rodriguez", mentorAvatar: mentors[2].avatar, price: 85, rating: 4.9, reviewCount: 112, studentsEnrolled: 310, level: "Advanced",
  },
  {
    id: "4", title: "Music Production in Ableton", description: "Create professional-quality tracks. Learn arrangement, mixing, mastering, and sound design.",
    category: "Music", mentorName: "Alex Kim", mentorAvatar: mentors[3].avatar, price: 55, rating: 4.7, reviewCount: 45, studentsEnrolled: 120, level: "Beginner",
  },
  {
    id: "5", title: "AWS Cloud Architecture", description: "Design and deploy scalable cloud solutions. Prepare for AWS Solutions Architect certification.",
    category: "Programming", mentorName: "Priya Sharma", mentorAvatar: mentors[4].avatar, price: 90, rating: 4.8, reviewCount: 78, studentsEnrolled: 175, level: "Advanced",
  },
  {
    id: "6", title: "Business English Mastery", description: "Improve your professional English communication for meetings, presentations, and negotiations.",
    category: "Language", mentorName: "James Williams", mentorAvatar: mentors[5].avatar, price: 45, rating: 4.6, reviewCount: 34, studentsEnrolled: 95, level: "Intermediate",
  },
];

export const sessions: Session[] = [
  { id: "1", skillTitle: "React Masterclass", mentorName: "Sarah Chen", date: "2026-03-18", time: "10:00 AM", status: "upcoming", meetingLink: "https://meet.example.com/abc" },
  { id: "2", skillTitle: "UI/UX Design Fundamentals", mentorName: "Marcus Johnson", date: "2026-03-20", time: "2:00 PM", status: "upcoming", meetingLink: "https://meet.example.com/def" },
  { id: "3", skillTitle: "Machine Learning with Python", mentorName: "Emily Rodriguez", date: "2026-03-14", time: "11:00 AM", status: "completed" },
  { id: "4", skillTitle: "Music Production in Ableton", mentorName: "Alex Kim", date: "2026-03-22", time: "4:00 PM", status: "upcoming" },
];

export const reviews: Review[] = [
  { id: "1", userName: "David Park", userAvatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=80&h=80&fit=crop&crop=face", rating: 5, comment: "Sarah is an incredible mentor. She explains complex React concepts in a way that's easy to understand.", date: "2026-03-10" },
  { id: "2", userName: "Lisa Thompson", userAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face", rating: 5, comment: "The session was well-structured and packed with practical examples. Highly recommend!", date: "2026-03-08" },
  { id: "3", userName: "Mike Chen", userAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=face", rating: 4, comment: "Great session! Learned a lot about system design patterns. Would book again.", date: "2026-03-05" },
];

export const categories = ["All", "Programming", "Design", "Data Science", "Music", "Language", "Business"];

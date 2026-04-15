export type UserRole = "learner" | "teacher" | null;

export interface LearnerProfile {
  learningInterests: string[];
  preferredLanguages: string[];
  experienceLevel: "" | "beginner" | "intermediate" | "advanced";
}

export interface TeacherProfile {
  skills: string[];
  yearsOfExperience: number | null;
  bio: string;
  certifications: string[];
  portfolioLinks: string[];
}

export interface AuthUser {
  _id: string;
  googleId?: string;
  githubId?: string;
  name: string;
  email: string;
  avatar?: string | null;
  role: UserRole;
  profileCompleted: boolean;
  profile?: Partial<LearnerProfile & TeacherProfile>;
  createdAt?: string;
}

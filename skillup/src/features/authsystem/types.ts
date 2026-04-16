export type UserRole = "learner" | "mentor" | null;

export interface LearnerProfile {
  learningInterests: string[];
  preferredLanguages: string[];
  experienceLevel: "" | "beginner" | "intermediate" | "advanced";
}

export interface MentorProfile {
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
  followers?: string[];
  following?: string[];
  profileCompleted: boolean;
  profile?: Partial<LearnerProfile & MentorProfile>;
  createdAt?: string;
}

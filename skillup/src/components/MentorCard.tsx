import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface Mentor {
  id: string;
  name: string;
  avatar: string;
  title: string;
  skills: string[];
  rating: number;
  reviewCount: number;
}

interface MentorCardProps {
  mentor: Mentor;
  disableNavigation?: boolean;
}

const MentorCard = ({ mentor, disableNavigation = false }: MentorCardProps) => {
  const cardContent = (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.25 }}
      className="group relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/60 p-5 shadow-[0_20px_50px_rgba(91,80,171,0.12)] backdrop-blur-xl"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/20 to-indigo-100/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden="true" />
      <div className="absolute inset-0 rounded-[1.75rem] ring-1 ring-inset ring-white/70" aria-hidden="true" />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={mentor.avatar}
                alt={mentor.name}
                className="h-14 w-14 rounded-2xl object-cover ring-4 ring-white/80 shadow-sm"
              />
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-emerald-500 shadow-sm">
                <BadgeCheck className="h-2.5 w-2.5 text-white" />
              </span>
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-foreground transition-colors group-hover:text-indigo-700">
                {mentor.name}
              </h3>
              <p className="truncate text-sm text-muted-foreground">{mentor.title}</p>
            </div>
          </div>

          <div className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
            Online
          </div>
        </div>

        <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted-foreground">
          Learn directly from mentors who bring structured guidance, practical feedback, and a collaborative learning style.
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {mentor.skills.slice(0, 3).map((skill) => (
            <Badge key={skill} variant="secondary" className="rounded-full border-0 bg-white/75 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
              {skill}
            </Badge>
          ))}
          {mentor.skills.length > 3 && (
            <Badge variant="secondary" className="rounded-full border-0 bg-white/75 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
              +{mentor.skills.length - 3}
            </Badge>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-accent text-accent" />
            <span className="text-sm font-medium text-foreground">{mentor.rating}</span>
            <span className="text-xs text-muted-foreground">({mentor.reviewCount})</span>
          </div>

          <div className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 transition-transform duration-300 group-hover:translate-x-0.5">
            View Profile
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (disableNavigation) {
    return <div className="group block">{cardContent}</div>;
  }

  return (
    <Link to={`/mentors/${mentor.id}`} className="group block">
      {cardContent}
    </Link>
  );
};

export default MentorCard;

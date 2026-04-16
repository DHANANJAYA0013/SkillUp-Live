import { Star } from "lucide-react";
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
  pricePerSession: number;
}

interface MentorCardProps {
  mentor: Mentor;
}

const MentorCard = ({ mentor }: MentorCardProps) => {
  return (
    <Link to={`/mentors/${mentor.id}`} className="group block">
      <div className="bg-card rounded-xl shadow-card hover:shadow-card-hover transition-all duration-200 p-6 border border-border/50 hover:-translate-y-1">
        <div className="flex items-start gap-4">
          <img
            src={mentor.avatar}
            alt={mentor.name}
            className="w-14 h-14 rounded-full object-cover ring-2 ring-border"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
              {mentor.name}
            </h3>
            <p className="text-sm text-muted-foreground truncate">{mentor.title}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {mentor.skills.slice(0, 3).map((skill) => (
            <Badge key={skill} variant="secondary" className="text-xs font-normal bg-muted text-muted-foreground border-0">
              {skill}
            </Badge>
          ))}
          {mentor.skills.length > 3 && (
            <Badge variant="secondary" className="text-xs font-normal bg-muted text-muted-foreground border-0">
              +{mentor.skills.length - 3}
            </Badge>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-accent text-accent" />
            <span className="text-sm font-medium text-foreground">{mentor.rating}</span>
            <span className="text-xs text-muted-foreground">({mentor.reviewCount})</span>
          </div>
          <div className="text-sm">
            <span className="font-semibold text-foreground">₹{mentor.pricePerSession}</span>
            <span className="text-muted-foreground">/session</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default MentorCard;

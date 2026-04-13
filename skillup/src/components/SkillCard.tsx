import { Star, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Skill } from "@/data/mockData";

interface SkillCardProps {
  skill: Skill;
}

const SkillCard = ({ skill }: SkillCardProps) => {
  const levelColor = {
    Beginner: "bg-secondary/10 text-secondary",
    Intermediate: "bg-primary/10 text-primary",
    Advanced: "bg-accent/10 text-accent",
  }[skill.level];

  return (
    <div className="bg-card rounded-xl shadow-card hover:shadow-card-hover transition-all duration-200 border border-border/50 hover:-translate-y-1 overflow-hidden group cursor-pointer">
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <Badge className={`${levelColor} border-0 text-xs font-medium`}>{skill.level}</Badge>
          <Badge variant="outline" className="text-xs font-normal">{skill.category}</Badge>
        </div>

        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
          {skill.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{skill.description}</p>

        <div className="flex items-center gap-3 mb-4">
          <img src={skill.mentorAvatar} alt={skill.mentorName} className="w-7 h-7 rounded-full object-cover" />
          <span className="text-sm text-muted-foreground">{skill.mentorName}</span>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-accent text-accent" />
              <span className="text-sm font-medium">{skill.rating}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              <span className="text-xs">{skill.studentsEnrolled}</span>
            </div>
          </div>
          <span className="font-semibold text-foreground">₹{skill.price}<span className="text-xs text-muted-foreground font-normal">/hr</span></span>
        </div>
      </div>
    </div>
  );
};

export default SkillCard;

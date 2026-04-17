import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navLinks = [
  { label: "Find Mentors", path: "/mentors" },
  { label: "Sessions", path: "/sessions" },
  // { label: "Dashboard", path: "/dashboard" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isProfile = location.pathname.startsWith("/profile");

  const handleBrandClick = () => {
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" onClick={handleBrandClick} className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-base sm:text-lg font-bold text-foreground truncate">SkillBridge</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  location.pathname === link.path
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/profile" className="flex items-center" aria-label="Profile">
              <Avatar
                className={`h-10 w-10 border ${isProfile ? "border-primary ring-2 ring-primary/30" : "border-transparent"}`}
              >
                <AvatarImage
                  src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=200&q=80"
                  alt="Profile"
                />
                <AvatarFallback>DH</AvatarFallback>
              </Avatar>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 text-foreground shrink-0" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card px-3 sm:px-4 py-4 space-y-2 max-h-[calc(100vh-4rem)] overflow-y-auto">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileOpen(false)}
              className={`block px-4 py-2.5 rounded-lg text-sm font-medium ${
                location.pathname === link.path
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/profile"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium ${
              isProfile ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
            }`}
          >
            <Avatar className="h-9 w-9 border border-border">
              <AvatarImage
                src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=200&q=80"
                alt="Profile"
              />
              <AvatarFallback>DH</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span>Profile</span>
              <span className="text-xs text-muted-foreground">View and update</span>
            </div>
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

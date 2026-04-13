// const Footer = () => {
//   return (
//     <footer className="border-t border-border/70 bg-card/40 mt-16">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-border/50 flex flex-col items-center justify-center gap-2 text-center">
//         <p className="text-sm text-muted-foreground">© 2026 SkillBridge. All rights reserved.</p>
//         <p className="text-xs text-muted-foreground">Crafted for focused live learning experiences.</p>
//       </div>
//     </footer>
//   );
// };

// export default Footer;
const Footer = () => {
  return (
    <footer className="border-t border-border/70 bg-card/40 mt-12 sm:mt-16">
      <div className="sm:hidden max-w-7xl mx-auto px-4 py-5">
        <div className="text-center">
          <h2 className="text-base font-semibold">SkillBridge</h2>
          <p className="text-xs text-muted-foreground mt-1">Focused live learning for mentors and learners.</p>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="hover:text-foreground cursor-pointer">Courses</span>
          <span className="hover:text-foreground cursor-pointer">Sessions</span>
          <span className="hover:text-foreground cursor-pointer">Docs</span>
          <span className="hover:text-foreground cursor-pointer">Support</span>
          <span className="hover:text-foreground cursor-pointer">GitHub</span>
        </div>
      </div>

      <div className="hidden sm:grid max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 grid-cols-2 lg:grid-cols-4 gap-8">

        {/* Brand */}
        <div>
          <h2 className="text-lg font-semibold">SkillBridge</h2>
          <p className="text-sm text-muted-foreground mt-2">
            A platform designed for focused live learning experiences and
            collaborative skill development.
          </p>
        </div>

        {/* Platform Links */}
        <div>
          <h3 className="font-medium mb-3">Platform</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="hover:text-foreground cursor-pointer">Explore Courses</li>
            <li className="hover:text-foreground cursor-pointer">Live Sessions</li>
            <li className="hover:text-foreground cursor-pointer">Community</li>
          </ul>
        </div>

        {/* Resources */}
        <div>
          <h3 className="font-medium mb-3">Resources</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="hover:text-foreground cursor-pointer">Documentation</li>
            <li className="hover:text-foreground cursor-pointer">Support</li>
            <li className="hover:text-foreground cursor-pointer">FAQs</li>
          </ul>
        </div>

        {/* Social */}
        <div>
          <h3 className="font-medium mb-3">Connect</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="hover:text-foreground cursor-pointer">GitHub</li>
            <li className="hover:text-foreground cursor-pointer">LinkedIn</li>
            <li className="hover:text-foreground cursor-pointer">Twitter</li>
          </ul>
        </div>

      </div>

      {/* Bottom */}
      <div className="border-t border-border/50 px-4 py-4 sm:py-6 text-center text-[11px] sm:text-sm text-muted-foreground">
        © 2026 SkillBridge. Crafted for focused live learning experiences.
      </div>
    </footer>
  );
};

export default Footer;
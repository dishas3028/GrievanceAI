import { Link } from "react-router-dom";
import { Shield, Github, Twitter, Mail, Heart } from "lucide-react";

const Footer = () => {
  const links = {
    Platform: [
      { label: "Submit Grievance", to: "/submit-grievance" },
      { label: "Citizen Dashboard", to: "/citizen-dashboard" },
      { label: "Track Status", to: "/citizen-dashboard" },
      { label: "Authority Portal", to: "/authority-dashboard" },
    ],
    Resources: [
      { label: "How It Works", to: "/" },
      { label: "FAQ", to: "/" },
      { label: "API Documentation", to: "/" },
      { label: "Community Guidelines", to: "/" },
    ],
    Legal: [
      { label: "Privacy Policy", to: "/" },
      { label: "Terms of Service", to: "/" },
      { label: "Data Protection", to: "/" },
      { label: "Accessibility", to: "/" },
    ],
  };

  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto max-w-7xl px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="font-display text-lg font-bold text-background">GrievanceAI</span>
                <p className="text-[10px] text-background/50 leading-none">Public Intelligence System</p>
              </div>
            </Link>
            <p className="text-sm text-background/50 leading-relaxed mb-4">
              India's first AI-powered civic grievance platform. Making governance transparent, responsive, and citizen-centric.
            </p>
            <div className="flex gap-3">
              {[Twitter, Github, Mail].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-lg bg-background/10 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([title, items]) => (
            <div key={title}>
              <h4 className="font-display font-semibold text-sm text-background mb-4 uppercase tracking-wider">{title}</h4>
              <ul className="space-y-2.5">
                {items.map(item => (
                  <li key={item.label}>
                    <Link to={item.to} className="text-sm text-background/50 hover:text-primary transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-background/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-background/40">
            © {new Date().getFullYear()} GrievanceAI. All rights reserved. Made with{" "}
            <Heart className="h-3 w-3 inline text-red-400 fill-red-400" /> for India.
          </p>
          <p className="text-xs text-background/40">
            Government of India • Digital India Initiative
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

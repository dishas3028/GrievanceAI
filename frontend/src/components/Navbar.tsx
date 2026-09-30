import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Shield, Menu, X, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleDashboard = () => {
    if (!user) return navigate("/login");
    const routes = { citizen: "/citizen-dashboard", authority: "/authority-dashboard", admin: "/admin-dashboard" };
    navigate(routes[user.role]);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? "bg-hero/95 backdrop-blur-md shadow-lg"
          : "bg-transparent"
        }`}
    >
      <div className="container mx-auto flex items-center justify-between py-4 px-4">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="h-7 w-7 text-primary" />
          <div>
            <span className="font-display text-lg font-bold text-hero-foreground">
              GrievanceAI
            </span>
            <span className="hidden sm:block text-[10px] text-hero-muted leading-none">
              Public Intelligence System
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground"
          >
            <Shield className="h-4 w-4" />
            Home
          </Link>

          {isAuthenticated ? (
            <>
              <Button
                variant="ghost"
                onClick={handleDashboard}
                className="text-sm font-medium text-hero-muted hover:text-hero-foreground hover:bg-hero-lighter rounded-lg px-4 py-2"
              >
                Dashboard
              </Button>
              <Button
                variant="ghost"
                onClick={() => { logout(); navigate("/"); }}
                className="text-sm font-medium text-hero-muted hover:text-hero-foreground hover:bg-hero-lighter rounded-lg px-4 py-2"
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 text-sm font-medium text-hero-muted hover:text-hero-foreground hover:bg-hero-lighter rounded-lg px-4 py-2"
                >
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
              </Link>
              <Link to="/signup">
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 text-sm font-medium text-hero-muted hover:text-hero-foreground hover:bg-hero-lighter rounded-lg px-4 py-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-hero-foreground"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-hero/95 backdrop-blur-md border-t border-hero-lighter px-4 pb-4 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-3 text-sm text-hero-foreground font-medium"
            onClick={() => setMobileOpen(false)}
          >
            <Shield className="h-4 w-4" /> Home
          </Link>

          {isAuthenticated ? (
            <>
              <button
                className="w-full text-left flex items-center gap-2 px-4 py-3 text-sm text-hero-muted hover:text-hero-foreground"
                onClick={() => { setMobileOpen(false); handleDashboard(); }}
              >
                Dashboard
              </button>
              <button
                className="w-full text-left flex items-center gap-2 px-4 py-3 text-sm text-hero-muted hover:text-hero-foreground"
                onClick={() => { setMobileOpen(false); logout(); navigate("/"); }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-3 text-sm text-hero-muted hover:text-hero-foreground"
                onClick={() => setMobileOpen(false)}
              >
                <LogIn className="h-4 w-4" /> Login
              </Link>
              <Link
                to="/signup"
                className="flex items-center gap-2 px-4 py-3 text-sm text-hero-muted hover:text-hero-foreground"
                onClick={() => setMobileOpen(false)}
              >
                <UserPlus className="h-4 w-4" /> Sign Up
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;

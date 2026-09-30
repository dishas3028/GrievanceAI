import { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
    allowedRoles?: UserRole[];
    children?: React.ReactNode;
}

const ProtectedRoute = ({ allowedRoles, children }: ProtectedRouteProps) => {
    const { user, isAuthenticated, isInitializing } = useAuth();
    const [isWaitTimeOver, setIsWaitTimeOver] = useState(false);

    // Minor delay to prevent layout shift / flash
    useEffect(() => {
        const timer = setTimeout(() => setIsWaitTimeOver(true), 200);
        return () => clearTimeout(timer);
    }, []);

    if (isInitializing || !isWaitTimeOver) {
        return (
            <div className="min-h-screen bg-[#0f111a] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-white/40 font-black uppercase tracking-[0.3em] text-[10px]">Neural Link Establishing...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        // Redirect to their appropriate dashboard if they try to access a wrong one
        const dashboardMap = {
            citizen: "/citizen-dashboard",
            authority: "/authority-dashboard",
            admin: "/admin-dashboard"
        };
        return <Navigate to={dashboardMap[user.role] as string} replace />;
    }

    return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;

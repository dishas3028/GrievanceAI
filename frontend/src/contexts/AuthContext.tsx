import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type UserRole = "citizen" | "authority" | "admin";

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    department?: string;
    phone?: string;
    avatar?: string;
    points?: number;
    createdAt: string;
}

export interface TimelineEntry {
    status: string;
    message: string;
    timestamp: string;
}

export interface AuthorityUpdate {
    _id: string;
    message: string;
    timestamp: string;
    reactions: {
        emoji: string;
        userId: string;
    }[];
}

export interface Grievance {
    id: string;
    title: string;
    description: string;
    category: string;
    location: string;
    district: string;
    locationArea?: string;
    accuracy?: number;
    coordinates?: {
        latitude: number;
        longitude: number;
    };
    status: "submitted" | "pending" | "in-progress" | "resolved" | "rejected";
    priority: "low" | "medium" | "high" | "critical";
    urgencyScore: number;
    sentiment: "positive" | "neutral" | "negative" | "critical";
    clusterId?: number;
    keywords: string[];
    citizenId: string;
    citizenName: string;
    citizenPhone: string;
    assignedTo?: string;
    assignedDepartment?: string;
    resolutionNotes?: string;
    feedback?: string;
    rating?: number;
    timeline?: TimelineEntry[];
    pointsAwarded?: boolean;
    authorityUpdates?: AuthorityUpdate[];
    createdAt: string;
    updatedAt: string;
    resolvedAt?: string;
}

export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "error";
    read: boolean;
    createdAt: string;
}

interface AuthContextType {
    user: User | null;
    users: User[];
    grievances: Grievance[];
    notifications: Notification[];
    isAuthenticated: boolean;
    login: (email: string, password: string, role?: UserRole) => Promise<{ success: boolean; message: string }>;
    signup: (userData: Omit<User, "id" | "createdAt"> & { password: string }) => Promise<{ success: boolean; message: string }>;
    logout: () => void;
    submitGrievance: (grievance: any) => Promise<void>;
    updateGrievanceStatus: (id: string, status: Grievance["status"], notes?: string) => Promise<void>;
    updateGrievanceFeedback: (id: string, rating: number, feedback: string) => Promise<void>;
    markNotificationRead: (id: string) => void;
    addUser: (userData: Omit<User, "id" | "createdAt"> & { password: string }) => Promise<{ success: boolean; message: string }>;
    deleteUser: (id: string) => void;
    getDepartmentGrievances: () => Grievance[];
    getUnreadNotifications: () => Notification[];
    analyzeGrievancePreview: (description: string) => Promise<any>;
    addAuthorityUpdate: (id: string, message: string) => Promise<void>;
    reactToUpdate: (id: string, updateId: string, emoji: string) => Promise<void>;
    awardPoints: (grievanceId: string, points: 10 | 25) => Promise<boolean>;
    refreshData: () => Promise<void>;
    isInitializing: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// No client-side AI analysis anymore - handled by backend ML service

// Seed data
const seedGrievances: Grievance[] = [
    {
        id: "GRV-001",
        title: "Massive pothole on Main Street causing accidents",
        description: "There is a dangerous pothole near the school zone on Main Street. Two accidents have already occurred this week. Children are at risk while crossing.",
        category: "Roads & Infrastructure",
        location: "Main Street, Sector 12",
        district: "Central Delhi",
        status: "in-progress",
        priority: "critical",
        urgencyScore: 9,
        sentiment: "critical",
        keywords: ["accident", "danger", "children", "school"],
        citizenId: "user-citizen-1",
        citizenName: "Sara Sah",
        citizenPhone: "+91 98765 43210",
        assignedTo: "user-authority-1",
        assignedDepartment: "Roads & Infrastructure",
        createdAt: "2026-02-10T10:30:00Z",
        updatedAt: "2026-02-12T14:00:00Z",
    },
    {
        id: "GRV-002",
        title: "No water supply for 3 days in Block C",
        description: "Residents of Block C, Sector 15 have been without water supply for 3 consecutive days. Multiple families are affected including elderly people.",
        category: "Water Supply",
        location: "Block C, Sector 15",
        district: "South Delhi",
        status: "pending",
        priority: "high",
        urgencyScore: 7,
        sentiment: "negative",
        keywords: ["water", "supply"],
        citizenId: "user-citizen-1",
        citizenName: "Sara Sah",
        citizenPhone: "+91 98765 43210",
        assignedDepartment: "Water Supply",
        createdAt: "2026-02-12T08:15:00Z",
        updatedAt: "2026-02-12T08:15:00Z",
    },
    {
        id: "GRV-003",
        title: "Street lights not working in entire colony",
        description: "All street lights in Rajpur Colony have been off for a week. It's very unsafe for women and children at night.",
        category: "Electricity",
        location: "Rajpur Colony",
        district: "East Delhi",
        status: "submitted",
        priority: "medium",
        urgencyScore: 5,
        sentiment: "negative",
        keywords: ["unsafe", "children"],
        citizenId: "user-citizen-2",
        citizenName: "Amit Kumar",
        citizenPhone: "+91 87654 32100",
        assignedDepartment: "Electricity",
        createdAt: "2026-02-13T16:45:00Z",
        updatedAt: "2026-02-13T16:45:00Z",
    },
    {
        id: "GRV-004",
        title: "Garbage not collected for 2 weeks",
        description: "The garbage collection in Nehru Nagar has been stopped for nearly 2 weeks. The smell is terrible and causing health issues. Mosquitoes breeding everywhere.",
        category: "Sanitation",
        location: "Nehru Nagar, Ward 7",
        district: "West Delhi",
        status: "resolved",
        priority: "medium",
        urgencyScore: 5,
        sentiment: "negative",
        keywords: ["terrible", "problem"],
        citizenId: "user-citizen-1",
        citizenName: "Sara Sah",
        citizenPhone: "+91 98765 43210",
        assignedTo: "user-authority-2",
        assignedDepartment: "Sanitation",
        resolutionNotes: "Garbage collection team deployed. Area cleaned and regular schedule restored.",
        createdAt: "2026-02-05T09:00:00Z",
        updatedAt: "2026-02-08T11:30:00Z",
        resolvedAt: "2026-02-08T11:30:00Z",
    },
    {
        id: "GRV-005",
        title: "Broken water pipeline flooding the road",
        description: "A major water pipeline has burst near Gandhi Circle causing severe flooding. Vehicles cannot pass. Water is being wasted in huge quantities.",
        category: "Water Supply",
        location: "Gandhi Circle",
        district: "North Delhi",
        status: "in-progress",
        priority: "critical",
        urgencyScore: 8,
        sentiment: "critical",
        keywords: ["flood", "danger"],
        citizenId: "user-citizen-2",
        citizenName: "Amit Kumar",
        citizenPhone: "+91 87654 32100",
        assignedTo: "user-authority-1",
        assignedDepartment: "Water Supply",
        createdAt: "2026-02-14T07:00:00Z",
        updatedAt: "2026-02-14T10:00:00Z",
    },
    {
        id: "GRV-006",
        title: "Bus service discontinued without notice",
        description: "Route 42 bus service from Dwarka to Connaught Place has been discontinued without any public notice. Thousands of daily commuters are stranded.",
        category: "Public Transport",
        location: "Dwarka Sector 21",
        district: "South West Delhi",
        status: "pending",
        priority: "medium",
        urgencyScore: 5,
        sentiment: "neutral",
        keywords: ["problem"],
        citizenId: "user-citizen-3",
        citizenName: "Priya Sharma",
        citizenPhone: "+91 76543 21000",
        assignedDepartment: "Public Transport",
        createdAt: "2026-02-13T12:00:00Z",
        updatedAt: "2026-02-13T12:00:00Z",
    },
];

const seedNotifications: Notification[] = [
    {
        id: "notif-1",
        userId: "user-citizen-1",
        title: "Grievance Update",
        message: "Your grievance GRV-001 is now being worked on by the Roads department.",
        type: "info",
        read: false,
        createdAt: "2026-02-12T14:00:00Z",
    },
    {
        id: "notif-2",
        userId: "user-citizen-1",
        title: "Grievance Resolved",
        message: "Your grievance GRV-004 regarding garbage collection has been resolved.",
        type: "success",
        read: true,
        createdAt: "2026-02-08T11:30:00Z",
    },
    {
        id: "notif-3",
        userId: "user-authority-1",
        title: "New Assignment",
        message: "Critical grievance GRV-005 has been assigned to you.",
        type: "warning",
        read: false,
        createdAt: "2026-02-14T07:30:00Z",
    },
    {
        id: "notif-4",
        userId: "user-admin-1",
        title: "System Alert",
        message: "3 critical grievances detected in the last 24 hours. Immediate action recommended.",
        type: "error",
        read: false,
        createdAt: "2026-02-14T08:00:00Z",
    },
];

const seedUsers: (User & { password: string })[] = [
    {
        id: "user-citizen-1",
        name: "Sara Sah",
        email: "sara@citizen.com",
        password: "Password123!",
        role: "citizen",
        phone: "9876543210",
        createdAt: "2026-01-15T10:00:00Z",
    },
    {
        id: "user-authority-1",
        name: "Rajesh Gupta",
        email: "rajesh@authority.com",
        password: "Password123!",
        role: "authority",
        department: "Roads & Infrastructure",
        phone: "9988776655",
        createdAt: "2026-01-10T10:00:00Z",
    },
    {
        id: "user-admin-1",
        name: "Admin User",
        email: "admin@grievanceai.com",
        password: "Password123!",
        role: "admin",
        createdAt: "2026-01-01T10:00:00Z",
    },
];

// Backend API base URL
export const API_URL = 'http://localhost:5002/api';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isInitializing, setIsInitializing] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [grievances, setGrievances] = useState<Grievance[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [token, setToken] = useState<string | null>(null);

    // Initial load logic
    useEffect(() => {
        const savedUser = localStorage.getItem("grievanceai_user");
        const savedToken = localStorage.getItem("grievanceai_token");

        if (savedUser && savedToken) {
            try {
                const parsed = JSON.parse(savedUser);
                setUser({ ...parsed, id: parsed.id || parsed._id });
                setToken(savedToken);
            } catch (err) {
                console.error("Session restore failed", err);
            }
        }
        setIsInitializing(false);
    }, []);

    const normalizeId = (obj: any) => {
        if (!obj) return obj;
        if (Array.isArray(obj)) return obj.map(normalizeId);
        if (typeof obj !== 'object') return obj;
        const newObj = { ...obj, id: obj.id || obj._id };
        return newObj;
    };

    useEffect(() => {
        if (user && token) {
            fetchGrievances();
            fetchNotifications();
            fetchProfile();
            if (user.role === 'admin') fetchUsers();

            // Setup real-time polling for updates
            const pollInterval = setInterval(() => {
                if (user && token) {
                    fetchGrievances();
                    fetchNotifications();
                    fetchProfile();
                    if (user?.role === 'admin') fetchUsers();
                }
            }, 15000); // 15 seconds

            return () => clearInterval(pollInterval);
        }
    }, [user?.id, token]);

    const fetchProfile = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/auth/profile`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const normalizedUser = normalizeId(data);
                setUser(normalizedUser);
                localStorage.setItem("grievanceai_user", JSON.stringify(normalizedUser));
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
    };

    const fetchGrievances = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/grievances${user?.role === 'authority' ? `?department=${user.department}` : ''}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setGrievances(normalizeId(data));
            } else {
                console.error("Grievances response is not an array:", data);
                // Keep existing grievances or set to empty if just starting
                if (grievances.length === 0) setGrievances([]);
            }
        } catch (error) {
            console.error("Error fetching grievances:", error);
        }
    };

    const fetchNotifications = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/notifications`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setNotifications(normalizeId(data));
            } else {
                console.error("Notifications response is not an array:", data);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    const fetchUsers = async () => {
        if (user?.role !== 'admin' || !token) return;
        try {
            const res = await fetch(`${API_URL}/auth/users`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setUsers(normalizeId(data));
            } else {
                console.error("Users response is not an array:", data);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const login = async (email: string, password: string, role?: UserRole) => {
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, role })
            });
            const data = await res.json();
            if (data.success) {
                const normalizedUser = normalizeId(data.user);
                setToken(data.token);
                setUser(normalizedUser);
                localStorage.setItem("grievanceai_token", data.token);
                localStorage.setItem("grievanceai_user", JSON.stringify(normalizedUser));
                return { success: true, message: "Login successful" };
            }
            return { success: false, message: data.message };
        } catch (error) {
            return { success: false, message: "Connection error" };
        }
    };

    const signup = async (userData: any) => {
        try {
            const res = await fetch(`${API_URL}/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData)
            });
            const data = await res.json();
            if (data.success) {
                const normalizedUser = normalizeId(data.user);
                setToken(data.token);
                setUser(normalizedUser);
                localStorage.setItem("grievanceai_token", data.token);
                localStorage.setItem("grievanceai_user", JSON.stringify(normalizedUser));
                return { success: true, message: "Account created successfully" };
            }
            return { success: false, message: data.message };
        } catch (error) {
            return { success: false, message: "Connection error" };
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem("grievanceai_user");
        localStorage.removeItem("grievanceai_token");
    };

    const submitGrievance = async (grievanceData: any) => {
        if (!user || !token) return;

        try {
            let body;
            let headers: any = { "Authorization": `Bearer ${token}` };

            if (grievanceData instanceof FormData) {
                body = grievanceData;
                // Don't set Content-Type for FormData, browser will do it with boundary
            } else {
                body = JSON.stringify({
                    ...grievanceData,
                    citizenName: user.name,
                    citizenPhone: user.phone
                });
                headers["Content-Type"] = "application/json";
            }

            const res = await fetch(`${API_URL}/grievances`, {
                method: "POST",
                headers,
                body
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || 'Submission failed');
            }
            const data = await res.json();
            setGrievances(prev => [normalizeId(data), ...prev]);
            fetchNotifications(); // Refresh notifications
        } catch (error: any) {
            console.error("Error submitting grievance:", error);
            throw error;
        }
    };

    const updateGrievanceStatus = async (id: string, status: Grievance["status"], notes?: string) => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/grievances/${id}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ status, resolutionNotes: notes })
            });
            const data = normalizeId(await res.json());
            setGrievances(prev => prev.map(g => (g.id === id || (g as any)._id === id) ? data : g));
            fetchNotifications();
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const updateGrievanceFeedback = async (id: string, rating: number, feedback: string) => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/grievances/${id}/feedback`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ rating, feedback })
            });
            if (!res.ok) throw new Error('Failed to submit feedback');
            const data = normalizeId(await res.json());
            setGrievances(prev => prev.map(g => (g.id === id || (g as any)._id === id) ? data : g));
        } catch (error) {
            console.error("Error submitting feedback:", error);
            throw error;
        }
    };

    const markNotificationRead = async (id: string) => {
        if (!token) return;
        try {
            await fetch(`${API_URL}/notifications/${id}/read`, {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => n.id === id || (n as any)._id === id ? { ...n, read: true } : n));
        } catch (error) {
            console.error("Error marking notification read:", error);
        }
    };

    const addUser = async (userData: any) => {
        try {
            const headers: any = { "Content-Type": "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;

            const res = await fetch(`${API_URL}/auth/signup`, {
                method: "POST",
                headers,
                body: JSON.stringify(userData)
            });
            const data = await res.json();
            if (data.success) {
                if (user?.role === 'admin') fetchUsers();
                return { success: true, message: "Authority Access Granted" };
            }
            return { success: false, message: data.message };
        } catch (error) {
            return { success: false, message: "Connection error" };
        }
    };

    const deleteUser = async (id: string) => {
        if (!token || user?.role !== 'admin') return;
        try {
            const res = await fetch(`${API_URL}/auth/users/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                setUsers(prev => prev.filter(u => u.id !== id && (u as any)._id !== id));
            }
        } catch (error) {
            console.error("Error deleting user:", error);
        }
    };

    const getDepartmentGrievances = () => {
        if (user?.role === 'authority' && user.department) {
            // Filter by department if user is authority-based
            return grievances.filter(g =>
                (g.assignedDepartment && g.assignedDepartment.toLowerCase() === user.department.toLowerCase()) ||
                (g.category && g.category.toLowerCase() === user.department.toLowerCase())
            );
        }
        return grievances;
    };

    const getUnreadNotifications = () => notifications.filter(n => !n.read);

    const analyzeGrievancePreview = async (description: string) => {
        if (!token) return null;
        try {
            const res = await fetch(`${API_URL}/grievances/analyze-preview`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ description })
            });
            if (!res.ok) return null;
            return await res.json();
        } catch (error) {
            console.error("Error analyzing preview:", error);
            return null;
        }
    };

    const addAuthorityUpdate = async (id: string, message: string) => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/grievances/${id}/updates`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ message })
            });
            if (res.ok) await fetchGrievances();
        } catch (error) {
            console.error("Error adding authority update:", error);
        }
    };

    const reactToUpdate = async (id: string, updateId: string, emoji: string) => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/grievances/${id}/updates/${updateId}/react`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ emoji })
            });
            if (res.ok) await fetchGrievances();
        } catch (error) {
            console.error("Error reacting to update:", error);
        }
    };

    const awardPoints = async (grievanceId: string, points: 10 | 25) => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/grievances/${grievanceId}/award-points`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ points })
            });
            if (res.ok) {
                const data = await res.json();
                // Update grievance in state to mark points as awarded
                setGrievances(prev => prev.map(g => (g.id === grievanceId || (g as any)._id === grievanceId) ? normalizeId(data.grievance) : g));
                fetchNotifications();
                return true;
            }
            return false;
        } catch (error) {
            console.error("Error awarding points:", error);
            return false;
        }
    };

    const refreshData = async () => {
        await Promise.all([
            fetchGrievances(),
            fetchNotifications(),
            fetchProfile(),
            user?.role === 'admin' ? fetchUsers() : Promise.resolve()
        ]);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                users,
                grievances,
                notifications,
                isAuthenticated: !!user,
                login,
                signup,
                logout,
                submitGrievance,
                updateGrievanceStatus,
                updateGrievanceFeedback,
                markNotificationRead,
                addUser,
                deleteUser,
                getDepartmentGrievances,
                getUnreadNotifications,
                analyzeGrievancePreview,
                addAuthorityUpdate,
                reactToUpdate,
                awardPoints,
                refreshData,
                isInitializing
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};

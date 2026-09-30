import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CitizenDashboard from "./pages/CitizenDashboard";
import AuthorityDashboard from "./pages/AuthorityDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import SubmitGrievance from "./pages/SubmitGrievance";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/citizen-dashboard" element={<ProtectedRoute allowedRoles={['citizen']}><CitizenDashboard /></ProtectedRoute>} />
            <Route path="/submit-grievance" element={<ProtectedRoute allowedRoles={['citizen']}><SubmitGrievance /></ProtectedRoute>} />
            <Route path="/authority-dashboard" element={<ProtectedRoute allowedRoles={['authority']}><AuthorityDashboard /></ProtectedRoute>} />
            <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

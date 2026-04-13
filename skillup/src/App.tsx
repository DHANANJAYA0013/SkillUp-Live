import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import SignupPage from "./pages/SignupPage";
import SigninPage from "./pages/SigninPage";
import MentorsPage from "./pages/MentorsPage";
import MentorProfilePage from "./pages/MentorProfilePage";
import SkillsPage from "./pages/SkillsPage";
import DashboardPage from "./pages/DashboardPage";
import TeacherDashboardPage from "./pages/TeacherDashboardPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import ProfilePage from "./pages/ProfilePage";
import NotificationsPage from "./pages/NotificationsPage";
import NotFound from "./pages/NotFound";
import ChatPage from "./pages/ChatPage";

import LiveSplashPage from "./pages/LiveSplashPage";
import LiveSessionPage from "./pages/LiveSessionPage";
import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();
const isAdminAuthenticated = () => localStorage.getItem("isAdminAuthenticated") === "true";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" forcedTheme="light" enableSystem={false}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/start-live" element={<LiveSplashPage />} />
            <Route path="/live-session" element={<LiveSessionPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/signin" element={<SigninPage />} />
            <Route path="/mentors" element={<MentorsPage />} />
            <Route path="/mentors/:id" element={<MentorProfilePage />} />
            <Route path="/skills" element={<SkillsPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/teacher-dashboard" element={<TeacherDashboardPage />} />
            <Route path="/admin-login" element={<AdminLoginPage />} />
            <Route
              path="/admin-dashboard"
              element={isAdminAuthenticated() ? <AdminDashboardPage /> : <Navigate to="/admin-login" replace />}
            />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/chat/:id" element={<ChatPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

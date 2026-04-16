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
import SessionsPage from "./pages/SessionsPage";
import DashboardPage from "./pages/DashboardPage";
import MentorDashboardPage from "./pages/MentorDashboardPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import ProfilePage from "./pages/ProfilePage";
import NotificationsPage from "./pages/NotificationsPage";
import NotFound from "./pages/NotFound";
import ChatPage from "./pages/ChatPage";

import LiveSplashPage from "./pages/LiveSplashPage";
import LiveSessionPage from "./pages/LiveSessionPage";
import ScrollToTop from "./components/ScrollToTop";
import { AuthProvider } from "./features/authsystem/AuthContext";
import { AuthGuard } from "./features/authsystem/components/AuthGuard";
import AuthLoginPage from "./features/authsystem/pages/AuthLoginPage";
import AuthGithubCallbackPage from "./features/authsystem/pages/AuthGithubCallbackPage";
import AuthRolePage from "./features/authsystem/pages/AuthRolePage";
import AuthLearnerProfilePage from "./features/authsystem/pages/AuthLearnerProfilePage";
import AuthMentorProfilePage from "./features/authsystem/pages/AuthMentorProfilePage";
import AuthHomePage from "./features/authsystem/pages/AuthHomePage";

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
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/start-live" element={<LiveSplashPage />} />
              <Route path="/live-session" element={<LiveSessionPage />} />
              <Route path="/room/:roomId" element={<LiveSessionPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/signin" element={<SigninPage />} />
              <Route path="/mentors" element={<MentorsPage />} />
              <Route path="/mentors/:id" element={<MentorProfilePage />} />
              <Route path="/sessions" element={<SessionsPage />} />
              {/* <Route path="/skills" element={<Navigate to="/sessions" replace />} /> */}
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/mentor-dashboard" element={<MentorDashboardPage />} />
              <Route path="/admin-login" element={<AdminLoginPage />} />
              <Route
                path="/admin-dashboard"
                element={isAdminAuthenticated() ? <AdminDashboardPage /> : <Navigate to="/admin-login" replace />}
              />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/chat/:id" element={<ChatPage />} />

              <Route path="/auth" element={<AuthLoginPage />} />
              {/* <Route path="/authsystem" element={<AuthLoginPage />} /> */}
              <Route path="/authsystem/onboard" element={<Navigate to="/auth/onboard" replace />} />
              <Route path="/authsystem/onboard/learner" element={<Navigate to="/auth/onboard/learner" replace />} />
              <Route path="/authsystem/onboard/mentor" element={<Navigate to="/auth/onboard/mentor" replace />} />
              <Route path="/authsystem/home" element={<Navigate to="/landing" replace />} />
              <Route path="/auth/github-callback" element={<AuthGithubCallbackPage />} />
              <Route
                path="/auth/onboard"
                element={
                  <AuthGuard>
                    <AuthRolePage />
                  </AuthGuard>
                }
              />
              <Route
                path="/auth/onboard/learner"
                element={
                  <AuthGuard>
                    <AuthLearnerProfilePage />
                  </AuthGuard>
                }
              />
              <Route
                path="/auth/onboard/mentor"
                element={
                  <AuthGuard>
                    <AuthMentorProfilePage />
                  </AuthGuard>
                }
              />
              <Route
                path="/auth/home"
                element={
                  <AuthGuard>
                    <AuthHomePage />
                  </AuthGuard>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

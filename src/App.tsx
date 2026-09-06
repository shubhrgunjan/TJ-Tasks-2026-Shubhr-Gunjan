import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPassword';
import { AppDashboard } from './pages/AppDashboard';
import { ProjectBoardPage } from './pages/ProjectBoardPage';
import { SettingsPage } from './pages/SettingsPage';
import { ChatPage } from './pages/ChatPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotificationsPage } from './pages/NotificationsPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <ProjectProvider>
            <Routes>
              {/* Public Marketing/Auth routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/signup" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* Protected Workspace routes */}
              <Route 
                path="/app" 
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/app/dashboard" replace />} />
                <Route path="dashboard" element={<AppDashboard />} />
                <Route path="projects/:projectId" element={<ProjectBoardPage />} />
                <Route path="projects/:projectId/chat" element={<ProjectBoardPage />} />
                <Route path="projects/:projectId/activity" element={<ProjectBoardPage />} />
                <Route path="projects/:projectId/members" element={<ProjectBoardPage />} />
                <Route path="chat" element={<ChatPage />} />
                <Route path="profile/:userId" element={<ProfilePage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Catch-all fallback redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ProjectProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;


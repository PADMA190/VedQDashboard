import { Routes, Route, Navigate } from 'react-router-dom';

import AuthLayout from '@/layouts/AuthLayout';
import StudentLayout from '@/layouts/StudentLayout';
import AdminLayout from '@/layouts/AdminLayout';

import LoginPage from '@/pages/auth/LoginPage';
import SignupPage from '@/pages/auth/SignupPage';

import DashboardPage from '@/pages/student/DashboardPage';
import QuizAttemptPage from '@/pages/student/QuizAttemptPage';
import AttemptResultPage from '@/pages/student/AttemptResultPage';
import AttemptsHistoryPage from '@/pages/student/AttemptsHistoryPage';
import WeakTopicsPage from '@/pages/student/WeakTopicsPage';
import LeaderboardPage from '@/pages/student/LeaderboardPage';
import ProfilePage from '@/pages/student/ProfilePage';

import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import QuizzesPage from '@/pages/admin/QuizzesPage';
import QuizFormPage from '@/pages/admin/QuizFormPage';
import QuestionsPage from '@/pages/admin/QuestionsPage';
import QuestionFormPage from '@/pages/admin/QuestionFormPage';
import BulkImportPage from '@/pages/admin/BulkImportPage';

import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import { useAuth } from '@/hooks/useAuth';

function AuthRedirector({ children }) {
  const { isAuthenticated, user, isAuthLoading } = useAuth();
  if (isAuthLoading) return null;
  if (isAuthenticated) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/'} replace />;
  }
  return children;
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route element={<AuthRedirector><AuthLayout /></AuthRedirector>}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      {/* Student app */}
      <Route
        element={
          <ProtectedRoute>
            <RoleRoute allow={['student']} fallback="/admin">
              <StudentLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/quizzes/:id/attempt" element={<QuizAttemptPage />} />
        <Route path="/attempts" element={<AttemptsHistoryPage />} />
        <Route path="/attempts/:id" element={<AttemptResultPage />} />
        <Route path="/weak-topics" element={<WeakTopicsPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Admin app */}
      <Route
        element={
          <ProtectedRoute>
            <RoleRoute allow={['admin']} fallback="/">
              <AdminLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/quizzes" element={<QuizzesPage />} />
        <Route path="/admin/quizzes/new" element={<QuizFormPage />} />
        <Route path="/admin/quizzes/:id" element={<QuizFormPage />} />
        <Route path="/admin/questions" element={<QuestionsPage />} />
        <Route path="/admin/questions/bulk" element={<BulkImportPage />} />
        <Route path="/admin/questions/new" element={<QuestionFormPage />} />
        <Route path="/admin/questions/:id" element={<QuestionFormPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;

import { useAuth } from '@/hooks/useAuth';
import AppRoutes from '@/routes/AppRoutes';
import { ToastContainer } from '@/components/common';

export default function App() {
  // Initializes the auth lifecycle: silent refresh, axios interceptor wiring,
  // logout-on-unauthorized handler. Calling it here means the entire tree is
  // mounted with auth state ready (still rendering during the silent refresh,
  // because ProtectedRoute shows a spinner while status === 'idle' | 'loading').
  useAuth();

  return (
    <>
      <AppRoutes />
      <ToastContainer />
    </>
  );
}

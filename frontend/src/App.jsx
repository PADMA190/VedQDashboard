import { useAuth } from '@/hooks/useAuth';
import AppRoutes from '@/routes/AppRoutes';
import { ToastContainer } from '@/components/common';

export default function App() {
  useAuth();

  return (
    <>
      <AppRoutes />
      <ToastContainer />
    </>
  );
}

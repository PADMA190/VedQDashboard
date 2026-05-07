import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Input, Card } from '@/components/common';
import { useAuth } from '@/hooks/useAuth';
import { useToasts } from '@/hooks/useToasts';
import styles from './AuthPages.module.scss';

export function LoginPage() {
  const { login, isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toasts = useToasts();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const next = {};
    if (!email) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email';
    if (!password) next.password = 'Password is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const user = await login({ email, password });
      const intended = location.state?.from?.pathname;
      const home = user.role === 'admin' ? '/admin' : '/';
      navigate(intended || home, { replace: true });
    } catch (err) {
      toasts.error(err?.message || 'Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className={styles.card}>
      <h1 className={styles.title}>Welcome back</h1>
      <p className={styles.subtitle}>Sign in to continue your practice.</p>

      <form noValidate onSubmit={onSubmit} className={styles.form}>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoFocus
          required
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          required
        />
        <Button type="submit" fullWidth size="lg" isLoading={submitting || isAuthLoading}>
          Sign in
        </Button>
      </form>

      <p className={styles.alt}>
        New here? <Link to="/signup">Create an account</Link>
      </p>
    </Card>
  );
}

export default LoginPage;

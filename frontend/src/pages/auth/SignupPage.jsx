import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input, Select, Card } from '@/components/common';
import { useAuth } from '@/hooks/useAuth';
import { useToasts } from '@/hooks/useToasts';
import styles from './AuthPages.module.scss';

const CLASSES = [6, 7, 8, 9, 10, 11, 12].map((c) => ({ value: String(c), label: `Class ${c}` }));

export function SignupPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const toasts = useToasts();

  const [form, setForm] = useState({ name: '', email: '', password: '', class: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Name is required';
    if (!form.email) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email';
    if (!form.password) next.password = 'Password is required';
    else if (form.password.length < 8) next.password = 'At least 8 characters';
    else if (!/[A-Z]/.test(form.password)) next.password = 'Add an uppercase letter';
    else if (!/[a-z]/.test(form.password)) next.password = 'Add a lowercase letter';
    else if (!/\d/.test(form.password)) next.password = 'Add a digit';
    if (!form.class) next.class = 'Pick your class';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        class: Number(form.class),
      });
      toasts.success('Account created — happy practicing!');
      navigate('/', { replace: true });
    } catch (err) {
      const detailMsg = err?.details?.[0]?.message;
      toasts.error(detailMsg || err?.message || 'Could not create account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className={styles.card}>
      <h1 className={styles.title}>Create your account</h1>
      <p className={styles.subtitle}>Free to start. Pick your class and we'll do the rest.</p>

      <form noValidate onSubmit={onSubmit} className={styles.form}>
        <Input
          label="Full name"
          autoComplete="name"
          value={form.name}
          onChange={update('name')}
          error={errors.name}
          autoFocus
          required
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={update('email')}
          error={errors.email}
          required
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="≥8 chars, mixed case, with a digit"
          value={form.password}
          onChange={update('password')}
          error={errors.password}
          required
        />
        <Select
          label="Class"
          value={form.class}
          onChange={update('class')}
          options={CLASSES}
          placeholder="Pick your class"
          error={errors.class}
          required
        />
        <Button type="submit" fullWidth size="lg" isLoading={submitting}>
          Create account
        </Button>
      </form>

      <p className={styles.alt}>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </Card>
  );
}

export default SignupPage;

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { adminApi, quizzesApi, unwrapApiError } from '@/api';
import { useToasts } from '@/hooks/useToasts';
import { Card, Input, Select, Button, Spinner, EmptyState, Badge } from '@/components/common';
import { QuestionPickerModal } from '@/components/admin';
import shared from './AdminPages.module.scss';
import styles from './QuizFormPage.module.scss';

const SUBJECTS = ['Maths', 'Physics', 'Chemistry', 'English', 'Biology'].map((s) => ({ value: s, label: s }));
const CLASSES = [6, 7, 8, 9, 10, 11, 12].map((c) => ({ value: String(c), label: `Class ${c}` }));

function blankForm() {
  return {
    title: '',
    description: '',
    subject: '',
    class: '',
    durationMinutes: 20,
    isPublished: false,
    questions: [], // [{ id, subject, class, topic, questionText }]
  };
}

export function QuizFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toasts = useToasts();
  const qc = useQueryClient();

  const [form, setForm] = useState(blankForm());
  const [errors, setErrors] = useState({});
  const [pickerOpen, setPickerOpen] = useState(false);

  const editingQ = useQuery({
    queryKey: ['admin', 'quiz', id],
    queryFn: () => quizzesApi.detail(id),
    enabled: isEdit,
  });

  useEffect(() => {
    if (!isEdit || !editingQ.data) return;
    const q = editingQ.data;
    setForm({
      title: q.title || '',
      description: q.description || '',
      subject: q.subject || '',
      class: q.class != null ? String(q.class) : '',
      durationMinutes: q.durationMinutes ?? 20,
      isPublished: !!q.isPublished,
      questions: (q.questions || []).map((qu) => ({
        id: String(qu._id || qu.id),
        subject: qu.subject,
        class: qu.class,
        topic: qu.topic,
        questionText: qu.questionText,
      })),
    });
  }, [isEdit, editingQ.data]);

  const update = (field) => (e) => {
    const { type, value, checked } = e.target;
    setForm((f) => ({ ...f, [field]: type === 'checkbox' ? checked : value }));
  };

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = 'Required';
    if (!form.subject) next.subject = 'Required';
    if (!form.class) next.class = 'Required';
    const dur = Number(form.durationMinutes);
    if (!Number.isFinite(dur) || dur < 1 || dur > 240) next.durationMinutes = '1–240 minutes';
    if (form.questions.length === 0) next.questions = 'At least one question is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const mutation = useMutation({
    mutationFn: (payload) =>
      isEdit ? adminApi.updateQuiz(id, payload) : adminApi.createQuiz(payload),
    onSuccess: () => {
      toasts.success(isEdit ? 'Quiz updated' : 'Quiz created');
      qc.invalidateQueries({ queryKey: ['admin', 'quizzes'] });
      qc.invalidateQueries({ queryKey: ['quizzes'] });
      qc.invalidateQueries({ queryKey: ['admin', 'quiz', id] });
      navigate('/admin/quizzes');
    },
    onError: (err) => {
      const e = unwrapApiError(err);
      toasts.error(e.details?.[0]?.message || e.message);
    },
  });

  const onSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate({
      title: form.title.trim(),
      description: form.description.trim() || '',
      subject: form.subject,
      class: Number(form.class),
      durationMinutes: Number(form.durationMinutes),
      isPublished: form.isPublished,
      questions: form.questions.map((q) => q.id),
    });
  };

  const removeQuestion = (qid) => {
    setForm((f) => ({ ...f, questions: f.questions.filter((q) => q.id !== qid) }));
  };

  if (isEdit && editingQ.isLoading) return <Spinner size="lg" />;
  if (isEdit && editingQ.isError) {
    return (
      <EmptyState
        icon="🚫"
        title="Couldn't load quiz"
        description={editingQ.error?.message || 'Try again.'}
        action={<Link to="/admin/quizzes"><Button>Back to quizzes</Button></Link>}
      />
    );
  }

  return (
    <div className={shared.page}>
      <header className={shared.head}>
        <div>
          <h1 className={shared.title}>{isEdit ? 'Edit quiz' : 'New quiz'}</h1>
          <p className={shared.subtitle}>Set the metadata, then pick questions from the bank.</p>
        </div>
      </header>

      <form onSubmit={onSubmit} noValidate>
        <Card padding="md">
          <div className={shared.formGrid}>
            <Input
              label="Title"
              value={form.title}
              onChange={update('title')}
              error={errors.title}
              required
              className={shared.formFull}
            />
            <Select label="Subject" value={form.subject} onChange={update('subject')} options={SUBJECTS} placeholder="Pick subject" error={errors.subject} required />
            <Select label="Class" value={form.class} onChange={update('class')} options={CLASSES} placeholder="Pick class" error={errors.class} required />
            <Input
              label="Duration (minutes)"
              type="number"
              min={1}
              max={240}
              value={form.durationMinutes}
              onChange={update('durationMinutes')}
              error={errors.durationMinutes}
              required
            />
            <label className={styles.publish}>
              <input type="checkbox" checked={form.isPublished} onChange={update('isPublished')} />
              <span>Published (visible to assigned students)</span>
            </label>
            <div className={shared.formFull}>
              <label className={styles.lbl}>Description (optional)</label>
              <textarea
                rows={2}
                className={styles.textarea}
                value={form.description}
                onChange={update('description')}
                placeholder="One-liner shown on the quiz card."
              />
            </div>
          </div>
        </Card>

        <Card padding="md" className={styles.qSection}>
          <header className={styles.qHead}>
            <div>
              <h2 className={styles.qTitle}>Questions <span className={styles.qCount}>({form.questions.length})</span></h2>
              {errors.questions && <span className={styles.errInline}>{errors.questions}</span>}
            </div>
            <Button type="button" variant="secondary" onClick={() => setPickerOpen(true)}>
              {form.questions.length === 0 ? '+ Pick questions' : 'Change selection'}
            </Button>
          </header>

          {form.questions.length === 0 ? (
            <p className={shared.dim}>Pick at least one question from the bank.</p>
          ) : (
            <ol className={styles.qList}>
              {form.questions.map((q, i) => (
                <li key={q.id} className={styles.qRow}>
                  <span className={styles.qIndex}>{i + 1}.</span>
                  <div className={styles.qMain}>
                    <div className={styles.qTags}>
                      <Badge tone="primary" size="sm">{q.subject}</Badge>
                      <Badge tone="neutral" size="sm">Class {q.class}</Badge>
                      <Badge tone="info" size="sm">{q.topic}</Badge>
                    </div>
                    <p className={styles.qText}>{q.questionText}</p>
                  </div>
                  <button
                    type="button"
                    aria-label="Remove question"
                    className={styles.removeBtn}
                    onClick={() => removeQuestion(q.id)}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <div className={shared.actions}>
          <Link to="/admin/quizzes"><Button variant="secondary">Cancel</Button></Link>
          <Button type="submit" isLoading={mutation.isPending}>
            {isEdit ? 'Save changes' : 'Create quiz'}
          </Button>
        </div>
      </form>

      <QuestionPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        initiallySelected={form.questions}
        defaultSubject={form.subject}
        defaultClass={form.class}
        onConfirm={(selected) => {
          setForm((f) => ({ ...f, questions: selected }));
          setPickerOpen(false);
        }}
      />
    </div>
  );
}

export default QuizFormPage;

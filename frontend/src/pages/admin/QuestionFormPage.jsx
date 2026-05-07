import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { adminApi, apiClient, unwrapApiError } from '@/api';
import { useToasts } from '@/hooks/useToasts';
import { Card, Input, Select, Button, Spinner, EmptyState } from '@/components/common';
import shared from './AdminPages.module.scss';
import styles from './QuestionFormPage.module.scss';

const SUBJECTS = ['Maths', 'Physics', 'Chemistry', 'English', 'Biology'].map((s) => ({ value: s, label: s }));
const CLASSES = [6, 7, 8, 9, 10, 11, 12].map((c) => ({ value: String(c), label: `Class ${c}` }));
const DIFFICULTIES = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];
const OPTION_KEYS = ['A', 'B', 'C', 'D'];

function blankForm() {
  return {
    subject: '',
    class: '',
    topic: '',
    difficulty: 'medium',
    questionText: '',
    options: OPTION_KEYS.map((k) => ({ key: k, text: '' })),
    correctOption: 'A',
    explanation: '',
  };
}

export function QuestionFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toasts = useToasts();
  const qc = useQueryClient();

  const [form, setForm] = useState(blankForm());
  const [errors, setErrors] = useState({});

  const editingQ = useQuery({
    queryKey: ['admin', 'question', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/admin/questions/${id}`);
      return data.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (!isEdit || !editingQ.data) return;
    const q = editingQ.data;
    setForm({
      subject: q.subject || '',
      class: q.class != null ? String(q.class) : '',
      topic: q.topic || '',
      difficulty: q.difficulty || 'medium',
      questionText: q.questionText || '',
      options: OPTION_KEYS.map((k) => {
        const found = (q.options || []).find((o) => o.key === k);
        return { key: k, text: found?.text || '' };
      }),
      correctOption: q.correctOption || 'A',
      explanation: q.explanation || '',
    });
  }, [isEdit, editingQ.data]);

  const update = (field) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
  };

  const updateOption = (key, value) => {
    setForm((f) => ({
      ...f,
      options: f.options.map((o) => (o.key === key ? { ...o, text: value } : o)),
    }));
  };

  const validate = () => {
    const next = {};
    if (!form.subject) next.subject = 'Required';
    if (!form.class) next.class = 'Required';
    if (!form.topic.trim()) next.topic = 'Required';
    if (!form.questionText.trim()) next.questionText = 'Required';
    form.options.forEach((o) => {
      if (!o.text.trim()) next[`opt-${o.key}`] = 'Option text is required';
    });
    if (!OPTION_KEYS.includes(form.correctOption)) next.correctOption = 'Required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const mutation = useMutation({
    mutationFn: (payload) =>
      isEdit ? adminApi.updateQuestion(id, payload) : adminApi.createQuestion(payload),
    onSuccess: () => {
      toasts.success(isEdit ? 'Question updated' : 'Question created');
      qc.invalidateQueries({ queryKey: ['admin', 'questions'] });
      qc.invalidateQueries({ queryKey: ['admin', 'question', id] });
      navigate('/admin/questions');
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
      subject: form.subject,
      class: Number(form.class),
      topic: form.topic.trim(),
      difficulty: form.difficulty,
      questionText: form.questionText.trim(),
      options: form.options.map((o) => ({ key: o.key, text: o.text.trim() })),
      correctOption: form.correctOption,
      explanation: form.explanation.trim() || '',
    });
  };

  if (isEdit && editingQ.isLoading) return <Spinner size="lg" />;
  if (isEdit && editingQ.isError) {
    return (
      <EmptyState
        icon="🚫"
        title="Couldn't load question"
        description={editingQ.error?.message || 'Try again.'}
        action={<Link to="/admin/questions"><Button>Back to questions</Button></Link>}
      />
    );
  }

  return (
    <div className={shared.page}>
      <header className={shared.head}>
        <div>
          <h1 className={shared.title}>{isEdit ? 'Edit question' : 'New question'}</h1>
          <p className={shared.subtitle}>
            All fields marked are required. The correct option is graded server-side.
          </p>
        </div>
      </header>

      <form onSubmit={onSubmit} noValidate>
        <Card padding="md">
          <div className={shared.formGrid}>
            <Select label="Subject" value={form.subject} onChange={update('subject')} options={SUBJECTS} placeholder="Pick subject" error={errors.subject} required />
            <Select label="Class" value={form.class} onChange={update('class')} options={CLASSES} placeholder="Pick class" error={errors.class} required />
            <Input label="Topic" value={form.topic} onChange={update('topic')} placeholder="e.g. Algebra" error={errors.topic} required />
            <Select label="Difficulty" value={form.difficulty} onChange={update('difficulty')} options={DIFFICULTIES} />
            <div className={shared.formFull}>
              <label className={styles.lbl}>Question text</label>
              <textarea
                className={styles.textarea}
                rows={3}
                value={form.questionText}
                onChange={update('questionText')}
                aria-invalid={Boolean(errors.questionText)}
              />
              {errors.questionText && <span className={styles.err}>{errors.questionText}</span>}
            </div>

            <fieldset className={`${shared.formFull} ${styles.optsField}`}>
              <legend className={styles.legend}>Options & correct answer</legend>
              {form.options.map((o) => (
                <div key={o.key} className={styles.optRow}>
                  <label className={styles.radio}>
                    <input
                      type="radio"
                      name="correctOption"
                      value={o.key}
                      checked={form.correctOption === o.key}
                      onChange={() => setForm((f) => ({ ...f, correctOption: o.key }))}
                    />
                    <span className={styles.optKey}>{o.key}</span>
                  </label>
                  <Input
                    value={o.text}
                    onChange={(e) => updateOption(o.key, e.target.value)}
                    placeholder={`Option ${o.key} text`}
                    error={errors[`opt-${o.key}`]}
                  />
                </div>
              ))}
            </fieldset>

            <div className={shared.formFull}>
              <label className={styles.lbl}>Explanation (optional)</label>
              <textarea
                className={styles.textarea}
                rows={2}
                value={form.explanation}
                onChange={update('explanation')}
                placeholder="Shown to students after they submit."
              />
            </div>
          </div>

          <div className={shared.actions}>
            <Link to="/admin/questions"><Button variant="secondary">Cancel</Button></Link>
            <Button type="submit" isLoading={mutation.isPending}>
              {isEdit ? 'Save changes' : 'Create question'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}

export default QuestionFormPage;

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { adminApi, unwrapApiError } from '@/api';
import { useToasts } from '@/hooks/useToasts';
import { useDebounce } from '@/hooks/useDebounce';
import {
  Card, CardHeader, Input, Select, Pagination, Spinner, EmptyState, Badge, Button, Modal,
} from '@/components/common';
import shared from './AdminPages.module.scss';
import styles from './QuestionsPage.module.scss';

const SUBJECTS = [
  { value: '', label: 'All subjects' },
  ...['Maths', 'Physics', 'Chemistry', 'English', 'Biology'].map((s) => ({ value: s, label: s })),
];
const CLASSES = [
  { value: '', label: 'All classes' },
  ...[6, 7, 8, 9, 10, 11, 12].map((c) => ({ value: String(c), label: `Class ${c}` })),
];
const DIFFICULTIES = [
  { value: '', label: 'Any difficulty' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];
const PAGE_LIMIT = 15;

export function QuestionsPage() {
  const toasts = useToasts();
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [classNum, setClassNum] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const debouncedSearch = useDebounce(search, 350);

  const listQ = useQuery({
    queryKey: ['admin', 'questions', { subject, classNum, difficulty, search: debouncedSearch, page }],
    queryFn: () =>
      adminApi.listQuestions({
        page,
        limit: PAGE_LIMIT,
        subject: subject || undefined,
        class: classNum || undefined,
        difficulty: difficulty || undefined,
        search: debouncedSearch || undefined,
      }),
    keepPreviousData: true,
  });

  const deleteMut = useMutation({
    mutationFn: (id) => adminApi.deleteQuestion(id),
    onSuccess: () => {
      toasts.success('Question deleted');
      qc.invalidateQueries({ queryKey: ['admin', 'questions'] });
      setConfirmDelete(null);
    },
    onError: (err) => {
      const e = unwrapApiError(err);
      toasts.error(e.details?.referencingQuizzes
        ? `Used by ${e.details.referencingQuizzes} quiz${e.details.referencingQuizzes > 1 ? 'zes' : ''} — detach first.`
        : e.message
      );
      setConfirmDelete(null);
    },
  });

  const items = listQ.data?.items || [];
  const meta = listQ.data?.meta || {};

  return (
    <div className={shared.page}>
      <header className={shared.head}>
        <div>
          <h1 className={shared.title}>Question bank</h1>
          <p className={shared.subtitle}>{meta.total ?? '—'} total questions across all subjects.</p>
        </div>
        <div className={shared.actions}>
          <Link to="/admin/questions/bulk"><Button variant="secondary">Bulk import</Button></Link>
          <Link to="/admin/questions/new"><Button>+ New question</Button></Link>
        </div>
      </header>

      <Card padding="md">
        <div className={styles.filters}>
          <Input
            placeholder="Search question text…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <Select value={subject} onChange={(e) => { setSubject(e.target.value); setPage(1); }} options={SUBJECTS} />
          <Select value={classNum} onChange={(e) => { setClassNum(e.target.value); setPage(1); }} options={CLASSES} />
          <Select value={difficulty} onChange={(e) => { setDifficulty(e.target.value); setPage(1); }} options={DIFFICULTIES} />
        </div>
      </Card>

      {listQ.isLoading ? (
        <Spinner size="lg" />
      ) : items.length === 0 ? (
        <EmptyState
          icon="🔎"
          title="No questions match"
          description="Adjust filters or import a CSV/JSON of questions to populate the bank."
          action={<Link to="/admin/questions/new"><Button>+ New question</Button></Link>}
        />
      ) : (
        <Card padding="none">
          <ul className={styles.list}>
            {items.map((q) => (
              <li key={q._id || q.id} className={styles.row}>
                <div className={styles.rowMain}>
                  <div className={styles.tags}>
                    <Badge tone="primary" size="sm">{q.subject}</Badge>
                    <Badge tone="neutral" size="sm">Class {q.class}</Badge>
                    <Badge tone="info" size="sm">{q.topic}</Badge>
                    <Badge
                      tone={q.difficulty === 'hard' ? 'danger' : q.difficulty === 'easy' ? 'success' : 'warning'}
                      size="sm"
                    >
                      {q.difficulty}
                    </Badge>
                  </div>
                  <p className={styles.qText}>{q.questionText}</p>
                  <p className={shared.dim}>Correct: <strong>{q.correctOption}</strong></p>
                </div>
                <div className={styles.rowActions}>
                  <Link to={`/admin/questions/${q._id || q.id}`}><Button variant="secondary" size="sm">Edit</Button></Link>
                  <Button variant="danger" size="sm" onClick={() => setConfirmDelete(q)}>Delete</Button>
                </div>
              </li>
            ))}
          </ul>
          <Pagination page={page} totalPages={meta.totalPages || 1} onChange={setPage} />
        </Card>
      )}

      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Delete this question?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => deleteMut.mutate(confirmDelete._id || confirmDelete.id)}
              isLoading={deleteMut.isPending}
            >
              Delete
            </Button>
          </>
        }
      >
        <p>This will permanently remove the question. Quizzes referencing it must be detached first.</p>
        {confirmDelete && <p className={shared.dim}>"{confirmDelete.questionText}"</p>}
      </Modal>
    </div>
  );
}

export default QuestionsPage;

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { quizzesApi, adminApi, unwrapApiError } from '@/api';
import { useToasts } from '@/hooks/useToasts';
import { useDebounce } from '@/hooks/useDebounce';
import {
  Card, Input, Select, Pagination, Spinner, EmptyState, Badge, Button, Modal,
} from '@/components/common';
import { AssignmentModal } from '@/components/admin';
import { formatDateTime } from '@/utils/format';
import shared from './AdminPages.module.scss';
import styles from './QuizzesPage.module.scss';

const SUBJECTS = [
  { value: '', label: 'All subjects' },
  ...['Maths', 'Physics', 'Chemistry', 'English', 'Biology'].map((s) => ({ value: s, label: s })),
];
const PAGE_LIMIT = 12;

export function QuizzesPage() {
  const toasts = useToasts();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [assigning, setAssigning] = useState(null);

  const debouncedSearch = useDebounce(search, 350);

  const listQ = useQuery({
    queryKey: ['admin', 'quizzes', { subject, search: debouncedSearch, page }],
    queryFn: () =>
      quizzesApi.list({
        page,
        limit: PAGE_LIMIT,
        subject: subject || undefined,
        search: debouncedSearch || undefined,
      }),
    keepPreviousData: true,
  });

  const deleteMut = useMutation({
    mutationFn: (id) => adminApi.deleteQuiz(id),
    onSuccess: () => {
      toasts.success('Quiz deleted');
      qc.invalidateQueries({ queryKey: ['admin', 'quizzes'] });
      qc.invalidateQueries({ queryKey: ['quizzes'] });
      setConfirmDelete(null);
    },
    onError: (err) => {
      toasts.error(unwrapApiError(err).message);
      setConfirmDelete(null);
    },
  });

  const items = listQ.data?.items || [];
  const meta = listQ.data?.meta || {};

  return (
    <div className={shared.page}>
      <header className={shared.head}>
        <div>
          <h1 className={shared.title}>Quizzes</h1>
          <p className={shared.subtitle}>{meta.total ?? '—'} quizzes — assign, edit, or publish.</p>
        </div>
        <div className={shared.actions}>
          <Link to="/admin/quizzes/new"><Button>+ New quiz</Button></Link>
        </div>
      </header>

      <Card padding="md">
        <div className={styles.filters}>
          <Input
            placeholder="Search quiz title…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <Select value={subject} onChange={(e) => { setSubject(e.target.value); setPage(1); }} options={SUBJECTS} />
        </div>
      </Card>

      {listQ.isLoading ? (
        <Spinner size="lg" />
      ) : items.length === 0 ? (
        <EmptyState
          icon="📝"
          title="No quizzes yet"
          description="Create your first quiz from the question bank."
          action={<Link to="/admin/quizzes/new"><Button>+ New quiz</Button></Link>}
        />
      ) : (
        <>
          <div className={styles.grid}>
            {items.map((q) => (
              <Card key={q.id || q._id} padding="md" className={styles.card}>
                <div className={styles.tags}>
                  <Badge tone="primary">{q.subject}</Badge>
                  <Badge tone="neutral" size="sm">Class {q.class}</Badge>
                  {q.isPublished
                    ? <Badge tone="success" size="sm">Published</Badge>
                    : <Badge tone="warning" size="sm">Draft</Badge>}
                </div>
                <h3 className={styles.title}>{q.title}</h3>
                {q.description && <p className={styles.desc}>{q.description}</p>}
                <dl className={styles.meta}>
                  <div><dt>Duration</dt><dd>{q.durationMinutes} min</dd></div>
                  <div><dt>Updated</dt><dd>{formatDateTime(q.updatedAt)}</dd></div>
                </dl>
                <div className={styles.cardActions}>
                  <Button variant="secondary" size="sm" onClick={() => setAssigning(q)}>Assign</Button>
                  <Link to={`/admin/quizzes/${q.id || q._id}`}><Button variant="secondary" size="sm">Edit</Button></Link>
                  <Button variant="danger" size="sm" onClick={() => setConfirmDelete(q)}>Delete</Button>
                </div>
              </Card>
            ))}
          </div>
          <Pagination page={page} totalPages={meta.totalPages || 1} onChange={setPage} />
        </>
      )}

      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Delete this quiz?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => deleteMut.mutate(confirmDelete.id || confirmDelete._id)}
              isLoading={deleteMut.isPending}
            >
              Delete
            </Button>
          </>
        }
      >
        <p>Past attempts on this quiz will remain in the system but the quiz itself will be removed.</p>
        {confirmDelete && <p className={shared.dim}>"{confirmDelete.title}"</p>}
      </Modal>

      <AssignmentModal
        open={Boolean(assigning)}
        quiz={assigning}
        onClose={() => setAssigning(null)}
        onAssigned={() => qc.invalidateQueries({ queryKey: ['admin', 'quizzes'] })}
      />
    </div>
  );
}

export default QuizzesPage;

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import clsx from 'clsx';

import { adminApi, unwrapApiError } from '@/api';
import { useToasts } from '@/hooks/useToasts';
import { useDebounce } from '@/hooks/useDebounce';
import { Modal, Input, Select, Button, Spinner, EmptyState, Badge } from '@/components/common';
import styles from './AssignmentModal.module.scss';

const CLASSES = [6, 7, 8, 9, 10, 11, 12];

export function AssignmentModal({ open, onClose, quiz, onAssigned }) {
  const toasts = useToasts();
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [studentIds, setStudentIds] = useState({}); // id → true
  const [classes, setClasses] = useState({}); // class → true

  const debouncedSearch = useDebounce(search, 350);

  // Reset on every open.
  useEffect(() => {
    if (open) {
      setSearch('');
      setClassFilter('');
      setStudentIds({});
      setClasses({});
    }
  }, [open]);

  const studentsQ = useQuery({
    queryKey: ['admin', 'users', { role: 'student', class: classFilter, search: debouncedSearch }],
    queryFn: () =>
      adminApi.listUsers({
        role: 'student',
        class: classFilter || undefined,
        search: debouncedSearch || undefined,
        limit: 50,
      }),
    enabled: open,
  });

  const items = studentsQ.data?.items || [];

  const toggleStudent = (id) => {
    setStudentIds((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
  };

  const toggleClass = (cls) => {
    setClasses((prev) => {
      const next = { ...prev };
      if (next[cls]) delete next[cls];
      else next[cls] = true;
      return next;
    });
  };

  const studentCount = useMemo(() => Object.keys(studentIds).length, [studentIds]);
  const classCount = useMemo(() => Object.keys(classes).length, [classes]);

  const assignMut = useMutation({
    mutationFn: () =>
      adminApi.assignQuiz(quiz.id || quiz._id, {
        studentIds: Object.keys(studentIds),
        classes: Object.keys(classes).map(Number),
      }),
    onSuccess: () => {
      toasts.success('Assignment updated');
      onAssigned?.();
      onClose();
    },
    onError: (err) => {
      toasts.error(unwrapApiError(err).message);
    },
  });

  const submit = () => {
    if (studentCount === 0 && classCount === 0) {
      toasts.warning('Pick at least one student or class.');
      return;
    }
    assignMut.mutate();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={quiz ? `Assign "${quiz.title}"` : 'Assign quiz'}
      size="lg"
      footer={
        <>
          <span className={styles.summary}>
            {studentCount} student{studentCount !== 1 && 's'} · {classCount} class{classCount !== 1 && 'es'}
          </span>
          <span style={{ flex: 1 }} />
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} isLoading={assignMut.isPending}>Assign</Button>
        </>
      }
    >
      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>By class</h4>
        <p className={styles.sectionDesc}>Pick whole classes — every student in the class gets access.</p>
        <div className={styles.chips}>
          {CLASSES.map((c) => {
            const active = Boolean(classes[c]);
            return (
              <button
                key={c}
                type="button"
                className={clsx(styles.chip, active && styles.chipActive)}
                onClick={() => toggleClass(c)}
                aria-pressed={active}
              >
                Class {c}
              </button>
            );
          })}
        </div>
      </section>

      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Or by student</h4>
        <div className={styles.filters}>
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            options={[{ value: '', label: 'Any class' }, ...CLASSES.map((c) => ({ value: String(c), label: `Class ${c}` }))]}
          />
        </div>

        {studentsQ.isLoading ? (
          <Spinner size="md" />
        ) : items.length === 0 ? (
          <EmptyState icon="🙂" title="No students match" description="Try clearing filters." />
        ) : (
          <ul className={styles.list}>
            {items.map((u) => {
              const id = u.id || u._id;
              const checked = Boolean(studentIds[id]);
              return (
                <li key={id}>
                  <label className={clsx(styles.row, checked && styles.checked)}>
                    <input type="checkbox" className={styles.cb} checked={checked} onChange={() => toggleStudent(id)} />
                    <div className={styles.rowMain}>
                      <div className={styles.who}>
                        <strong>{u.name}</strong>
                        <span className={styles.dim}>{u.email}</span>
                      </div>
                      <Badge tone="neutral" size="sm">Class {u.class ?? '—'}</Badge>
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </Modal>
  );
}

export default AssignmentModal;

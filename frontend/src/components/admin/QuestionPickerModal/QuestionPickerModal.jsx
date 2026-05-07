import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';

import { adminApi } from '@/api';
import { useDebounce } from '@/hooks/useDebounce';
import { Modal, Input, Select, Pagination, Spinner, EmptyState, Button, Badge } from '@/components/common';
import styles from './QuestionPickerModal.module.scss';

const SUBJECTS = [
  { value: '', label: 'All subjects' },
  ...['Maths', 'Physics', 'Chemistry', 'English', 'Biology'].map((s) => ({ value: s, label: s })),
];
const CLASSES = [
  { value: '', label: 'All classes' },
  ...[6, 7, 8, 9, 10, 11, 12].map((c) => ({ value: String(c), label: `Class ${c}` })),
];
const PAGE_LIMIT = 12;

/**
 * Multi-select question picker. Selection persists across pagination/filter
 * changes via a parent-managed state object (id → minimal question shape).
 */
export function QuestionPickerModal({
  open,
  onClose,
  initiallySelected = [], // array of { id, subject, class, topic, questionText }
  onConfirm,
  defaultSubject,
  defaultClass,
}) {
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState(defaultSubject || '');
  const [classNum, setClassNum] = useState(defaultClass != null ? String(defaultClass) : '');
  const [page, setPage] = useState(1);
  const [picked, setPicked] = useState(() => indexById(initiallySelected));
  const debouncedSearch = useDebounce(search, 350);

  // Reset selection when the modal is reopened with new initial set.
  useEffect(() => {
    if (open) setPicked(indexById(initiallySelected));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const listQ = useQuery({
    queryKey: ['admin', 'questions', 'picker', { subject, classNum, search: debouncedSearch, page }],
    queryFn: () =>
      adminApi.listQuestions({
        page,
        limit: PAGE_LIMIT,
        subject: subject || undefined,
        class: classNum || undefined,
        search: debouncedSearch || undefined,
      }),
    keepPreviousData: true,
    enabled: open,
  });

  const items = listQ.data?.items || [];
  const meta = listQ.data?.meta || {};

  const toggle = (q) => {
    const id = q._id || q.id;
    setPicked((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = compactShape(q);
      return next;
    });
  };

  const selectedList = useMemo(() => Object.values(picked), [picked]);
  const selectedCount = selectedList.length;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pick questions for this quiz"
      size="lg"
      footer={
        <>
          <span className={styles.count}>
            {selectedCount === 0 ? 'No questions selected' : `${selectedCount} selected`}
          </span>
          <span style={{ flex: 1 }} />
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onConfirm(selectedList)} disabled={selectedCount === 0}>
            Use these {selectedCount > 0 && `(${selectedCount})`}
          </Button>
        </>
      }
    >
      <div className={styles.filters}>
        <Input
          placeholder="Search question text…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <Select value={subject} onChange={(e) => { setSubject(e.target.value); setPage(1); }} options={SUBJECTS} />
        <Select value={classNum} onChange={(e) => { setClassNum(e.target.value); setPage(1); }} options={CLASSES} />
      </div>

      {listQ.isLoading ? (
        <Spinner size="md" />
      ) : items.length === 0 ? (
        <EmptyState icon="🔎" title="No questions match" description="Adjust filters or add new questions." />
      ) : (
        <ul className={styles.list}>
          {items.map((q) => {
            const id = q._id || q.id;
            const checked = Boolean(picked[id]);
            return (
              <li key={id}>
                <label className={clsx(styles.row, checked && styles.checked)}>
                  <input type="checkbox" className={styles.cb} checked={checked} onChange={() => toggle(q)} />
                  <div className={styles.rowMain}>
                    <div className={styles.tags}>
                      <Badge tone="primary" size="sm">{q.subject}</Badge>
                      <Badge tone="neutral" size="sm">Class {q.class}</Badge>
                      <Badge tone="info" size="sm">{q.topic}</Badge>
                    </div>
                    <p className={styles.qText}>{q.questionText}</p>
                  </div>
                </label>
              </li>
            );
          })}
        </ul>
      )}

      <Pagination page={page} totalPages={meta.totalPages || 1} onChange={setPage} />
    </Modal>
  );
}

function compactShape(q) {
  return {
    id: String(q._id || q.id),
    subject: q.subject,
    class: q.class,
    topic: q.topic,
    questionText: q.questionText,
  };
}

function indexById(list) {
  const out = {};
  for (const q of list || []) {
    const id = String(q.id || q._id);
    out[id] = compactShape(q);
  }
  return out;
}

export default QuestionPickerModal;

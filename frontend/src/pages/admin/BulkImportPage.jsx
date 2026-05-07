import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Papa from 'papaparse';

import { adminApi, unwrapApiError } from '@/api';
import { useToasts } from '@/hooks/useToasts';
import { Card, Button, Badge } from '@/components/common';
import shared from './AdminPages.module.scss';
import styles from './BulkImportPage.module.scss';

const REQUIRED_COLS = ['subject', 'class', 'topic', 'questionText', 'optionA', 'optionB', 'optionC', 'optionD', 'correctOption'];
const OPTIONAL_COLS = ['difficulty', 'explanation'];

function csvRowToQuestion(row, lineNumber) {
  const errs = [];
  for (const col of REQUIRED_COLS) {
    if (!row[col] || String(row[col]).trim() === '') {
      errs.push(`line ${lineNumber}: missing "${col}"`);
    }
  }
  if (errs.length > 0) return { errs };

  const cls = Number(row.class);
  if (!Number.isFinite(cls) || cls < 6 || cls > 12) {
    errs.push(`line ${lineNumber}: class must be 6–12`);
    return { errs };
  }

  const correct = String(row.correctOption).trim().toUpperCase();
  if (!['A', 'B', 'C', 'D'].includes(correct)) {
    errs.push(`line ${lineNumber}: correctOption must be A/B/C/D`);
    return { errs };
  }

  return {
    item: {
      subject: String(row.subject).trim(),
      class: cls,
      topic: String(row.topic).trim(),
      difficulty: row.difficulty ? String(row.difficulty).trim().toLowerCase() : undefined,
      questionText: String(row.questionText).trim(),
      options: [
        { key: 'A', text: String(row.optionA).trim() },
        { key: 'B', text: String(row.optionB).trim() },
        { key: 'C', text: String(row.optionC).trim() },
        { key: 'D', text: String(row.optionD).trim() },
      ],
      correctOption: correct,
      explanation: row.explanation ? String(row.explanation).trim() : '',
    },
  };
}

export function BulkImportPage() {
  const toasts = useToasts();
  const qc = useQueryClient();
  const fileInputRef = useRef(null);
  const [items, setItems] = useState([]);
  const [errors, setErrors] = useState([]);

  const summary = useMemo(() => ({ count: items.length, errors: errors.length }), [items, errors]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (result) => {
        const parsed = [];
        const errs = [];
        result.data.forEach((row, idx) => {
          const r = csvRowToQuestion(row, idx + 2); // header is line 1
          if (r.errs) errs.push(...r.errs);
          else if (r.item) parsed.push(r.item);
        });
        setItems(parsed);
        setErrors(errs);
        if (parsed.length > 0) {
          toasts.success(`Parsed ${parsed.length} question${parsed.length !== 1 ? 's' : ''} from CSV.`);
        }
        if (errs.length > 0) {
          toasts.warning(`${errs.length} row${errs.length !== 1 ? 's' : ''} had issues — see below.`);
        }
      },
      error: (err) => toasts.error(`CSV parse failed: ${err.message}`),
    });
  };

  const importMut = useMutation({
    mutationFn: (toImport) => adminApi.bulkCreateQuestions(toImport),
    onSuccess: (res) => {
      toasts.success(`Imported ${res.inserted} questions.`);
      qc.invalidateQueries({ queryKey: ['admin', 'questions'] });
      setItems([]);
      setErrors([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: (err) => {
      const e = unwrapApiError(err);
      const detail = e.details?.[0];
      toasts.error(detail ? `${detail.field}: ${detail.message}` : e.message);
    },
  });

  const reset = () => {
    setItems([]);
    setErrors([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={shared.page}>
      <header className={shared.head}>
        <div>
          <h1 className={shared.title}>Bulk import questions</h1>
          <p className={shared.subtitle}>Upload a CSV file to add many questions at once.</p>
        </div>
        <Link to="/admin/questions"><Button variant="secondary">← Back to questions</Button></Link>
      </header>

      <Card padding="md">
        <p className={styles.info}>
          <span className={styles.infoIcon} aria-hidden>ℹ️</span>
          <span>
            <strong>Required columns:</strong>{' '}
            <code>{REQUIRED_COLS.join(', ')}</code>.{' '}
            <strong>Optional:</strong>{' '}
            <code>{OPTIONAL_COLS.join(', ')}</code>.{' '}
            New to this? <a className={styles.sampleLink} href="/sample-questions.csv" download="sample-questions.csv">
              Download sample CSV
            </a>{' '}
            for reference.
          </span>
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          className={styles.fileInput}
        />
      </Card>

      {(items.length > 0 || errors.length > 0) && (
        <Card padding="md">
          <div className={styles.previewHead}>
            <h2 className={styles.previewTitle}>Preview</h2>
            <div className={styles.previewSummary}>
              <Badge tone="success">{summary.count} ready</Badge>
              {summary.errors > 0 && <Badge tone="danger">{summary.errors} issues</Badge>}
            </div>
          </div>

          {errors.length > 0 && (
            <ul className={styles.errList}>
              {errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
              {errors.length > 10 && <li>… and {errors.length - 10} more</li>}
            </ul>
          )}

          {items.length > 0 && (
            <ol className={styles.itemList}>
              {items.slice(0, 10).map((q, i) => (
                <li key={i}>
                  <Badge tone="primary" size="sm">{q.subject}</Badge>{' '}
                  <Badge tone="neutral" size="sm">Class {q.class}</Badge>{' '}
                  <Badge tone="info" size="sm">{q.topic}</Badge>{' '}
                  — {q.questionText}
                </li>
              ))}
              {items.length > 10 && <li className={shared.dim}>… and {items.length - 10} more</li>}
            </ol>
          )}

          <div className={shared.actions}>
            <Button variant="secondary" onClick={reset} disabled={importMut.isPending}>Clear</Button>
            <Button
              onClick={() => importMut.mutate(items)}
              disabled={items.length === 0 || importMut.isPending}
              isLoading={importMut.isPending}
            >
              Import {items.length} question{items.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export default BulkImportPage;

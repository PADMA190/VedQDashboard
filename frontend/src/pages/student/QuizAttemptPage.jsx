import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import clsx from 'clsx';

import { quizzesApi, attemptsApi } from '@/api';
import { useAuth } from '@/hooks/useAuth';
import { useToasts } from '@/hooks/useToasts';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import { useQuizTimer } from '@/hooks/useQuizTimer';
import { Card, Button, Badge, Spinner, EmptyState, Modal } from '@/components/common';
import { Timer, QuestionNavigator } from '@/components/student';
import { readJson, writeJson, remove, draftKey } from '@/utils/storage';
import { unwrapApiError } from '@/api';
import styles from './QuizAttemptPage.module.scss';

function emptyAnswerFor() {
  return { selectedOption: null, markedForReview: false, timeTakenSec: 0 };
}

export function QuizAttemptPage() {
  const { id: quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toasts = useToasts();

  const quizQ = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: () => quizzesApi.detail(quizId),
    staleTime: 60_000,
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [startedAt, setStartedAt] = useState(null);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [hasInit, setHasInit] = useState(false);
  const submittedRef = useRef(false);

  const quiz = quizQ.data;
  const questions = quiz?.questions || [];
  const persistKey = useMemo(
    () => (user?.id && quizId ? draftKey(quizId, user.id) : null),
    [user?.id, quizId]
  );

  // Initialize from draft (or fresh) once the quiz has loaded.
  useEffect(() => {
    if (!quiz || hasInit) return;
    let initial = { currentIndex: 0, answers: {}, startedAt: new Date().toISOString() };
    if (persistKey) {
      const draft = readJson(persistKey);
      if (
        draft &&
        Array.isArray(draft.questionIds) &&
        draft.questionIds.length === questions.length &&
        draft.questionIds.every((id, i) => id === (questions[i].id || questions[i]._id))
      ) {
        initial = {
          currentIndex: Math.min(draft.currentIndex || 0, questions.length - 1),
          answers: draft.answers || {},
          startedAt: draft.startedAt || initial.startedAt,
        };
      }
    }
    setCurrentIndex(initial.currentIndex);
    setAnswers(initial.answers);
    setStartedAt(initial.startedAt);
    setHasInit(true);
  }, [quiz, hasInit, persistKey, questions]);

  // Debounced draft persistence.
  const persistDraft = useDebouncedCallback((draft) => {
    if (persistKey) writeJson(persistKey, draft);
  }, 500);

  useEffect(() => {
    if (!hasInit || !quiz || !persistKey) return;
    persistDraft({
      currentIndex,
      answers,
      startedAt,
      questionIds: questions.map((q) => q.id || q._id),
    });
  }, [hasInit, currentIndex, answers, startedAt, persistKey, persistDraft, quiz, questions]);

  // Per-question time accumulator: charge time to the question being viewed.
  const enterRef = useRef(Date.now());
  useEffect(() => {
    enterRef.current = Date.now();
    const charged = currentIndex;
    const chargedQuestion = questions[charged];
    return () => {
      if (!chargedQuestion) return;
      const elapsed = Math.round((Date.now() - enterRef.current) / 1000);
      if (elapsed <= 0) return;
      const qid = chargedQuestion.id || chargedQuestion._id;
      setAnswers((prev) => {
        const cur = prev[qid] || emptyAnswerFor();
        return { ...prev, [qid]: { ...cur, timeTakenSec: (cur.timeTakenSec || 0) + elapsed } };
      });
    };
  }, [currentIndex, questions]);

  const submitMutation = useMutation({
    mutationFn: (payload) => attemptsApi.submit(payload),
    onSuccess: (review) => {
      submittedRef.current = true;
      if (persistKey) remove(persistKey);
      toasts.success(`Submitted — score ${review.score}%`);
      navigate(`/attempts/${review.id}`, { replace: true, state: { review } });
    },
    onError: (err) => {
      toasts.error(unwrapApiError(err).message);
    },
  });

  const submit = () => {
    if (submitMutation.isPending || submittedRef.current) return;
    const payload = {
      quizId,
      startedAt,
      answers: questions.map((q) => {
        const qid = q.id || q._id;
        const a = answers[qid] || {};
        return {
          questionId: qid,
          selectedOption: a.selectedOption || null,
          timeTakenSec: a.timeTakenSec || 0,
          markedForReview: !!a.markedForReview,
        };
      }),
    };
    submitMutation.mutate(payload);
  };

  // Timer (auto-submit on expiry).
  const { remainingSec, totalSec, expired } = useQuizTimer({
    durationMinutes: quiz?.durationMinutes || 0,
    startedAt,
    onExpire: () => {
      if (!submittedRef.current) {
        toasts.warning('Time’s up — submitting your attempt.');
        submit();
      }
    },
  });

  const setAnswerFor = (qid, patch) => {
    setAnswers((prev) => ({
      ...prev,
      [qid]: { ...emptyAnswerFor(), ...prev[qid], ...patch },
    }));
  };

  if (quizQ.isLoading || !hasInit) {
    return <Spinner size="lg" />;
  }

  if (quizQ.isError || !quiz) {
    return (
      <EmptyState
        icon="🚫"
        title="Couldn't load this quiz"
        description={quizQ.error?.response?.data?.error?.message || 'It may not be assigned to you yet.'}
        action={<Button onClick={() => navigate('/')}>Back to dashboard</Button>}
      />
    );
  }

  const total = questions.length;
  const current = questions[currentIndex];
  const currentId = current?.id || current?._id;
  const currentAnswer = answers[currentId] || emptyAnswerFor();
  const answeredCount = Object.values(answers).filter((a) => a.selectedOption).length;
  const markedCount = Object.values(answers).filter((a) => a.markedForReview).length;

  const goPrev = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const goNext = () => setCurrentIndex((i) => Math.min(total - 1, i + 1));

  return (
    <div className={styles.page}>
      <header className={styles.bar}>
        <div className={styles.barLeft}>
          <Link to="/" className={styles.exit}>← Exit</Link>
          <br />
          <div>
            <h1 className={styles.title}>{quiz.title}</h1>
            <div className={styles.subtitle}>
              <Badge tone="primary">{quiz.subject}</Badge>
              <Badge tone="neutral" size="sm">Class {quiz.class}</Badge>
              <span>· {total} questions · {quiz.durationMinutes} min</span>
            </div>
          </div>
        </div>
        <Timer remainingSec={remainingSec} totalSec={totalSec} />
      </header>

      <div className={styles.body}>
        <Card padding="md" className={styles.questionCard}>
          <div className={styles.qHead}>
            <span className={styles.qIndex}>Question {currentIndex + 1} <span className={styles.dim}>of {total}</span></span>
            {current.topic && (
              <span className={styles.qTopic}>{current.subject} · {current.topic}</span>
            )}
            <button
              type="button"
              onClick={() => setAnswerFor(currentId, { markedForReview: !currentAnswer.markedForReview })}
              className={clsx(styles.markBtn, currentAnswer.markedForReview && styles.markActive)}
              aria-pressed={currentAnswer.markedForReview}
            >
              {currentAnswer.markedForReview ? '★ Marked for review' : '☆ Mark for review'}
            </button>
          </div>

          <p className={styles.qText}>{current.questionText}</p>

          <ul className={styles.options} role="radiogroup" aria-label="Answer options">
            {(current.options || []).map((opt) => {
              const checked = currentAnswer.selectedOption === opt.key;
              return (
                <li key={opt.key}>
                  <label className={clsx(styles.option, checked && styles.optionChecked)}>
                    <input
                      type="radio"
                      name={`q-${currentId}`}
                      value={opt.key}
                      checked={checked}
                      onChange={() => setAnswerFor(currentId, { selectedOption: opt.key })}
                      className={styles.optionRadio}
                    />
                    <span className={styles.optKey}>{opt.key}</span>
                    <span className={styles.optText}>{opt.text}</span>
                  </label>
                </li>
              );
            })}
          </ul>

          <div className={styles.actions}>
            <Button variant="ghost" onClick={goPrev} disabled={currentIndex === 0}>← Previous</Button>
            <div className={styles.spacer} />
            {currentAnswer.selectedOption && (
              <Button variant="secondary" onClick={() => setAnswerFor(currentId, { selectedOption: null })}>
                Clear
              </Button>
            )}
            {currentIndex < total - 1 ? (
              <Button onClick={goNext}>Next →</Button>
            ) : (
              <Button variant="success" onClick={() => setSubmitOpen(true)}>Review &amp; submit</Button>
            )}
          </div>
        </Card>

        <aside className={styles.sidebar}>
          <Card padding="md">
            <h3 className={styles.sideTitle}>Progress</h3>
            <div className={styles.progress}>
              <span><strong>{answeredCount}</strong> answered</span>
              <span><strong>{markedCount}</strong> marked</span>
              <span><strong>{total - answeredCount}</strong> blank</span>
            </div>
            <QuestionNavigator
              questions={questions}
              answers={answers}
              currentIndex={currentIndex}
              onJump={setCurrentIndex}
            />
            <Button
              fullWidth
              variant="success"
              onClick={() => setSubmitOpen(true)}
              isLoading={submitMutation.isPending}
              className={styles.submitTop}
            >
              Submit attempt
            </Button>
          </Card>
        </aside>
      </div>

      <Modal
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        title="Submit attempt?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSubmitOpen(false)}>Keep editing</Button>
            <Button
              variant="success"
              onClick={() => { setSubmitOpen(false); submit(); }}
              isLoading={submitMutation.isPending}
            >
              Submit now
            </Button>
          </>
        }
      >
        <p>You're about to submit your attempt with the following:</p>
        <ul className={styles.summaryList}>
          <li><strong>{answeredCount}</strong> of <strong>{total}</strong> questions answered</li>
          <li><strong>{markedCount}</strong> marked for review</li>
          <li><strong>{total - answeredCount}</strong> left blank</li>
        </ul>
        {expired && <p className={styles.warn}>The timer has expired. Submission is being finalized.</p>}
      </Modal>
    </div>
  );
}

export default QuizAttemptPage;

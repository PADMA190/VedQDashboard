'use strict';

/**
 * Pure scoring function — no DB, no I/O. Easy to unit-test.
 *
 * @param {Array<{_id: any, correctOption: string, subject: string, topic: string}>} quizQuestions
 * @param {Array<{questionId: any, selectedOption?: string|null, timeTakenSec?: number, markedForReview?: boolean}>} submittedAnswers
 * @returns {{
 *   answers: Array<{questionId: any, selectedOption: string|null, isCorrect: boolean, timeTakenSec: number, markedForReview: boolean}>,
 *   totalQuestions: number,
 *   correctCount: number,
 *   accuracy: number,
 *   score: number,
 *   topicAggregation: Array<{subject: string, topic: string, total: number, correct: number}>
 * }}
 */
function scoreAttempt(quizQuestions, submittedAnswers) {
  const submittedById = new Map(
    (submittedAnswers || []).map((a) => [String(a.questionId), a])
  );

  const answers = quizQuestions.map((q) => {
    const submitted = submittedById.get(String(q._id));
    const selectedOption = submitted && submitted.selectedOption !== undefined
      ? submitted.selectedOption
      : null;
    const isCorrect = selectedOption !== null && selectedOption === q.correctOption;
    return {
      questionId: q._id,
      selectedOption,
      isCorrect,
      timeTakenSec: submitted && Number.isFinite(submitted.timeTakenSec)
        ? submitted.timeTakenSec
        : 0,
      markedForReview: Boolean(submitted && submitted.markedForReview),
    };
  });

  const totalQuestions = quizQuestions.length;
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const accuracy = totalQuestions > 0 ? correctCount / totalQuestions : 0;
  const score = Math.round(accuracy * 100);

  const topicMap = new Map();
  for (let i = 0; i < quizQuestions.length; i += 1) {
    const q = quizQuestions[i];
    const a = answers[i];
    const key = `${q.subject}|${q.topic}`;
    const cur = topicMap.get(key) || {
      subject: q.subject,
      topic: q.topic,
      total: 0,
      correct: 0,
    };
    cur.total += 1;
    if (a.isCorrect) cur.correct += 1;
    topicMap.set(key, cur);
  }

  return {
    answers,
    totalQuestions,
    correctCount,
    accuracy,
    score,
    topicAggregation: Array.from(topicMap.values()),
  };
}

module.exports = { scoreAttempt };

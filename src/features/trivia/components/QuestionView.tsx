// src/features/trivia/components/QuestionView.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ref, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useLiveState, TriviaQuestion } from '@/features/live-session/hooks/useLiveState';

interface QuestionViewProps {
  sessionId?: string;
  userId?: string;
  userName?: string;
}

export function QuestionView({
  sessionId = 'active_session',
  userId = 'member_user_anon',
  userName = 'Reader',
}: QuestionViewProps) {
  const { session, loading } = useLiveState(sessionId);
  const [timeLeftMs, setTimeLeftMs] = useState<number>(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);

  const trivia = session?.stageState?.trivia;
  const currentQuestionIndex = trivia?.currentQuestionIndex ?? 0;
  const currentQuestion: TriviaQuestion | undefined = trivia?.questions?.[currentQuestionIndex];
  const questionStartTime = trivia?.questionStartTime;
  const timeLimitMs = (trivia?.timeLimitSeconds ?? 20) * 1000;

  // Reset local state whenever the host advances to a new question
  useEffect(() => {
    setSelectedIndex(null);
    setHasSubmitted(false);
  }, [currentQuestionIndex]);

  // Synchronized countdown timer loop driven by server timestamp
  useEffect(() => {
    if (!questionStartTime || trivia?.status !== 'IN_PROGRESS') {
      setTimeLeftMs(0);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - questionStartTime;
      const remaining = Math.max(0, timeLimitMs - elapsed);
      setTimeLeftMs(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [questionStartTime, trivia?.status, timeLimitMs]);

  if (loading) {
    return (
      <div className="p-8 text-center text-muted font-medium animate-pulse">
        Loading Trivia...
      </div>
    );
  }

  if (!trivia || !currentQuestion) {
    return (
      <div className="bg-card-bg border border-card-border rounded-2xl p-8 text-center space-y-2 shadow-sm">
        <span className="text-3xl">🧠</span>
        <h3 className="text-base font-bold text-primary">Waiting for trivia round...</h3>
        <p className="text-xs text-muted">The host will launch the next question shortly.</p>
      </div>
    );
  }

  const isTimeUp = timeLeftMs <= 0;
  const progressPercent = Math.min(100, Math.max(0, (timeLeftMs / timeLimitMs) * 100));
  const remainingSeconds = Math.ceil(timeLeftMs / 1000);

  // Submit answer and calculate points based on speed
  const handleSelectOption = async (index: number) => {
    if (hasSubmitted || isTimeUp || !questionStartTime) return;

    setSelectedIndex(index);
    setHasSubmitted(true);

    const timeTakenMs = Date.now() - questionStartTime;
    const isCorrect = index === currentQuestion.correctAnswer;

    // Point scoring formula: 1000 max points, scaled down by time taken
    let pointsAwarded = 0;
    if (isCorrect) {
      const speedFactor = Math.max(0, 1 - timeTakenMs / timeLimitMs);
      pointsAwarded = Math.round(500 + 500 * speedFactor);
    }

    try {
      const responseRef = ref(
        db,
        `sessions/${sessionId}/stageState/trivia/responses/q_${currentQuestion.id}/${userId}`
      );

      await update(responseRef, {
        chosenIndex: index,
        timeTakenMs,
        pointsAwarded,
      });

      // Update total score in session member list
      if (pointsAwarded > 0) {
        const memberScoreRef = ref(db, `sessions/${sessionId}/connectedMembers/${userId}`);
        const currentScore = (session?.connectedMembers as Record<string, any>)?.[userId]?.score ?? 0;
        await update(memberScoreRef, {
          score: currentScore + pointsAwarded,
          name: userName,
        });
      }
    } catch (err) {
      console.error('Failed to submit trivia response:', err);
    }
  };

  return (
    <div className="bg-card-bg border border-card-border rounded-2xl p-6 md:p-8 space-y-6 shadow-sm w-full max-w-2xl mx-auto">
      {/* Question Header & Countdown Bar */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-xs font-bold tracking-wider uppercase">
          <span className="text-brand-accent font-mono">
            Question {currentQuestionIndex + 1} of {trivia.questions.length}
          </span>
          <span
            className={`font-mono text-sm font-bold flex items-center gap-1 ${
              remainingSeconds <= 5 ? 'text-rose-600 animate-bounce' : 'text-brand-accent'
            }`}
          >
            ⏱️ {remainingSeconds}s
          </span>
        </div>

        {/* Dynamic Timer Bar */}
        <div className="w-full h-2.5 bg-main rounded-full overflow-hidden border border-card-border">
          <div
            className={`h-full transition-all duration-100 ease-linear rounded-full ${
              remainingSeconds <= 5 ? 'bg-rose-500' : 'bg-brand-accent'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Question Text */}
        <h2 className="text-xl md:text-2xl font-black text-primary pt-2 leading-snug">
          {currentQuestion.question}
        </h2>
      </div>

      {/* Answer Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {currentQuestion.options.map((optionText: string, index: number) => {
          const isSelected = selectedIndex === index;
          const isCorrectIndex = index === currentQuestion.correctAnswer;

          // Standard unselected card styling
          let buttonStyle = 'bg-main border-card-border text-primary hover:border-brand-accent/60 shadow-sm';

          if (isTimeUp) {
            // Reveal correct answer when timer expires
            if (isCorrectIndex) {
              buttonStyle =
                'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-2 ring-emerald-500 shadow-sm';
            } else if (isSelected && !isCorrectIndex) {
              buttonStyle = 'bg-rose-50 border-rose-400 text-rose-950 ring-1 ring-rose-400/40';
            } else {
              buttonStyle = 'bg-main border-card-border text-muted opacity-50';
            }
          } else if (isSelected) {
            buttonStyle =
              'bg-card-bg border-brand-accent text-primary font-bold ring-2 ring-brand-accent/40 shadow-md';
          } else if (hasSubmitted) {
            buttonStyle = 'bg-main border-card-border text-muted opacity-60';
          }

          return (
            <button
              key={index}
              onClick={() => handleSelectOption(index)}
              disabled={hasSubmitted || isTimeUp}
              className={`p-4 rounded-xl border text-left text-sm md:text-base transition-all duration-200 flex items-center justify-between ${buttonStyle}`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center font-mono text-xs font-bold ${
                    isSelected
                      ? 'bg-brand-accent text-white'
                      : 'bg-card-bg text-muted border border-card-border'
                  }`}
                >
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="font-medium">{optionText}</span>
              </div>

              {isTimeUp && isCorrectIndex && (
                <span className="text-emerald-700 font-extrabold text-xs shrink-0 ml-2">
                  ✓ Correct
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Status Message */}
      <div className="text-center text-xs text-muted pt-2 border-t border-card-border">
        {hasSubmitted && !isTimeUp && (
          <p className="text-brand-accent font-bold animate-pulse">
            Answer locked in! Waiting for timer to expire...
          </p>
        )}
        {isTimeUp && (
          <p className="text-primary font-medium">
            Time up! Waiting for host to advance to the next question or leaderboard.
          </p>
        )}
      </div>
    </div>
  );
}
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
    return <div className="p-8 text-center text-slate-400 animate-pulse">Loading Trivia...</div>;
  }

  if (!trivia || !currentQuestion) {
    return <div className="p-6 text-center text-slate-400">Waiting for trivia round to begin...</div>;
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
    const isCorrect = index === currentQuestion.correctAnswerIndex;

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
        const currentScore = session?.connectedMembers?.[userId]?.score ?? 0;
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
    <div className="w-full max-w-2xl mx-auto p-4 space-y-6">
      {/* Question Header & Countdown Bar */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-xs font-bold tracking-wider text-slate-400 uppercase">
          <span>
            Question {currentQuestionIndex + 1} of {trivia.questions.length}
          </span>
          <span className={`font-mono text-sm ${remainingSeconds <= 5 ? 'text-rose-400 animate-ping' : 'text-amber-400'}`}>
            ⏱️ {remainingSeconds}s
          </span>
        </div>

        {/* Dynamic Timer Bar */}
        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
          <div
            className={`h-full transition-all duration-100 ease-linear ${
              remainingSeconds <= 5 ? 'bg-rose-500' : 'bg-amber-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <h2 className="text-xl md:text-2xl font-bold text-slate-100 pt-2 leading-snug">
          {currentQuestion.prompt}
        </h2>
      </div>

      {/* Answer Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {currentQuestion.options.map((optionText: string, index: number) => {
          const isSelected = selectedIndex === index;
          const isCorrectIndex = index === currentQuestion.correctAnswerIndex;

          let buttonStyle = 'bg-slate-800 border-slate-700 text-slate-200 hover:border-amber-500/80';

          if (isTimeUp) {
            // Reveal correct answer when timer expires
            if (isCorrectIndex) {
              buttonStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold ring-2 ring-emerald-500';
            } else if (isSelected && !isCorrectIndex) {
              buttonStyle = 'bg-rose-950/80 border-rose-500 text-rose-200 opacity-80';
            } else {
              buttonStyle = 'bg-slate-900 border-slate-800 text-slate-500 opacity-50';
            }
          } else if (isSelected) {
            buttonStyle = 'bg-amber-950/60 border-amber-500 text-amber-200 font-bold ring-2 ring-amber-500/50';
          } else if (hasSubmitted) {
            buttonStyle = 'bg-slate-900 border-slate-800 text-slate-500 opacity-60';
          }

          return (
            <button
              key={index}
              onClick={() => handleSelectOption(index)}
              disabled={hasSubmitted || isTimeUp}
              className={`p-4 rounded-xl border text-left text-sm md:text-base transition-all duration-200 flex items-center justify-between ${buttonStyle}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-slate-700/50 text-slate-300 font-mono text-xs font-bold flex items-center justify-center border border-slate-600/50">
                  {String.fromCharCode(65 + index)}
                </span>
                <span>{optionText}</span>
              </div>

              {isTimeUp && isCorrectIndex && (
                <span className="text-emerald-400 font-extrabold text-xs">✓ Correct</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Status Message */}
      <div className="text-center text-xs text-slate-400">
        {hasSubmitted && !isTimeUp && (
          <p className="text-amber-400 font-medium animate-pulse">
            Answer locked in! Waiting for timer to expire...
          </p>
        )}
        {isTimeUp && (
          <p className="text-slate-300">
            Time up! Waiting for host to advance to the next question or leaderboard.
          </p>
        )}
      </div>
    </div>
  );
}
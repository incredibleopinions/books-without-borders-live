'use client';

import { useState, useEffect } from 'react';
import { ref, update, set } from 'firebase/database';
import { db } from '@/lib/firebase';
import { SessionData } from '@/features/live-session/hooks/useLiveState';

interface TriviaStageProps {
  session: SessionData;
  memberName: string;
}

export function TriviaStage({ session, memberName }: TriviaStageProps) {
  const trivia = session.stageState?.trivia;
  const questions = trivia?.questions || [];
  const currentIndex = trivia?.currentQuestionIndex ?? 0;
  const status = trivia?.status || 'IDLE';
  const currentQuestion = questions[currentIndex];

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(trivia?.timeLimitSeconds || 20);

  // Register active participant presence in Firebase
  useEffect(() => {
    if (memberName && session.sessionId) {
      set(ref(db, `sessions/${session.sessionId}/stageState/trivia/participants/${memberName}`), {
        joinedAt: Date.now(),
        lastActive: Date.now(),
      });
    }
  }, [memberName, session.sessionId]);

  // Reset selected option when question advances
  useEffect(() => {
    setSelectedOption(null);
  }, [currentIndex]);

  // Timer Countdown Logic (Only runs when status === 'IN_PROGRESS')
  useEffect(() => {
    if (status !== 'IN_PROGRESS' || !trivia?.questionStartTime) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - trivia.questionStartTime!) / 1000);
      const remaining = Math.max(0, (trivia.timeLimitSeconds || 20) - elapsed);
      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [status, trivia?.questionStartTime, trivia?.timeLimitSeconds]);

  // Submit Answer
  const handleSelectOption = async (optionIdx: number) => {
    // Only guard against time running out or the question not being in progress
    if (timeLeft === 0 || status !== 'IN_PROGRESS') return;

    const previousOption = selectedOption; // Track previous pick if changing answer
    setSelectedOption(optionIdx);

    const isCorrect = optionIdx === currentQuestion.correctAnswer;
    const speedBonus = isCorrect ? Math.max(10, timeLeft * 50) : 0;

    // Calculate previously awarded score if the user had already picked an answer
    let previousScoreAwarded = 0;
    if (previousOption !== null && previousOption === currentQuestion.correctAnswer) {
      previousScoreAwarded = Math.max(10, timeLeft * 50);
    }

    // 1. Update response payload in Realtime Database
    await update(
      ref(
        db,
        `sessions/${session.sessionId}/stageState/trivia/responses/${currentIndex}/${memberName}`
      ),
      {
        selectedOption: optionIdx,
        isCorrect,
        scoreAwarded: speedBonus,
        timestamp: Date.now(),
      }
    );

    // 2. Adjust running score total accordingly
    const currentTotalScore = trivia?.scores?.[memberName] || 0;
    const netScoreChange = speedBonus - previousScoreAwarded;

    if (netScoreChange !== 0) {
      await update(
        ref(db, `sessions/${session.sessionId}/stageState/trivia/scores`),
        {
          [memberName]: Math.max(0, currentTotalScore + netScoreChange),
        }
      );
    }
  };

  const sortedLeaderboard = Object.entries(trivia?.scores || {})
    .map(([name, score]) => ({ name, score }))
    .sort((a, b) => b.score - a.score);

  if (status === 'IDLE' || questions.length === 0) {
    return (
      <div className="bg-card-bg border border-card-border rounded-2xl p-8 text-center space-y-3 shadow-sm max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-primary">Live Trivia</h2>
        <p className="text-sm text-muted">Get ready! The host will launch the trivia round shortly.</p>
      </div>
    );
  }

  if (status === 'COMPLETED') {
    return (
      <div className="bg-card-bg border border-card-border rounded-2xl p-6 md:p-8 space-y-6 shadow-sm max-w-2xl mx-auto animate-fadeIn">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black text-brand-accent">🏆 Final Leaderboard</h2>
          <p className="text-xs text-muted">Great game, everyone!</p>
        </div>

        <div className="space-y-2">
          {sortedLeaderboard.map((entry, idx) => (
            <div
              key={entry.name}
              className={`flex items-center justify-between p-3.5 rounded-xl border ${
                idx === 0
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-900 font-bold'
                  : idx === 1
                  ? 'bg-main border-card-border text-primary font-semibold'
                  : idx === 2
                  ? 'bg-amber-500/5 border-amber-500/20 text-amber-800'
                  : 'bg-main/50 border-card-border text-muted'
              }`}
            >
              <div className="flex items-center gap-3 text-sm">
                <span className="w-6 h-6 rounded-full bg-card-bg border border-card-border flex items-center justify-center text-xs shadow-xs">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                </span>
                <span>{entry.name}</span>
              </div>
              <span className="font-mono font-bold text-brand-accent">{entry.score} pts</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card-bg border border-card-border rounded-2xl p-6 md:p-8 space-y-6 shadow-sm max-w-2xl mx-auto">
      {/* Top Progress & Timer Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-muted uppercase tracking-wider">
          <span>
            Question {currentIndex + 1} of {questions.length}
          </span>
          {status === 'IN_PROGRESS' ? (
            <span className={`font-mono text-sm ${timeLeft <= 5 ? 'text-rose-600 animate-bounce' : 'text-brand-accent'}`}>
              ⏱️ {timeLeft}s
            </span>
          ) : (
            <span className="text-brand-accent text-xs font-semibold animate-pulse">
              {status === 'READY' ? '⏳ Waiting for Host to Start Timer' : '💡 Answer Revealed'}
            </span>
          )}
        </div>

        <div className="w-full bg-main h-2 rounded-full overflow-hidden border border-card-border">
          <div
            className={`h-full transition-all duration-300 ${
              status === 'IN_PROGRESS'
                ? timeLeft <= 5
                  ? 'bg-rose-500'
                  : 'bg-brand-accent'
                : 'bg-brand-accent/30'
            }`}
            style={{
              width:
                status === 'IN_PROGRESS'
                  ? `${(timeLeft / (trivia?.timeLimitSeconds || 20)) * 100}%`
                  : '100%',
            }}
          />
        </div>
      </div>

      {/* Question Text */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-brand-accent uppercase tracking-wider">Current Question</span>
        <h2 className="text-xl font-extrabold text-primary leading-snug">{currentQuestion?.question}</h2>
      </div>

      {/* Options Section */}
      {status === 'READY' ? (
        <div className="p-8 rounded-xl bg-main border border-dashed border-card-border text-center space-y-2 animate-pulse">
          <span className="text-2xl">👀</span>
          <p className="text-sm font-bold text-primary">Read the question carefully!</p>
          <p className="text-xs text-muted">Options will appear when the host starts the countdown timer.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fadeIn">
          {currentQuestion?.options.map((option, idx) => {
            const isSelected = selectedOption === idx;
            const isRevealed = status === 'REVEALED';
            const isCorrectAnswer = idx === currentQuestion.correctAnswer;

            let btnStyle = 'bg-main border-card-border text-primary hover:border-brand-accent/50 shadow-xs';

            if (isSelected) {
              btnStyle = 'bg-card-bg border-brand-accent text-primary ring-2 ring-brand-accent/40 shadow-sm font-bold';
            }

            if (isRevealed) {
              if (isCorrectAnswer) {
                btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-2 ring-emerald-500/40';
              } else if (isSelected && !isCorrectAnswer) {
                btnStyle = 'bg-rose-50 border-rose-400 text-rose-950 ring-1 ring-rose-400/40';
              } else {
                btnStyle = 'bg-main border-card-border text-muted opacity-60';
              }
            }

            return (
              <button
                key={idx}
                disabled={timeLeft === 0 || isRevealed}
                onClick={() => handleSelectOption(idx)}
                className={`p-4 rounded-xl text-left border text-sm font-medium transition-all flex items-center gap-2 ${
                  timeLeft === 0 || isRevealed ? 'cursor-not-allowed' : 'cursor-pointer'
                } ${btnStyle}`}
              >
                <span className="w-6 shrink-0 text-muted font-mono font-bold">
                  {String.fromCharCode(65 + idx)}.
                </span>
                <span className="flex-1">{option}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Explanation Banner on Reveal */}
      {status === 'REVEALED' && currentQuestion?.explanation && (
        <div className="p-4 rounded-xl bg-main border border-card-border text-primary text-xs space-y-1 animate-fadeIn">
          <span className="font-bold uppercase tracking-wider block text-brand-accent">Explanation:</span>
          <p className="leading-relaxed text-muted">{currentQuestion.explanation}</p>
        </div>
      )}
    </div>
  );
}
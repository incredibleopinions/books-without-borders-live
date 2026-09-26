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
    if (selectedOption !== null || timeLeft === 0 || status !== 'IN_PROGRESS') return;

    setSelectedOption(optionIdx);

    const isCorrect = optionIdx === currentQuestion.correctAnswer;
    const speedBonus = isCorrect ? Math.max(10, timeLeft * 50) : 0;

    // Log answer under participants breakdown
    await update(ref(db, `sessions/${session.sessionId}/stageState/trivia/responses/${currentIndex}/${memberName}`), {
      selectedOption: optionIdx,
      isCorrect,
      scoreAwarded: speedBonus,
      timestamp: Date.now(),
    });

    if (isCorrect) {
      const currentTotalScore = trivia?.scores?.[memberName] || 0;
      await update(ref(db, `sessions/${session.sessionId}/stageState/trivia/scores`), {
        [memberName]: currentTotalScore + speedBonus,
      });
    }
  };

  const sortedLeaderboard = Object.entries(trivia?.scores || {})
    .map(([name, score]) => ({ name, score }))
    .sort((a, b) => b.score - a.score);

  if (status === 'IDLE' || questions.length === 0) {
    return (
      <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-8 text-center space-y-3">
        <h2 className="text-xl font-bold text-white">Live Trivia</h2>
        <p className="text-sm text-slate-400">Get ready! The host will launch the trivia round shortly.</p>
      </div>
    );
  }

  if (status === 'COMPLETED') {
    return (
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 md:p-8 space-y-6 animate-fadeIn">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black text-amber-400">🏆 Final Leaderboard</h2>
          <p className="text-xs text-slate-400">Great game, everyone!</p>
        </div>

        <div className="space-y-2">
          {sortedLeaderboard.map((entry, idx) => (
            <div
              key={entry.name}
              className={`flex items-center justify-between p-3.5 rounded-xl border ${
                idx === 0
                  ? 'bg-amber-950/40 border-amber-500/60 text-amber-200'
                  : idx === 1
                  ? 'bg-slate-800 border-slate-600 text-slate-200'
                  : idx === 2
                  ? 'bg-amber-900/20 border-amber-800/40 text-amber-300'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-3 font-semibold text-sm">
                <span className="w-6 h-6 rounded-full bg-slate-900/80 flex items-center justify-center text-xs">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                </span>
                <span>{entry.name}</span>
              </div>
              <span className="font-mono font-bold text-teal-400">{entry.score} pts</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl">
      {/* Top Progress & Timer Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
          <span>
            Question {currentIndex + 1} of {questions.length}
          </span>
          {status === 'IN_PROGRESS' ? (
            <span className={`font-mono text-sm ${timeLeft <= 5 ? 'text-rose-400 animate-bounce' : 'text-teal-400'}`}>
              ⏱️ {timeLeft}s
            </span>
          ) : (
            <span className="text-amber-400 text-xs font-semibold animate-pulse">
              {status === 'READY' ? '⏳ Waiting for Host to Start Timer' : '💡 Answer Revealed'}
            </span>
          )}
        </div>

        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              status === 'IN_PROGRESS'
                ? timeLeft <= 5
                  ? 'bg-rose-500'
                  : 'bg-teal-500'
                : 'bg-slate-700'
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

      {/* Question Text (Always Visible First) */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">Current Question</span>
        <h2 className="text-xl font-extrabold text-white leading-snug">{currentQuestion?.question}</h2>
      </div>

      {/* Options Section: Locked/Hidden until Admin starts timer */}
      {status === 'READY' ? (
        <div className="p-8 rounded-xl bg-slate-900/60 border border-dashed border-slate-700 text-center space-y-2 animate-pulse">
          <span className="text-2xl">👀</span>
          <p className="text-sm font-bold text-slate-200">Read the question carefully!</p>
          <p className="text-xs text-slate-400">Options will appear when the host starts the countdown timer.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fadeIn">
          {currentQuestion?.options.map((option, idx) => {
            const isSelected = selectedOption === idx;
            const isRevealed = status === 'REVEALED';
            const isCorrectAnswer = idx === currentQuestion.correctAnswer;

            let btnStyle = 'bg-slate-900/80 border-slate-700 text-slate-200 hover:bg-slate-750';

            if (isSelected) {
              btnStyle = 'bg-teal-950 border-teal-500 text-teal-200 ring-2 ring-teal-500/50';
            }

            if (isRevealed) {
              if (isCorrectAnswer) {
                btnStyle = 'bg-emerald-950 border-emerald-500 text-emerald-200 font-bold';
              } else if (isSelected && !isCorrectAnswer) {
                btnStyle = 'bg-rose-950 border-rose-500 text-rose-300 opacity-80';
              } else {
                btnStyle = 'bg-slate-900/40 border-slate-800 text-slate-500 opacity-50';
              }
            }

            return (
              <button
                key={idx}
                disabled={selectedOption !== null || timeLeft === 0 || isRevealed}
                onClick={() => handleSelectOption(idx)}
                className={`p-4 rounded-xl text-left border text-sm font-medium transition-all ${btnStyle}`}
              >
                <span className="inline-block w-6 text-slate-400 font-mono">{String.fromCharCode(65 + idx)}.</span>
                {option}
              </button>
            );
          })}
        </div>
      )}

      {/* Explanation Banner on Reveal */}
      {status === 'REVEALED' && currentQuestion?.explanation && (
        <div className="p-4 rounded-xl bg-teal-950/40 border border-teal-800/60 text-teal-200 text-xs space-y-1 animate-fadeIn">
          <span className="font-bold uppercase tracking-wider block text-teal-400">Explanation:</span>
          <p className="leading-relaxed">{currentQuestion.explanation}</p>
        </div>
      )}
    </div>
  );
}
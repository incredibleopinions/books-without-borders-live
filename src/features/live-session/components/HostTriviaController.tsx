'use client';

import { ref, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import { SessionData } from '@/features/live-session/hooks/useLiveState';

export function HostTriviaController({ session }: { session: SessionData }) {
  const sessionId = session.sessionId;
  const trivia = session.stageState?.trivia;
  const questions = trivia?.questions || [];
  const currentIndex = trivia?.currentQuestionIndex ?? 0;
  const status = trivia?.status || 'IDLE';

  const startQuestionTimer = async () => {
    await update(ref(db, `sessions/${sessionId}/stageState/trivia`), {
      status: 'IN_PROGRESS',
      questionStartTime: Date.now(),
    });
  };

  const revealCurrentAnswer = async () => {
    await update(ref(db, `sessions/${sessionId}/stageState/trivia`), {
      status: 'REVEALED',
    });
  };

  const nextQuestion = async () => {
    if (currentIndex + 1 < questions.length) {
      await update(ref(db, `sessions/${sessionId}/stageState/trivia`), {
        currentQuestionIndex: currentIndex + 1,
        status: 'READY',
      });
    } else {
      await update(ref(db, `sessions/${sessionId}/stageState/trivia`), {
        status: 'COMPLETED',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* File Importer */}
      <TriviaImporter sessionId={sessionId} />

      {questions.length > 0 && (
        <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Live Trivia Controller</h2>
              <p className="text-slate-400 text-xs">
                Question <strong className="text-teal-400">{currentIndex + 1}</strong> of {questions.length}
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-teal-950 border border-teal-500 text-teal-300">
              Status: {status}
            </span>
          </div>

          {/* Current Question Preview */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/50 space-y-2 text-xs">
            <span className="text-slate-400 uppercase font-bold tracking-wider">Active Question</span>
            <p className="text-slate-200 text-sm font-semibold">{questions[currentIndex]?.question}</p>
          </div>

          {/* Host Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={startQuestionTimer}
              disabled={status === 'IN_PROGRESS'}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-md transition-all"
            >
              ⏱️ Start Question Timer
            </button>

            <button
              onClick={revealCurrentAnswer}
              disabled={status !== 'IN_PROGRESS'}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-md transition-all"
            >
              💡 Reveal Correct Answer
            </button>

            <button
              onClick={nextQuestion}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold text-xs shadow-md transition-all"
            >
              ➡️ {currentIndex + 1 < questions.length ? 'Next Question' : 'Complete & Show Leaderboard'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
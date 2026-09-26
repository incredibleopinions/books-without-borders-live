// src/features/host-control/components/StageNavigator.tsx
'use client';

import React from 'react';
import { useLiveState, SessionStage } from '@/features/live-session/hooks/useLiveState';
import { useHostActions } from '../hooks/useHostActions';

export function StageNavigator() {
  const { session, loading } = useLiveState();
  const {
    setStage,
    revealIcebreaker,
    resetIcebreaker,
    setDiscussionQuestion,
    startTriviaQuestion,
    showTriviaLeaderboard,
  } = useHostActions();

  if (loading) return <div className="p-4 text-gray-400">Loading Host Dashboard...</div>;
  if (!session) return <div className="p-4 text-red-500">No active session found in Firebase.</div>;

  const stages: SessionStage[] = ['LOBBY', 'ICEBREAKER', 'DISCUSSION', 'TRIVIA', 'WRAP_UP'];
  const { currentStage, stageState } = session;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-slate-900 text-white rounded-xl shadow-2xl space-y-6">
      {/* Session Header */}
      <div className="flex justify-between items-center border-b border-slate-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-amber-400">Books Without Borders - Host Panel</h1>
          <p className="text-sm text-slate-400">
            Country: <span className="text-white font-semibold">{session.featuredCountry}</span> | Book:{' '}
            <span className="text-white font-semibold">{session.featuredBook}</span>
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs uppercase tracking-wider text-slate-400">Active Stage</span>
          <div className="text-lg font-extrabold text-emerald-400">{currentStage}</div>
        </div>
      </div>

      {/* Global Stage Switcher */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">Jump to Stage:</label>
        <div className="grid grid-cols-5 gap-2">
          {stages.map((stg) => (
            <button
              key={stg}
              onClick={() => setStage(stg)}
              className={`py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                currentStage === stg
                  ? 'bg-amber-500 text-slate-950 shadow-lg scale-105'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {stg}
            </button>
          ))}
        </div>
      </div>

      {/* Stage-Specific Controls */}
      <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
        <h2 className="text-lg font-semibold mb-4 text-slate-200">Active Stage Controls</h2>

        {/* ICEBREAKER CONTROLS */}
        {currentStage === 'ICEBREAKER' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">
              Current Icebreaker Status:{' '}
              <span className="font-bold text-amber-400">{stageState?.icebreaker?.status}</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={revealIcebreaker}
                className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-bold rounded-md"
              >
                Reveal Fake Fact
              </button>
              <button
                onClick={resetIcebreaker}
                className="bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm text-slate-300 rounded-md"
              >
                Reset Votes
              </button>
            </div>
          </div>
        )}

        {/* DISCUSSION CONTROLS */}
        {currentStage === 'DISCUSSION' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">Select Question to Pin for Members:</p>
            <div className="space-y-2">
              {stageState?.discussion?.questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setDiscussionQuestion(idx)}
                  className={`w-full text-left p-3 text-sm rounded-md border transition-all ${
                    stageState?.discussion?.activeQuestionIndex === idx
                      ? 'bg-amber-900/40 border-amber-500 text-amber-200 font-medium'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <span className="font-bold mr-2">Q{idx + 1}:</span> {q.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TRIVIA CONTROLS */}
        {currentStage === 'TRIVIA' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-300">
                Trivia Status:{' '}
                <span className="font-bold text-amber-400">{stageState?.trivia?.status}</span>
              </p>
              <button
                onClick={showTriviaLeaderboard}
                className="bg-purple-600 hover:bg-purple-500 px-3 py-1.5 text-xs font-bold rounded-md"
              >
                Show Leaderboard
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {stageState?.discussion?.questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => startTriviaQuestion(idx)}
                  className={`p-3 text-left rounded-md border transition-all ${
                    stageState?.discussion?.activeQuestionIndex === idx &&
                    stageState?.trivia?.status === 'IN_PROGRESS'
                      ? 'bg-emerald-900/40 border-emerald-500 text-emerald-200 font-medium'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <div className="text-xs font-bold text-amber-400 mb-1">Trigger Question {idx + 1}</div>
                  <div className="text-xs truncate">{q.text}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* LOBBY / WRAP_UP */}
        {(currentStage === 'LOBBY' || currentStage === 'WRAP_UP') && (
          <p className="text-sm text-slate-400 italic">
            Members are currently viewing the {currentStage.toLowerCase()} screen. Advance stage when ready.
          </p>
        )}
      </div>
    </div>
  );
}
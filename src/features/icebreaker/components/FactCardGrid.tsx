'use client';

import { useState } from 'react';
import { ref, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import { SessionData } from '@/features/live-session/hooks/useLiveState';

interface FactCardGridProps {
  session: SessionData | null;
  userId?: string;
}

export function FactCardGrid({ session, userId = 'user_member_1' }: FactCardGridProps) {
  const [localVote, setLocalVote] = useState<string | null>(null);

  // Directly extract icebreaker from live session prop
  const icebreaker = session?.stageState?.icebreaker;

  if (!icebreaker) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 bg-slate-800/50 rounded-2xl border border-slate-700/60">
        <p className="text-lg font-medium">Waiting for icebreaker data...</p>
      </div>
    );
  }

  // Live status check
  const isRevealed = icebreaker.status === 'REVEALED';
  const memberVotes = icebreaker.memberVotes || {};
  const activeVote = localVote || memberVotes[userId];

  // Calculate vote totals
  const totalVotes = Object.keys(memberVotes).length;
  const voteCounts: Record<string, number> = {};

  (icebreaker.facts || []).forEach((fact) => {
    voteCounts[fact.id] = 0;
  });

  Object.values(memberVotes).forEach((factId) => {
    if (voteCounts[factId] !== undefined) {
      voteCounts[factId] += 1;
    }
  });

  const handleVote = async (factId: string) => {
    if (isRevealed) return;
    setLocalVote(factId);

    const targetSessionId = session?.sessionId || 'active_session';

    try {
      await update(ref(db, `sessions/${targetSessionId}/stageState/icebreaker/memberVotes`), {
        [userId]: factId,
      });
    } catch (err) {
      console.error('Error voting:', err);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-400 bg-teal-950/60 border border-teal-800/50 px-2.5 py-1 rounded-full">
              Icebreaker Stage
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} cast
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white mt-2">Two Truths & A Lie</h2>
          <p className="text-slate-400 text-sm mt-1">
            Read the statements about <span className="text-teal-300 font-semibold">{icebreaker.country}</span> and vote on which one you think is fiction!
          </p>
        </div>
      </div>

      {/* Fact Cards */}
      <div className="grid grid-cols-1 gap-4">
        {icebreaker.facts.map((fact, index) => {
          const isSelected = activeVote === fact.id;
          const isFiction = fact.isFiction;
          const count = voteCounts[fact.id] || 0;
          const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;

          let cardStyle = 'border-slate-700/80 bg-slate-800/80 text-slate-200 hover:border-slate-500 hover:bg-slate-800';

          if (isRevealed) {
            if (isFiction) {
              cardStyle = 'border-rose-500/80 bg-rose-950/40 text-rose-100 ring-2 ring-rose-500/60 shadow-lg shadow-rose-950/50';
            } else {
              cardStyle = 'border-emerald-500/40 bg-slate-800/60 text-slate-300 opacity-80';
            }
          } else if (isSelected) {
            cardStyle = 'border-teal-500 bg-teal-950/40 text-teal-100 ring-2 ring-teal-500/60';
          }

          return (
            <button
              key={fact.id}
              disabled={isRevealed}
              onClick={() => handleVote(fact.id)}
              className={`relative overflow-hidden text-left p-5 rounded-xl border transition-all duration-300 shadow-sm flex flex-col gap-3 ${cardStyle}`}
            >
              {/* Poll Progress Bar */}
              {(isRevealed || activeVote) && (
                <div
                  className={`absolute left-0 bottom-0 top-0 opacity-20 transition-all duration-500 ${
                    isRevealed && isFiction ? 'bg-rose-500' : 'bg-teal-400'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              )}

              <div className="relative z-10 flex items-start gap-4 w-full">
                <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-slate-700/60 text-slate-300 font-bold text-xs border border-slate-600/50">
                  {index + 1}
                </span>

                <div className="flex-1">
                  <p className="text-base font-medium leading-relaxed">{fact.text}</p>
                </div>

                {isSelected && !isRevealed && (
                  <span className="flex-shrink-0 text-teal-400 text-xs font-semibold bg-teal-900/60 px-2.5 py-1 rounded border border-teal-700/50">
                    Your Vote
                  </span>
                )}
              </div>

              {/* Reveal Badges & Percentages */}
              <div className="relative z-10 flex items-center justify-between pt-1 text-xs">
                {isRevealed ? (
                  <div>
                    {isFiction ? (
                      <span className="inline-flex items-center gap-1 font-bold text-rose-300 bg-rose-900/80 px-2.5 py-1 rounded border border-rose-600 shadow-sm">
                        ✖ Fiction Statement
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-medium text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800/60">
                        ✓ True Fact
                      </span>
                    )}
                  </div>
                ) : (
                  <div />
                )}

                {(isRevealed || activeVote) && (
                  <span className="font-semibold text-slate-300 ml-auto">
                    {count} {count === 1 ? 'vote' : 'votes'} ({percentage}%)
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
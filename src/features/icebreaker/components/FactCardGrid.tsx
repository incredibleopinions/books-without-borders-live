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

  // 1. Standby Check: If icebreaker object is missing OR facts array hasn't been loaded yet
  if (!icebreaker || !icebreaker.facts || icebreaker.facts.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="flex items-center justify-between border-b border-card-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-white bg-btn-primary px-3 py-1 rounded-full shadow-sm">
                Icebreaker Stage
              </span>
            </div>
            <h2 className="text-2xl font-black text-primary mt-2">Four Facts & A Fiction</h2>
            <p className="text-muted text-xs md:text-sm mt-1">
              Read the statements about{' '}
              <span className="text-brand-accent font-bold">
                {session?.featuredCountry || "today's featured country"}
              </span>{' '}
              and vote on which one you think is fiction!
            </p>
          </div>
        </div>

        {/* Standby Message Card */}
        <div className="flex flex-col items-center justify-center p-10 text-center bg-card-bg rounded-2xl border border-card-border shadow-sm space-y-3">
          <div className="w-8 h-8 rounded-full bg-brand-accent/10 text-brand-accent flex items-center justify-center text-lg">
            🧊
          </div>
          <h3 className="text-base font-bold text-primary">Icebreaker Starting Shortly</h3>
          <p className="text-xs text-muted max-w-sm">
            The host is preparing the trivia statements. Hang tight...questions will appear here automatically in a moment!
          </p>
        </div>
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
      <div className="flex items-center justify-between border-b border-card-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-white bg-btn-primary px-3 py-1 rounded-full shadow-sm">
              Icebreaker Stage
            </span>
            <span className="text-xs text-muted font-medium">
              {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} cast
            </span>
          </div>
          <h2 className="text-2xl font-black text-primary mt-2">Four Facts & A Fiction</h2>
          <p className="text-muted text-xs md:text-sm mt-1">
            Read the statements about{' '}
            <span className="text-brand-accent font-bold">
              {session?.featuredCountry || "today's featured country"}
            </span>{' '}
            and vote on which one you think is fiction!
          </p>
        </div>
      </div>

      {/* Fact Cards */}
      <div className="grid grid-cols-1 gap-4">
        {(icebreaker?.facts || []).map((fact, idx) => {
          const isSelected = activeVote === fact.id;
          const votesForThis = Object.values(memberVotes).filter((id) => id === fact.id).length;
          const percentage = totalVotes > 0 ? Math.round((votesForThis / totalVotes) * 100) : 0;

          // Theme-aware base styling for unrevealed state
          let cardStyle = 'bg-card-bg border-card-border text-primary hover:border-brand-accent/50 shadow-sm';

          if (isSelected && !isRevealed) {
            cardStyle = 'bg-card-bg border-brand-accent text-primary ring-2 ring-brand-accent/40 shadow-md';
          }

          if (isRevealed) {
            if (fact.isFiction) {
              // Highlight FICTION in soft emerald green
              cardStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/50 shadow-md';
            } else if (isSelected && !fact.isFiction) {
              // Wrong guess styling
              cardStyle = 'bg-rose-50 border-rose-400 text-rose-950 ring-1 ring-rose-400/40';
            } else {
              // Regular revealed facts
              cardStyle = 'bg-card-bg border-card-border text-primary';
            }
          }

          return (
            <button
              key={fact.id}
              disabled={isRevealed}
              onClick={() => handleVote(fact.id)}
              className={`w-full p-4 rounded-2xl text-left border transition-all relative overflow-hidden ${cardStyle}`}
            >
              <div className="flex items-center justify-between gap-4 z-10 relative">
                <div className="flex items-start gap-3">
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5 ${
                      isSelected
                        ? 'bg-brand-accent text-white'
                        : 'bg-main text-muted border border-card-border'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="text-sm font-medium leading-relaxed">{fact.text}</span>
                </div>

                {/* Revealed Status Badges */}
                {isRevealed && (
                  <div className="shrink-0 flex items-center gap-2">
                    {fact.isFiction ? (
                      <span className="text-xs font-black px-3 py-1 bg-emerald-600 text-white rounded-lg uppercase tracking-wider shadow-sm">
                        FICTION
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-1 bg-main text-muted rounded-lg border border-card-border">
                        Fact
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Vote Count & Breakdown */}
              {(isSelected || isRevealed) && totalVotes > 0 && (
                <div className="mt-3 pt-2 border-t border-card-border flex items-center justify-between text-xs font-mono text-muted">
                  <span>{votesForThis} {votesForThis === 1 ? 'vote' : 'votes'}</span>
                  <span className="font-bold text-brand-accent">{percentage}%</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
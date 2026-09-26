'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import { SessionData } from '@/features/live-session/hooks/useLiveState';
import { TriviaStage } from '@/features/live-session/components/TriviaStage';

export default function LiveMemberPortalPage() {
  const sessionId = 'active_session';
  const [session, setSession] = useState<SessionData | null>(null);
  const [memberName, setMemberName] = useState<string>('');
  const [nameInput, setNameInput] = useState<string>('');
  const [isJoined, setIsJoined] = useState<boolean>(false);
  const [locationInput, setLocationInput] = useState<string>('');
  const [starRating, setStarRating] = useState<number>(5);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [ratingSubmitted, setRatingSubmitted] = useState<boolean>(false);

  useEffect(() => {
    const sessionRef = ref(db, `sessions/${sessionId}`);
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        setSession(snapshot.val() as SessionData);
      }
    });
    return () => unsubscribe();
  }, [sessionId]);

  useEffect(() => {
    const savedName = localStorage.getItem('bwb_member_name');
    if (savedName) {
      setMemberName(savedName);
      setIsJoined(true);
    }
  }, []);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    const trimmed = nameInput.trim();
    localStorage.setItem('bwb_member_name', trimmed);
    setMemberName(trimmed);
    setIsJoined(true);
  };

  const handleLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationInput.trim() || !memberName) return;
    await update(ref(db, `sessions/${sessionId}/stageState/lobby/checkIns`), {
      [memberName]: locationInput.trim(),
    });
    setLocationInput('');
  };

  const handleToggleHandRaise = async () => {
    if (!memberName) return;
    const currentQueue = session?.stageState?.discussion?.handQueue || [];
    const hasRaised = currentQueue.includes(memberName);

    const updatedQueue = hasRaised
      ? currentQueue.filter((name) => name !== memberName)
      : [...currentQueue, memberName];

    await update(ref(db, `sessions/${sessionId}/stageState/discussion`), {
      handQueue: updatedQueue,
    });
  };

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName) return;
    await update(ref(db, `sessions/${sessionId}/stageState/wrapUp/memberRatings`), {
      [memberName]: { rating: starRating, feedback: feedbackText },
    });
    setRatingSubmitted(true);
  };

  const currentStage = session?.currentStage || 'LOBBY';
  const icebreaker = session?.stageState?.icebreaker;
  const isRevealed = icebreaker?.status === 'REVEALED';
  const memberVotes = icebreaker?.memberVotes || {};
  const currentMemberVote = memberName ? memberVotes[memberName] : undefined;

  const handleVote = async (factId: string) => {
    if (!memberName) return;
    await update(ref(db, `sessions/${sessionId}/stageState/icebreaker/memberVotes`), {
      [memberName]: factId,
    });
  };

  // Determine Trivia Champion for Wrap-Up
  const scores = session?.stageState?.trivia?.scores || {};
  const topScorer = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];

  if (!isJoined) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-800/80 border border-slate-700/80 rounded-2xl p-8 space-y-6 shadow-2xl text-center">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-teal-400">
              Books Without Borders Club
            </span>
            <h1 className="text-2xl font-extrabold text-white">Join Live Session</h1>
            <p className="text-xs text-slate-400">Enter your name to participate in live voting, trivia, and discussions.</p>
          </div>

          <form onSubmit={handleJoin} className="space-y-4">
            <input
              type="text"
              placeholder="Your Name (e.g. Vish)"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="submit"
              disabled={!nameInput.trim()}
              className="w-full py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-lg"
            >
              Enter Live Portal
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-6 md:p-10">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex items-center justify-between bg-slate-800/60 border border-slate-700/60 p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <div>
              <p className="text-xs text-slate-400 font-medium">Live Session</p>
              <h1 className="text-base font-bold text-white">
                {session?.featuredCountry || 'Georgia'} Club Discussion
              </h1>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Connected as</span>
            <span className="text-xs font-bold text-teal-300 font-mono">{memberName}</span>
          </div>
        </div>

        {/* 1. LOBBY STAGE */}
        {currentStage === 'LOBBY' && (
          <div className="space-y-6">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 md:p-8 space-y-4 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Welcome to Books Without Borders</span>
              <h2 className="text-2xl font-black text-white">
                Exploring {session?.featuredCountry || 'Georgia'}
              </h2>
              <p className="text-xs text-slate-400 max-w-lg mx-auto">
                We are settling in before kicking off the icebreaker and book discussion. Grab a tea and share where you're tuning in from!
              </p>
            </div>

            {/* Check-In Form */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                📍 Where are you tuning in from today?
              </h3>
              <form onSubmit={handleLocationSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Toronto, Canada"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  type="submit"
                  disabled={!locationInput.trim()}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all"
                >
                  Share
                </button>
              </form>

              {/* Live Location Roll */}
              <div className="flex flex-wrap gap-2 pt-2">
                {Object.entries(session?.stageState?.lobby?.checkIns || {}).map(([name, loc]) => (
                  <span key={name} className="bg-slate-900/80 border border-slate-700 text-xs px-3 py-1.5 rounded-lg text-slate-300">
                    <strong className="text-teal-400">{name}</strong>: {loc}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. ICEBREAKER STAGE */}
        {currentStage === 'ICEBREAKER' && (
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Icebreaker Stage</span>
              <h2 className="text-xl font-extrabold text-white">Two Truths & One Fiction</h2>
              <p className="text-xs text-slate-400">
                Click the statement below that you believe is <strong>fiction</strong>!
              </p>
            </div>

            <div className="space-y-3">
              {(icebreaker?.facts || []).map((fact, idx) => {
                const isSelected = currentMemberVote === fact.id;
                const totalVotes = Object.keys(memberVotes).length;
                const votesForThis = Object.values(memberVotes).filter((id) => id === fact.id).length;
                const percentage = totalVotes > 0 ? Math.round((votesForThis / totalVotes) * 100) : 0;

                let cardStyle = 'bg-slate-900/80 border-slate-700 hover:border-slate-600 text-slate-200';

                if (isSelected) {
                  cardStyle = 'bg-teal-950/80 border-teal-500 text-teal-200 ring-2 ring-teal-500/50';
                }

                if (isRevealed) {
                  if (fact.isFiction) {
                    cardStyle = 'bg-rose-950/80 border-rose-500 text-rose-200 ring-2 ring-rose-500/50';
                  } else {
                    cardStyle = 'bg-slate-900/40 border-slate-800 text-slate-500 opacity-60';
                  }
                }

                return (
                  <button
                    key={fact.id}
                    disabled={isRevealed}
                    onClick={() => handleVote(fact.id)}
                    className={`w-full p-4 rounded-xl text-left border transition-all relative overflow-hidden ${cardStyle}`}
                  >
                    <div className="flex items-center justify-between gap-4 z-10 relative">
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium leading-relaxed">{fact.text}</span>
                      </div>
                      {isRevealed && fact.isFiction && (
                        <span className="text-xs font-bold px-2.5 py-1 bg-rose-500 text-white rounded-md shrink-0 uppercase">
                          Fiction!
                        </span>
                      )}
                    </div>

                    {(isSelected || isRevealed) && totalVotes > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
                        <span>{votesForThis} votes</span>
                        <span>{percentage}%</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. DISCUSSION STAGE */}
        {currentStage === 'DISCUSSION' && (
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Discussion Question</span>
                <p className="text-xs text-slate-400">
                  Question {(session?.stageState?.discussion?.activeQuestionIndex || 0) + 1} of{' '}
                  {session?.stageState?.discussion?.questions?.length || 1}
                </p>
              </div>
              <button
                onClick={handleToggleHandRaise}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  (session?.stageState?.discussion?.handQueue || []).includes(memberName)
                    ? 'bg-amber-600 text-white shadow-lg ring-2 ring-amber-400'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }`}
              >
                ✋ {(session?.stageState?.discussion?.handQueue || []).includes(memberName) ? 'Lower Hand' : 'Raise Hand'}
              </button>
            </div>

            <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-700/70">
              <p className="text-lg md:text-xl font-semibold text-white leading-relaxed">
                {session?.stageState?.discussion?.questions?.[session?.stageState?.discussion?.activeQuestionIndex || 0]?.text ||
                  'No discussion question loaded.'}
              </p>
            </div>

            {/* Hand Raise Queue Display */}
            {(session?.stageState?.discussion?.handQueue || []).length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Speaking Queue:</span>
                <div className="flex flex-wrap gap-2">
                  {session?.stageState?.discussion?.handQueue?.map((name, idx) => (
                    <span key={name} className="bg-teal-950 border border-teal-600/80 text-teal-200 text-xs px-3 py-1 rounded-lg font-mono font-bold flex items-center gap-1.5">
                      <span>#{idx + 1}</span>
                      <span>{name}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. TRIVIA STAGE */}
        {currentStage === 'TRIVIA' && session && (
          <TriviaStage session={session} memberName={memberName} />
        )}

        {/* 5. WRAP-UP STAGE */}
        {currentStage === 'WRAP_UP' && (() => {

  const ratingsObj = session?.stageState?.wrapUp?.memberRatings || {};
  const entries = Object.values(ratingsObj);
  const totalSubmissions = entries.length;

  const averageRating = totalSubmissions > 0
    ? (entries.reduce((acc, curr) => acc + curr.rating, 0) / totalSubmissions).toFixed(1)
    : null;

    return (
    <><div className="space-y-6">
        {/* Live Community Rating Banner */}
        {averageRating && (
          <div className="bg-slate-800/80 border border-teal-500/40 rounded-2xl p-6 text-center space-y-2 shadow-xl animate-fadeIn">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
              Group Average Rating
            </span>
            <div className="text-3xl font-black text-amber-400 flex items-center justify-center gap-2">
              <span>⭐ {averageRating}</span>
              <span className="text-sm font-normal text-slate-400">/ 5.0</span>
            </div>
            <p className="text-xs text-slate-400">
              Based on {totalSubmissions} {totalSubmissions === 1 ? 'member rating' : 'member ratings'}
            </p>
          </div>
        )}

        {/* Existing Member Rating Input Form... */}
      </div><div className="space-y-6 animate-fadeIn">
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl text-center">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-teal-400">Session Complete</span>
              <h2 className="text-3xl font-black text-white">Thank You for Joining! 🎉</h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Another fantastic gathering exploring stories from around the globe.
              </p>
            </div>

            {/* Trivia Winner Spotlight */}
            {topScorer && (
              <div className="bg-amber-950/40 border border-amber-500/60 rounded-2xl p-5 space-y-1 max-w-md mx-auto">
                <span className="text-2xl">🏆</span>
                <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider">Trivia Champion</h3>
                <p className="text-lg font-black text-white">{topScorer[0]} ({topScorer[1]} pts)</p>
                <p className="text-[11px] text-amber-200/70">
                  We will contact you directly regarding your book prize!
                </p>
              </div>
            )}

            {/* Next Month Announcement Card */}
            {session?.nextMonth && (
              <div className="bg-slate-900/80 border border-teal-500/40 rounded-2xl p-6 space-y-3 text-left">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">Next Month's Destination</span>
                  <span className="text-xs font-mono font-bold bg-teal-950 text-teal-300 border border-teal-800 px-2.5 py-0.5 rounded-full">
                    {session.nextMonth.country}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-lg font-black text-white">{session.nextMonth.bookTitle}</h4>
                  <p className="text-xs text-slate-400">by {session.nextMonth.author}</p>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-slate-300 font-mono">
                  <span>📅 {session.nextMonth.meetingDate}</span>
                  <span>⏰ {session.nextMonth.meetingTime}</span>
                </div>
              </div>
            )}

            {/* Quick Feedback Form */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4 text-left">
              {/* <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Rate Today's Discussion</h3> */}

              {ratingSubmitted ? (
                <p className="text-xs font-semibold text-emerald-400">
                  Thank you! Your feedback has been saved. See you next month!
                </p>
              ) : (
                <form onSubmit={handleRatingSubmit} className="space-y-3">

                  <div className="text-center space-y-2">
  <h2 className="text-xl font-bold text-white">
    How many stars would you give <span className="text-teal-400 italic">{session?.featuredBook || "this month's book"}</span>?
  </h2>
  <p className="text-xs text-slate-400">
    Share your rating with the club to calculate our final group score!
  </p>
</div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setStarRating(star)}
                        className={`text-xl transition-all ${star <= starRating ? 'opacity-100 scale-110' : 'opacity-30'}`}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>

                  <textarea
                    placeholder="Optional feedback or suggestions for future books..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    rows={2}
                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500" />

                  <button
                    type="submit"
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs transition-all"
                  >
                    Submit Reflection
                  </button>
                </form>
              )}
            </div>
          </div>
        </div></>
          );
})()}
      </div>
    </div>
  );
}
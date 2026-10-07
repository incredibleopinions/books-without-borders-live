'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ref, onValue, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import { SessionData } from '@/features/live-session/hooks/useLiveState';
import { extractZoomDetailsFromSession } from '@/features/live-session/lib/extractZoomDetails';
import { TriviaStage } from '@/features/live-session/components/TriviaStage';
import { FactCardGrid } from '@/features/icebreaker/components/FactCardGrid';

const ZoomEmbeddedClient = dynamic(
  () => import('@/features/live-session/components/ZoomEmbeddedClient'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[500px] rounded-2xl border border-card-border bg-black/90 flex items-center justify-center">
        <p className="text-xs text-muted">Loading live video session...</p>
      </div>
    ),
  }
);

export default function LiveMemberPortalPage() {
  const sessionId = 'active_session';
  const [session, setSession] = useState<SessionData | null>(null);
  const [memberName, setMemberName] = useState<string>('');
  const [nameInput, setNameInput] = useState<string>('');
  const [isJoined, setIsJoined] = useState<boolean>(false);
  const [locationInput, setLocationInput] = useState<string>('');
  const [starRating, setStarRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
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
    if (savedName) setNameInput(savedName);
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
    if (!memberName || !starRating) return;

    await update(ref(db, `sessions/${sessionId}/stageState/wrapUp/memberRatings`), {
      [memberName]: { rating: starRating, feedback: feedbackText },
    });
    setRatingSubmitted(true);
  };

  const { meetingId, passcode } = extractZoomDetailsFromSession(session);
  const currentStage = session?.currentStage || 'LOBBY';

  // Determine Trivia Champion for Wrap-Up
  const scores = session?.stageState?.trivia?.scores || {};
  const topScorer = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];

  if (!isJoined) {
    return (
      <main className="theme-bookclub-warm bg-main text-primary min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-card-bg border border-card-border rounded-2xl p-8 space-y-6 shadow-2xl text-center">
          <div className="flex flex-col items-center space-y-3">
            <div className="relative w-36 h-20 mx-auto shrink-0">
              <Image
                src="/logo.png"
                alt="Books Without Borders"
                fill
                sizes="144px"
                className="object-contain object-bottom -mr-1"
                priority
              />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-brand-accent mt-1">
              Books Without Borders Club
            </span>
            <h1 className="text-2xl font-extrabold text-primary mt-1">
              Join Live Session
            </h1>
            <p className="text-xs text-muted mt-1.5">
              Enter your name to participate in live voting, trivia, and discussions.
            </p>
          </div>

          <form onSubmit={handleJoin} className="space-y-4">
            <input
              type="text"
              placeholder="Your Name (e.g. Vish)"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full px-4 py-3 bg-main border border-card-border rounded-xl text-primary placeholder:text-muted text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
            <button
              type="submit"
              disabled={!nameInput.trim()}
              className="w-full py-3 bg-btn-primary hover:bg-btn-primary-hover disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-lg"
            >
              Enter Live Portal
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <div className="theme-bookclub-warm bg-main text-primary min-h-screen flex flex-col w-full overflow-x-hidden">
      
      {/* Top Header Bar */}
      <header className="w-full h-16 border-b border-card-border bg-card-bg px-4 sm:px-6 flex items-center justify-between sticky top-0 z-50 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 shrink-0">
            <Image
              src="/logo.png"
              alt="Books Without Borders"
              fill
              sizes="40px"
              className="object-contain"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] sm:text-xs text-brand-accent font-bold tracking-wider uppercase">
                Books Without Borders
              </p>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-primary leading-tight">
              {session?.featuredCountry
                ? `${session?.featuredCountry} Reading Lounge`
                : 'Live Reading Lounge'}
            </h1>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-muted uppercase tracking-wider block">Connected as</span>
          <span className="text-xs font-bold text-brand-accent font-mono">{memberName}</span>
        </div>
      </header>

      {/* Full-Width Workspace Grid */}
      <main className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6 lg:p-8 max-w-[1800px] mx-auto">
        
        {/* LEFT COLUMN: Sticky Zoom Embedded Container (7 Cols on LG, 8 Cols on XL) */}
        <section className="lg:col-span-7 xl:col-span-8 flex flex-col w-full">
          <div className="w-full h-[500px] lg:h-[calc(100vh-140px)] rounded-2xl overflow-hidden border border-card-border bg-black shadow-lg sticky top-20 flex flex-col">
            {meetingId && session?.zoomReady ? (
              <ZoomEmbeddedClient
                meetingNumber={meetingId}
                passCode={passcode}
                meetingLink={session?.meetingZoomLink}
                userName={memberName || 'BWBC Member'}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-card-bg/40">
                <div className="w-12 h-12 rounded-full bg-brand-accent/10 text-brand-accent flex items-center justify-center mb-3 text-xl">
                  🎥
                </div>
                <p className="font-bold text-sm text-primary">Zoom will start here</p>
                <p className="text-xs text-muted mt-1 max-w-sm">
                  The video room opens when the host loads this month&apos;s meeting. A saved meeting link will not start it on its own.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: Stage Interactive Workspace Panel (5 Cols on LG, 4 Cols on XL) */}
        <section className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6 overflow-y-auto lg:max-h-[calc(100vh-140px)] pr-1">
          
          {/* 1. LOBBY STAGE */}
          {currentStage === 'LOBBY' && (
            <div className="space-y-6">
              <div className="bg-card-bg border border-card-border rounded-2xl p-6 space-y-3 text-center shadow-sm">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-accent">
                  Welcome to Books Without Borders
                </span>
                <h2 className="text-2xl font-black text-primary">
                  {session?.featuredCountry
                    ? `Exploring ${session?.featuredCountry}`
                    : "Welcome to Today's Session"}
                </h2>
                <p className="text-xs text-muted leading-relaxed max-w-xs mx-auto">
                  We are settling in before kicking off the icebreaker and book discussion.
                  Grab a tea and share where you're tuning in from!
                </p>
              </div>

              {/* Check-In Form */}
              <div className="bg-card-bg border border-card-border rounded-2xl p-6 space-y-4 shadow-sm">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider">
                  📍 Where are you tuning in from today?
                </h3>
                <form onSubmit={handleLocationSubmit} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Toronto, Canada"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-main border border-card-border rounded-xl text-xs text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  />
                  <button
                    type="submit"
                    disabled={!locationInput.trim()}
                    className="px-5 py-2.5 bg-btn-primary hover:bg-btn-primary-hover disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-sm"
                  >
                    Share
                  </button>
                </form>

                {/* Live Location Roll */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {Object.entries(session?.stageState?.lobby?.checkIns || {}).map(([name, loc]) => (
                    <span key={name} className="bg-main border border-card-border text-xs px-3 py-1.5 rounded-lg text-primary">
                      <strong className="text-brand-accent">{name}</strong>: {loc}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. ICEBREAKER STAGE */}
          {currentStage === 'ICEBREAKER' && (
            <div className="bg-card-bg border border-card-border rounded-2xl p-4 sm:p-6 shadow-sm">
              <FactCardGrid session={session} userId={memberName} />
            </div>
          )}

          {/* 3. DISCUSSION STAGE */}
          {currentStage === 'DISCUSSION' && (() => {
            const discussion = session?.stageState?.discussion;
            const questions = discussion?.questions || [];
            const activeIdx = discussion?.activeQuestionIndex || 0;
            const currentQuestion = questions[activeIdx];
            const hasQuestions = questions.length > 0 && !!currentQuestion;

            return (
              <div className="bg-card-bg border border-card-border rounded-2xl p-6 space-y-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-card-border pb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-accent">
                      Discussion Stage
                    </span>
                    {hasQuestions ? (
                      <p className="text-xs text-muted mt-0.5">
                        Question {activeIdx + 1} of {questions.length}
                      </p>
                    ) : (
                      <h2 className="text-lg font-black text-primary mt-1">Book Discussion</h2>
                    )}
                  </div>

                  <button
                    onClick={handleToggleHandRaise}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      (discussion?.handQueue || []).includes(memberName)
                        ? 'bg-brand-accent text-white shadow-lg ring-2 ring-brand-accent/40'
                        : 'bg-main border border-card-border hover:opacity-80 text-primary'
                    }`}
                  >
                    ✋ {(discussion?.handQueue || []).includes(memberName) ? 'Lower Hand' : 'Raise Hand'}
                  </button>
                </div>

                {hasQuestions ? (
                  <div className="bg-main p-5 rounded-2xl border border-card-border">
                    <p className="text-base sm:text-lg font-semibold text-primary leading-relaxed">
                      {currentQuestion.text}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center bg-main rounded-2xl border border-card-border space-y-3">
                    <div className="w-8 h-8 rounded-full bg-brand-accent/10 text-brand-accent flex items-center justify-center text-lg">
                      💬
                    </div>
                    <h3 className="text-sm font-bold text-primary">Discussion Starting Shortly</h3>
                    <p className="text-xs text-muted max-w-sm">
                      The host is getting the discussion prompts ready. Questions will appear on your screen as we move through the conversation!
                    </p>
                  </div>
                )}

                {(discussion?.handQueue || []).length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-card-border/50">
                    <span className="text-xs font-bold text-muted uppercase tracking-wider">Speaking Queue:</span>
                    <div className="flex flex-wrap gap-2">
                      {discussion?.handQueue?.map((name, idx) => (
                        <span key={name} className="bg-main border border-card-border text-primary text-xs px-3 py-1 rounded-lg font-mono font-bold flex items-center gap-1.5">
                          <span className="text-brand-accent">#{idx + 1}</span>
                          <span>{name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* 4. TRIVIA STAGE */}
          {currentStage === 'TRIVIA' && session && (
            <div className="bg-card-bg border border-card-border rounded-2xl p-4 sm:p-6 shadow-sm">
              <TriviaStage session={session} memberName={memberName} />
            </div>
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
              <div className="space-y-6">
                {averageRating && (
                  <div className="bg-card-bg border border-card-border rounded-2xl p-6 text-center space-y-2 shadow-sm">
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-accent">
                      Group Average Rating
                    </span>
                    <div className="text-3xl font-black text-brand-accent flex items-center justify-center gap-2">
                      <span>⭐ {averageRating}</span>
                      <span className="text-sm font-normal text-muted">/ 5.0</span>
                    </div>
                    <p className="text-xs text-muted">
                      Based on {totalSubmissions} {totalSubmissions === 1 ? 'member rating' : 'member ratings'}
                    </p>
                  </div>
                )}

                <div className="bg-card-bg border border-card-border rounded-2xl p-6 space-y-6 shadow-sm text-center">
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">Session Complete</span>
                    <h2 className="text-2xl font-black text-primary">Thank You for Joining! 🎉</h2>
                    <p className="text-xs text-muted max-w-md mx-auto">
                      Another fantastic gathering exploring stories from around the globe.
                    </p>
                  </div>

                  {topScorer && (
                    <div className="bg-main border border-card-border rounded-2xl p-5 space-y-1 max-w-md mx-auto">
                      <span className="text-2xl">🏆</span>
                      <h3 className="text-xs font-bold text-brand-accent uppercase tracking-wider">Trivia Champion</h3>
                      <p className="text-lg font-black text-primary">{topScorer[0]} ({topScorer[1]} pts)</p>
                      <p className="text-[11px] text-muted">
                        We will contact you directly regarding your book prize!
                      </p>
                    </div>
                  )}

                  {session?.nextMonth && (
                    <div className="bg-main border border-card-border rounded-2xl p-5 space-y-3 text-left">
                      <div className="flex items-center justify-between border-b border-card-border pb-3">
                        <span className="text-xs font-bold text-brand-accent uppercase tracking-wider">Next Month's Destination</span>
                        <span className="text-xs font-mono font-bold bg-card-bg text-primary border border-card-border px-2.5 py-0.5 rounded-full">
                          {session.nextMonth.country}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-base font-black text-primary">{session.nextMonth.bookTitle}</h4>
                        <p className="text-xs text-muted">by {session.nextMonth.author}</p>
                      </div>

                      <div className="pt-2 flex items-center justify-between text-xs text-primary font-mono">
                        <span>📅 {session.nextMonth.meetingDate}</span>
                        <span>⏰ {session.nextMonth.meetingTime}</span>
                      </div>
                    </div>
                  )}

                  <div className="bg-main border border-card-border rounded-2xl p-5 space-y-4 text-left">
                    {ratingSubmitted ? (
                      <p className="text-xs font-semibold text-emerald-600 text-center">
                        Thank you! Your feedback has been saved. See you next month!
                      </p>
                    ) : (
                      <form onSubmit={handleRatingSubmit} className="space-y-4">
                        <div className="text-center space-y-2">
                          <h2 className="text-lg font-bold text-primary">
                            How many stars would you give <span className="text-brand-accent italic">{session?.featuredBook || "Heart Lamp"}</span>?
                          </h2>
                          <p className="text-xs text-muted">
                            Click a star to rate this month's book for our group average!
                          </p>
                        </div>

                        <div className="flex gap-2 justify-center py-2">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const activeRating = hoverRating !== null ? hoverRating : starRating;
                            const isFilled = activeRating !== null && star <= activeRating;

                            return (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setStarRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(null)}
                                className={`text-2xl transition-all transform hover:scale-125 focus:outline-none ${
                                  isFilled ? 'text-amber-500 scale-110' : 'text-muted hover:text-amber-400'
                                }`}
                                aria-label={`Rate ${star} out of 5 stars`}
                              >
                                {isFilled ? '★' : '☆'}
                              </button>
                            );
                          })}
                        </div>

                        <textarea
                          placeholder="Optional feedback or suggestions for future books..."
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          rows={2}
                          className="w-full p-3 bg-card-bg border border-card-border rounded-xl text-xs text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-accent"
                        />

                        <button
                          type="submit"
                          disabled={!starRating}
                          className="w-full py-3 bg-btn-primary hover:bg-btn-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs transition-all shadow-lg"
                        >
                          {starRating ? `Submit ${starRating}-Star Rating` : 'Select a Star Rating'}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </section>

      </main>
    </div>
  );
}
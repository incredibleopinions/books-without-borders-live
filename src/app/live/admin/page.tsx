'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { ref, onValue, set, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import { SessionData, SessionStage } from '@/features/live-session/hooks/useLiveState';

// Current Month Details File Importer
function CurrentMonthImporter({ sessionId }: { sessionId: string }) {
  const [statusMsg, setStatusMsg] = useState('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        await update(ref(db, `sessions/${sessionId}`), {
          featuredCountry: data.country || data.featuredCountry || '',
          featuredBook: data.bookTitle || data.featuredBook || '',
          featuredAuthor: data.author || data.featuredAuthor || '',
          meetingZoomLink: data.meetingZoomLink || data.zoomLink || '',
        });

        setStatusMsg(`Loaded "${data.bookTitle || data.featuredBook || 'book'}" into live session!`);
      } catch (err: any) {
        setStatusMsg(`Error parsing file: ${err.message}`);
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-4 space-y-2">
      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
        📚 Upload Current Month JSON
      </span>
      <input
        type="file"
        accept=".json"
        onChange={handleFileUpload}
        className="block w-full text-xs text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-600 file:text-white hover:file:bg-teal-500 cursor-pointer"
      />
      {statusMsg && (
        <p className={`text-xs ${statusMsg.includes('Error') ? 'text-rose-400' : 'text-emerald-400'}`}>
          {statusMsg}
        </p>
      )}
    </div>
  );
}

// Icebreaker Details File Importer
function IcebreakerImporter({ sessionId }: { sessionId: string }) {
  const [statusMsg, setStatusMsg] = useState('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const icebreakerData = JSON.parse(e.target?.result as string);

        await update(ref(db, `sessions/${sessionId}/stageState/icebreaker`), {
          country: icebreakerData.country || '',
          facts: icebreakerData.facts || [],
          status: 'VOTING',
        });

        setStatusMsg(`Successfully loaded icebreaker for ${icebreakerData.country || 'country'}!`);
      } catch (err: any) {
        setStatusMsg(`Error parsing file: ${err.message}`);
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-4 space-y-2">
      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
        🧊 Import Icebreaker JSON
      </span>
      <input
        type="file"
        accept=".json"
        onChange={handleFileUpload}
        className="block w-full text-xs text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-600 file:text-white hover:file:bg-teal-500 cursor-pointer"
      />
      {statusMsg && (
        <p className={`text-xs ${statusMsg.includes('Error') ? 'text-rose-400' : 'text-emerald-400'}`}>
          {statusMsg}
        </p>
      )}
    </div>
  );
}

// Discussion Questions File Importer
function DiscussionImporter({ sessionId }: { sessionId: string }) {
  const [statusMsg, setStatusMsg] = useState('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const questions = JSON.parse(e.target?.result as string);

        if (!Array.isArray(questions)) {
          throw new Error('Invalid format: File must contain an array of objects.');
        }

        await update(ref(db, `sessions/${sessionId}/stageState/discussion`), {
          questions: questions,
          activeQuestionIndex: 0,
        });

        setStatusMsg(`Successfully loaded ${questions.length} discussion questions!`);
      } catch (err: any) {
        setStatusMsg(`Error parsing file: ${err.message}`);
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-4 space-y-2">
      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
        📁 Import Discussion Questions JSON
      </span>
      <input
        type="file"
        accept=".json"
        onChange={handleFileUpload}
        className="block w-full text-xs text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-600 file:text-white hover:file:bg-teal-500 cursor-pointer"
      />
      {statusMsg && (
        <p className={`text-xs ${statusMsg.includes('Error') ? 'text-rose-400' : 'text-emerald-400'}`}>
          {statusMsg}
        </p>
      )}
    </div>
  );
}

// Next Month Details File Importer
function NextMonthImporter({ sessionId }: { sessionId: string }) {
  const [statusMsg, setStatusMsg] = useState('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const nextMonthData = JSON.parse(e.target?.result as string);

        await update(ref(db, `sessions/${sessionId}`), {
          nextMonth: nextMonthData,
        });

        setStatusMsg(`Updated next month info for ${nextMonthData.country || 'upcoming session'}!`);
      } catch (err: any) {
        setStatusMsg(`Error parsing file: ${err.message}`);
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-4 space-y-2">
      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
        🗓️ Import Next Month Details JSON
      </span>
      <input
        type="file"
        accept=".json"
        onChange={handleFileUpload}
        className="block w-full text-xs text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-600 file:text-white hover:file:bg-teal-500 cursor-pointer"
      />
      {statusMsg && (
        <p className={`text-xs ${statusMsg.includes('Error') ? 'text-rose-400' : 'text-emerald-400'}`}>
          {statusMsg}
        </p>
      )}
    </div>
  );
}

// Inlined Trivia Uploader
function TriviaImporter({ sessionId }: { sessionId: string }) {
  const [statusMsg, setStatusMsg] = useState('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const questions = JSON.parse(e.target?.result as string);

        if (!Array.isArray(questions)) {
          throw new Error('Invalid format: File must contain an array of questions.');
        }

        await update(ref(db, `sessions/${sessionId}/stageState/trivia`), {
          questions: questions,
          currentQuestionIndex: 0,
          status: 'READY',
        });

        setStatusMsg(`Successfully loaded ${questions.length} trivia questions!`);
      } catch (err: any) {
        setStatusMsg(`Error parsing file: ${err.message}`);
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-3">
      <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
        Quick Trivia Import
      </h3>
      <p className="text-xs text-slate-400">
        Upload a `.json` file from your trivia creator to instantly update live questions.
      </p>

      <input
        type="file"
        accept=".json"
        onChange={handleFileUpload}
        className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-600 file:text-white hover:file:bg-teal-500 cursor-pointer"
      />

      {statusMsg && (
        <p className={`text-xs font-medium ${statusMsg.includes('Error') ? 'text-rose-400' : 'text-emerald-400'}`}>
          {statusMsg}
        </p>
      )}
    </div>
  );
}

// Inlined Host Trivia Controller
function HostTriviaController({ session }: { session: SessionData }) {
  const sessionId = session.sessionId;
  const trivia = session.stageState?.trivia;
  const questions = trivia?.questions || [];
  const currentIndex = trivia?.currentQuestionIndex ?? 0;
  const status = trivia?.status || 'IDLE';

  const participants = Object.keys(trivia?.participants || {});
  const currentResponses = trivia?.responses?.[currentIndex] || {};

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
    <div className="space-y-6 animate-fadeIn">
      <TriviaImporter sessionId={sessionId} />

      {questions.length > 0 && (
        <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Live Trivia Controller</h2>
              <p className="text-slate-400 text-xs mt-0.5">
                Question <strong className="text-teal-400">{currentIndex + 1}</strong> of {questions.length}
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-teal-950 border border-teal-500 text-teal-300">
              Status: {status}
            </span>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/50 space-y-2 text-xs">
            <span className="text-slate-400 uppercase font-bold tracking-wider">Active Question</span>
            <p className="text-slate-200 text-sm font-semibold">{questions[currentIndex]?.question}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={startQuestionTimer}
              disabled={status === 'IN_PROGRESS'}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-md transition-all"
            >
              ⏱️ Reveal Options & Start Timer
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

          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <span>Timer Duration:</span>
            <select
              value={trivia?.timeLimitSeconds || 10}
              onChange={async (e) => {
                await update(ref(db, `sessions/${sessionId}/stageState/trivia`), {
                  timeLimitSeconds: Number(e.target.value),
                });
              }}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-teal-400 focus:outline-none"
            >
              <option value={5}>5 seconds</option>
              <option value={10}>10 seconds</option>
              <option value={15}>15 seconds</option>
              <option value={20}>20 seconds</option>
            </select>
          </div>

          <div className="pt-4 border-t border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Live Active Players ({participants.length})
              </h3>
              <span className="text-xs text-slate-400">
                Answered Question {currentIndex + 1}: <strong className="text-teal-400">{Object.keys(currentResponses).length} / {participants.length}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {participants.length > 0 ? (
                participants.map((name) => {
                  const resp = currentResponses[name];
                  const hasAnswered = !!resp;
                  const isCorrect = resp?.isCorrect;

                  return (
                    <div
                      key={name}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
                        hasAnswered
                          ? isCorrect
                            ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200'
                            : 'bg-rose-950/40 border-rose-700/60 text-rose-200'
                          : 'bg-slate-900/50 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-medium">
                        <span className={`w-2 h-2 rounded-full ${hasAnswered ? 'bg-teal-400' : 'bg-slate-600'}`} />
                        <span>{name}</span>
                      </div>

                      <span className="font-mono text-[11px]">
                        {hasAnswered ? (
                          <span>Option {String.fromCharCode(65 + resp.selectedOption)} ({resp.scoreAwarded}pts)</span>
                        ) : (
                          <span className="italic text-slate-500">Thinking...</span>
                        )}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full p-4 bg-slate-900/40 rounded-xl text-center text-xs text-slate-500 italic">
                  No active members connected on `/live` yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const INITIAL_SESSION_DATA: SessionData = {
sessionId: 'active_session',
  featuredCountry: '', // Empty string allows fallback check
  featuredBook: '',
  featuredAuthor: '',
  meetingZoomLink: '',
  currentStage: 'LOBBY',
    nextMonth: {
    country: '',
    bookTitle: '',
    author: '',
    meetingDate: '',
    meetingTime: '',
  },
  stageState: {
    lobby: {
      checkIns: {},
    },
    icebreaker: {
      country: '',
      status: 'VOTING',
      facts: [],
      memberVotes: {},
    },
    discussion: {
      activeQuestionIndex: 0,
      questions: [],
      handQueue: [],
    },
    trivia: {
      status: 'IDLE',
      currentQuestionIndex: 0,
      timeLimitSeconds: 10,
      questions: [],
    },
    wrapUp: {
      memberRatings: {},
    },
  },
};

export default function AdminDashboardPage() {
  const [session, setSession] = useState<SessionData | null>(null);
  const sessionId = 'active_session';

  useEffect(() => {
    const sessionRef = ref(db, `sessions/${sessionId}`);
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        setSession(snapshot.val() as SessionData);
      }
    });
    return () => unsubscribe();
  }, []);

  const currentStage = session?.currentStage || 'LOBBY';
  const icebreaker = session?.stageState?.icebreaker;
  const icebreakerStatus = icebreaker?.status || 'VOTING';
  const memberVotes = icebreaker?.memberVotes || {};

  const discussion = session?.stageState?.discussion;
  const discussionQuestions = discussion?.questions || [];
  const activeDiscIdx = discussion?.activeQuestionIndex ?? 0;

  const updateStage = async (stage: SessionStage) => {
    await update(ref(db, `sessions/${sessionId}`), {
      currentStage: stage,
    });
  };

  const toggleRevealFakeFact = async () => {
    const nextStatus = icebreakerStatus === 'VOTING' ? 'REVEALED' : 'VOTING';
    await update(ref(db, `sessions/${sessionId}/stageState/icebreaker`), {
      status: nextStatus,
    });
  };

  const setDiscussionIndex = async (index: number) => {
    await update(ref(db, `sessions/${sessionId}/stageState/discussion`), {
      activeQuestionIndex: index,
    });
  };

  const clearHandQueue = async () => {
    await update(ref(db, `sessions/${sessionId}/stageState/discussion`), {
      handQueue: [],
    });
  };

  const initializeOrResetSession = async () => {
    await set(ref(db, `sessions/${sessionId}`), INITIAL_SESSION_DATA);
  };

  const totalVotes = Object.keys(memberVotes).length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Live Host Controls
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white mt-1">Books Without Borders Club</h1>
          </div>
          <button
            onClick={initializeOrResetSession}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            Reset Session State
          </button>
        </div>

        {/* Global Importers Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CurrentMonthImporter sessionId={sessionId} />
          <NextMonthImporter sessionId={sessionId} />
        </div>

        {/* Stage Controller */}
        <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Select Live Stage</h2>
            <span className="text-xs font-medium text-slate-400">
              Current Stage: <span className="text-teal-400 font-bold">{currentStage}</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {(['LOBBY', 'ICEBREAKER', 'DISCUSSION', 'TRIVIA', 'WRAP_UP'] as const).map((stage) => {
              const isActive = currentStage === stage;
              const displayLabel = stage === 'WRAP_UP' ? 'WRAP-UP' : stage;

              return (
                <button
                  key={stage}
                  onClick={() => updateStage(stage)}
                  className={`py-3.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                    isActive
                      ? 'bg-teal-600 border-teal-500 text-white shadow-lg shadow-teal-900/40 ring-2 ring-teal-400/50'
                      : 'bg-slate-800 border-slate-700/80 text-slate-300 hover:bg-slate-750 hover:border-slate-600'
                  }`}
                >
                  {displayLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* LOBBY CONTROLLER */}
        {currentStage === 'LOBBY' && (
          <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-white">Lobby Check-Ins</h2>
            <div className="space-y-2">
              {Object.keys(session?.stageState?.lobby?.checkIns || {}).length > 0 ? (
                Object.entries(session?.stageState?.lobby?.checkIns || {}).map(([name, loc]) => (
                  <div key={name} className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60 text-xs flex justify-between">
                    <strong className="text-teal-300">{name}</strong>
                    <span className="text-slate-400">{loc}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">No member check-ins recorded yet.</p>
              )}
            </div>
          </div>
        )}

        {/* ICEBREAKER CONTROLLER */}
        {currentStage === 'ICEBREAKER' && (
          <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-6 space-y-6 shadow-xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Icebreaker Actions & Live Responses</h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Total Member Votes Cast: <span className="text-teal-400 font-bold">{totalVotes}</span>
                </p>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                icebreakerStatus === 'REVEALED' 
                  ? 'bg-amber-950/80 border-amber-500 text-amber-300' 
                  : 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
              }`}>
                {icebreakerStatus}
              </span>
            </div>

            <button
              onClick={toggleRevealFakeFact}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md ${
                icebreakerStatus === 'REVEALED'
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {icebreakerStatus === 'REVEALED' ? 'Hide Fiction Answer' : 'Reveal Fiction Answer'}
            </button>

            <div className="pt-2 space-y-4">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Live Member Votes Breakdown</h3>
              <div className="space-y-3">
                {(icebreaker?.facts || []).map((fact, idx) => {
                  const voters = Object.entries(memberVotes)
                    .filter(([_, votedFactId]) => votedFactId === fact.id)
                    .map(([memberName]) => memberName);

                  return (
                    <div key={fact.id} className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs font-medium text-slate-300">
                        <span className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-800 text-teal-400 border border-slate-700 flex items-center justify-center font-bold text-[10px]">
                            {idx + 1}
                          </span>
                          <span>{fact.text}</span>
                        </span>
                        <span className="text-slate-400 font-bold ml-2">{voters.length} {voters.length === 1 ? 'vote' : 'votes'}</span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {voters.length > 0 ? (
                          voters.map((name) => (
                            <span key={name} className="text-[11px] bg-teal-950/80 text-teal-300 border border-teal-800/60 px-2.5 py-0.5 rounded-md font-medium">
                              {name}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">No votes cast for this option yet.</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Icebreaker JSON Importer */}
            <div className="pt-4 border-t border-slate-700/60 space-y-3">
              <IcebreakerImporter sessionId={sessionId} />
            </div>
          </div>
        )}

        {/* DISCUSSION CONTROLLER */}
        {currentStage === 'DISCUSSION' && (
          <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-6 space-y-6 shadow-xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Discussion Controller</h2>
                <p className="text-xs text-slate-400">
                  Active Question <strong className="text-teal-400">{activeDiscIdx + 1}</strong> of {discussionQuestions.length}
                </p>
              </div>
              <button
                onClick={clearHandQueue}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-medium"
              >
                Clear Hand Queue
              </button>
            </div>

            {/* Active Question Display & Selector */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Select Active Display Question</span>
              <div className="space-y-2">
                {discussionQuestions.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => setDiscussionIndex(idx)}
                    className={`w-full p-4 rounded-xl text-left text-xs font-medium border transition-all ${
                      idx === activeDiscIdx
                        ? 'bg-teal-950 border-teal-500 text-teal-200 ring-2 ring-teal-500/50'
                        : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <strong className="text-teal-400 mr-2">Q{idx + 1}:</strong> {q.text}
                  </button>
                ))}
              </div>
            </div>

            {/* Speaking Queue */}
            <div className="pt-4 border-t border-slate-700/60 space-y-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Raised Hands Queue ({discussion?.handQueue?.length || 0})
              </h3>
              <div className="flex flex-wrap gap-2">
                {(discussion?.handQueue || []).length > 0 ? (
                  discussion?.handQueue?.map((name, i) => (
                    <span key={name} className="px-3 py-1 bg-amber-950 border border-amber-500/60 text-amber-200 rounded-lg text-xs font-bold font-mono">
                      #{i + 1} {name}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic">No members in speaking queue.</span>
                )}
              </div>
            </div>

            {/* Discussion JSON Importer */}
            <div className="pt-4 border-t border-slate-700/60 space-y-3">
              <DiscussionImporter sessionId={sessionId} />
            </div>
          </div>
        )}

        {/* TRIVIA CONTROLLER */}
        {currentStage === 'TRIVIA' && session && (
          <HostTriviaController session={session} />
        )}

        {/* WRAP-UP CONTROLLER */}
        {currentStage === 'WRAP_UP' && (() => {
          const ratingsObj = session?.stageState?.wrapUp?.memberRatings || {};
          const entries = Object.values(ratingsObj);
          const totalSubmissions = entries.length;

          // Calculate Average Star Rating
          const averageRating = totalSubmissions > 0
            ? (entries.reduce((acc, curr) => acc + curr.rating, 0) / totalSubmissions).toFixed(1)
            : null;

          return (
            <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-6 space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Wrap-Up Summary & Live Rating</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Total Submissions: <strong className="text-teal-400">{totalSubmissions}</strong>
                  </p>
                </div>

                {/* Live Average Badge */}
                {averageRating && (
                  <div className="flex items-center gap-2 bg-teal-950/80 border border-teal-500/80 px-4 py-2 rounded-xl">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Avg Rating:
                    </span>
                    <span className="text-lg font-black text-amber-400">
                      ⭐ {averageRating} <span className="text-xs font-normal text-slate-400">/ 5</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Submitted Member Ratings Breakdown */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Individual Member Ratings
                </h3>
                {totalSubmissions > 0 ? (
                  Object.entries(ratingsObj).map(([name, entry]) => (
                    <div key={name} className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-teal-300">
                        <span>{name}</span>
                        <span className="text-amber-400">{'★'.repeat(entry.rating)}{'☆'.repeat(5 - entry.rating)}</span>
                      </div>
                      {entry.feedback && <p className="text-slate-400 text-[11px] italic">"{entry.feedback}"</p>}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">No reflections or ratings submitted yet.</p>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
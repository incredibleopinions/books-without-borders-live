'use client';

import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';

export type SessionStage = 'LOBBY' | 'ICEBREAKER' | 'DISCUSSION' | 'TRIVIA' | 'WRAP_UP';

export interface Fact {
  id: string;
  text: string;
  isFiction: boolean;
}

export interface DiscussionQuestion {
  id: string;
  text: string;
}

export interface NextMonthInfo {
  country: string;
  bookTitle: string;
  author: string;
  meetingDate: string;
  meetingTime: string;
}

export interface SessionData {
  sessionId: string;
  featuredCountry: string;
  featuredBook: string;
  featuredAuthor?: string;
  currentStage: SessionStage;
  nextMonth?: NextMonthInfo;
  stageState?: {
    lobby?: {
      checkIns?: Record<string, string>; // memberName -> location
    };
    icebreaker?: {
      country: string;
      status: 'VOTING' | 'REVEALED';
      facts: Fact[];
      memberVotes?: Record<string, string>; // memberName -> factId
    };
    discussion?: {
      activeQuestionIndex: number;
      questions: DiscussionQuestion[];
      handQueue?: string[]; // list of member names with raised hands
    };
    trivia?: {
      status: 'IDLE' | 'READY' | 'IN_PROGRESS' | 'REVEALED' | 'COMPLETED';
      currentQuestionIndex: number;
      timeLimitSeconds: number;
      questionStartTime?: number;
      questions: Array<{
        id: string;
        question: string;
        options: string[];
        correctAnswer: number;
        explanation?: string;
      }>;
      participants?: Record<string, { joinedAt: number; lastActive?: number }>;
      responses?: Record<number, Record<string, { selectedOption: number; isCorrect: boolean; scoreAwarded: number }>>;
      scores?: Record<string, number>;
    };
    wrapUp?: {
      memberRatings?: Record<string, { rating: number; feedback?: string }>;
    };
  };
}

const DEFAULT_SESSION_DATA: SessionData = {
  sessionId: 'active_session',
  featuredCountry: 'Georgia',
  featuredBook: 'Heart Lamp',
  currentStage: 'LOBBY',
  nextMonth: {
    country: 'Haiti',
    bookTitle: 'The Dew Breaker',
    author: 'Edwidge Danticat',
    meetingDate: 'October 25, 2026',
    meetingTime: '2:00 PM EST',
  },
  stageState: {
    lobby: {
      checkIns: {},
    },
    icebreaker: {
      country: 'Georgia',
      status: 'VOTING',
      facts: [
        { id: 'f1', text: 'Georgia produces wine using 8,000-year-old qvevri clay vessels buried underground.', isFiction: false },
        { id: 'f2', text: 'The capital city Tbilisi derived its name from ancient thermal hot springs.', isFiction: false },
        { id: 'f3', text: 'Georgia is the only country in Europe where wild tigers still roam freely.', isFiction: true },
      ],
      memberVotes: {},
    },
    discussion: {
      activeQuestionIndex: 0,
      questions: [
        { id: 'q1', text: 'What were your initial reactions to the author’s narrative structure and tone?' },
        { id: 'q2', text: 'How did the geographical and historical context shape the characters’ decisions?' },
        { id: 'q3', text: 'Which key themes resonated most with you personally?' },
      ],
      handQueue: [],
    },
    trivia: {
      status: 'IDLE',
      currentQuestionIndex: 0,
      timeLimitSeconds: 20,
      questions: [],
    },
    wrapUp: {
      memberRatings: {},
    },
  },
};

export function useLiveState(sessionId: string = 'active_session') {
  const [session, setSession] = useState<SessionData>(DEFAULT_SESSION_DATA);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const sessionRef = ref(db, `sessions/${sessionId}`);

    const unsubscribe = onValue(
      sessionRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setSession(snapshot.val() as SessionData);
        } else {
          setSession({ ...DEFAULT_SESSION_DATA, sessionId });
        }
        setLoading(false);
      },
      (err) => {
        console.error('Firebase Realtime DB read error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [sessionId]);

  return { session, loading, error };
}
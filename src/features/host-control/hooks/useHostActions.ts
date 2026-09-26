// src/features/host-control/hooks/useHostActions.ts
'use client';

import { ref, update, set } from 'firebase/database';
import { db } from '@/lib/firebase';
import { SessionStage } from '@/features/live-session/hooks/useLiveState';

export function useHostActions(sessionId: string = 'active_session') {
  const sessionRef = ref(db, `sessions/${sessionId}`);

  // Transition overall stage (LOBBY -> ICEBREAKER -> DISCUSSION -> TRIVIA -> WRAP_UP)
  const setStage = async (stage: SessionStage) => {
    await update(sessionRef, { currentStage: stage });
  };

  // Icebreaker controls
  const revealIcebreaker = async () => {
    await update(ref(db, `sessions/${sessionId}/stageState/icebreaker`), {
      status: 'REVEALED',
    });
  };

  const resetIcebreaker = async () => {
    await update(ref(db, `sessions/${sessionId}/stageState/icebreaker`), {
      status: 'VOTING',
      memberVotes: {},
    });
  };

  // Discussion controls
  const setDiscussionQuestion = async (index: number) => {
    await update(ref(db, `sessions/${sessionId}/stageState/discussion`), {
      activeQuestionIndex: index,
    });
  };

  // Trivia controls
  const startTriviaQuestion = async (questionIndex: number) => {
    await update(ref(db, `sessions/${sessionId}/stageState/trivia`), {
      status: 'QUESTION_ACTIVE',
      currentQuestionIndex: questionIndex,
      questionStartTime: Date.now(),
    });
  };

  const showTriviaLeaderboard = async () => {
    await update(ref(db, `sessions/${sessionId}/stageState/trivia`), {
      status: 'LEADERBOARD',
    });
  };

  return {
    setStage,
    revealIcebreaker,
    resetIcebreaker,
    setDiscussionQuestion,
    startTriviaQuestion,
    showTriviaLeaderboard,
  };
}
// src/features/live-session/components/ZoomEmbedded.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';

interface ZoomEmbeddedProps {
  meetingNumber: string;
  passcode: string;
  userName: string;
  userEmail?: string;
  userRole?: number; // 0 = Participant, 1 = Host
}

export function ZoomEmbedded({
  meetingNumber,
  passcode,
  userName,
  userEmail = 'reader@bookswithoutborders.club',
  userRole = 0,
}: ZoomEmbeddedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isJoining, setIsJoining] = useState<boolean>(true);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [zoomInitialized, setZoomInitialized] = useState<boolean>(false);

  useEffect(() => {
    let zoomClient: any = null;

    async function initAndJoinZoom() {
      try {
        setIsJoining(true);
        setJoinError(null);

        // Dynamically import Zoom SDK client-side to prevent SSR issues
        const { ZoomMtg } = await import('@zoom/meetingsdk');

        // Preload WebAssembly dependencies from CDN
        ZoomMtg.setZoomJSLib('https://source.zoom.us/3.1.0/lib', '/av');
        ZoomMtg.preLoadWasm();
        ZoomMtg.prepareWebSDK();

        // Fetch signature from Next.js server route
        const res = await fetch('/api/zoom/signature', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ meetingNumber, role: userRole }),
        });

        if (!res.ok) {
          throw new Error('Failed to fetch Zoom SDK signature from server.');
        }

        const { signature, sdkKey } = await res.json();

        // Initialize Embedded Zoom Client inside container element
        if (containerRef.current) {
          ZoomMtg.init({
            leaveUrl: window.location.origin + '/live',
            patchJsMedia: true,
            leaveOnPageUnload: true,
            success: () => {
              ZoomMtg.join({
                signature,
                sdkKey,
                meetingNumber,
                passCode: passcode,
                userName,
                userEmail,
                success: () => {
                  setIsJoining(false);
                  setZoomInitialized(true);
                },
                error: (err: any) => {
                  console.error('Zoom Join Error:', err);
                  setJoinError(err.errorMessage || 'Failed to join Zoom call.');
                  setIsJoining(false);
                },
              });
            },
            error: (err: any) => {
              console.error('Zoom Init Error:', err);
              setJoinError('Could not initialize Zoom Client.');
              setIsJoining(false);
            },
          });
        }
      } catch (err: any) {
        console.error('Zoom setup error:', err);
        setJoinError(err.message || 'An error occurred while launching Zoom.');
        setIsJoining(false);
      }
    }

    if (meetingNumber && passcode) {
      initAndJoinZoom();
    }

    return () => {
      // Clean up Zoom DOM nodes if component unmounts
      if (typeof window !== 'undefined' && (window as any).ZoomMtg) {
        try {
          (window as any).ZoomMtg.leaveMeeting({});
        } catch (e) {
          // Ignore cleanup errors on unmount
        }
      }
    };
  }, [meetingNumber, passcode, userName, userEmail, userRole]);

  return (
    <div className="relative w-full h-full min-h-[400px] md:min-h-[550px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex flex-col justify-center items-center">
      {/* Loading Overlay */}
      {isJoining && (
        <div className="absolute inset-0 z-20 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 space-y-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-200 font-semibold text-sm">Connecting to Video Call...</p>
          <p className="text-slate-500 text-xs">Meeting #{meetingNumber}</p>
        </div>
      )}

      {/* Error View */}
      {joinError && (
        <div className="absolute inset-0 z-20 bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-900/50 text-rose-400 flex items-center justify-center font-bold text-xl border border-rose-700">
            !
          </div>
          <p className="text-rose-200 font-bold text-base">Video Connection Failed</p>
          <p className="text-slate-400 text-xs max-w-sm">{joinError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold rounded-lg transition-all"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Embedded Zoom Video Target Container */}
      <div
        id="zmmtg-root"
        ref={containerRef}
        className="w-full h-full flex-grow relative overflow-hidden"
      />
    </div>
  );
}
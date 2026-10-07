'use client';

import { useState, useRef, useEffect } from 'react';

function isZoomListKeyWarning(args: unknown[]): boolean {
  const message = args
    .map((arg) => (typeof arg === 'string' ? arg : arg instanceof Error ? `${arg.message}\n${arg.stack ?? ''}` : ''))
    .join('\n');
  if (!message.includes('unique "key" prop')) return false;
  return /meetingsdk|zoomus-websdk/i.test(`${message}\n${new Error().stack ?? ''}`);
}

function describeZoomError(err: unknown): string {
  if (typeof err === 'string' && err.trim()) return err.trim();
  if (typeof err === 'number') return `Zoom error ${err}`;
  if (err instanceof Error && err.message) return err.message;
  if (err && typeof err === 'object') {
    const record = err as Record<string, unknown>;
    const reason = [record.reason, record.errorMessage, record.message, record.type].find(
      (value) => typeof value === 'string' && value.trim()
    );
    const code = record.errorCode ?? record.errorCodes;
    if (typeof reason === 'string') {
      return code == null ? reason : `${reason} (${code})`;
    }
    const named = Object.getOwnPropertyNames(err)
      .map((key) => {
        const value = (err as Record<string, unknown>)[key];
        if (value == null || typeof value === 'function') return '';
        return `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`;
      })
      .filter(Boolean);
    if (named.length) return named.join('; ');
  }
  return 'Failed to initialize live video stream.';
}

interface ZoomEmbeddedClientProps {
  meetingNumber: string;
  passCode: string;
  meetingLink?: string;
  userName?: string;
  onLeave?: () => void;
}

export default function ZoomEmbeddedClient({
  meetingNumber,
  passCode,
  meetingLink,
  userName = 'Book Club Member',
  onLeave,
}: ZoomEmbeddedClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<any>(null);

  const [hasLeft, setHasLeft] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const cleanMeetingId = meetingNumber ? meetingNumber.replace(/[^0-9]/g, '') : '';
  const joinLink =
    meetingLink?.trim() || (cleanMeetingId ? `https://zoom.us/j/${cleanMeetingId}` : '');

  useEffect(() => {
    const previousError = console.error;
    console.error = (...args: unknown[]) => {
      if (isZoomListKeyWarning(args)) return;
      previousError(...args);
    };
    return () => {
      console.error = previousError;
    };
  }, []);

  useEffect(() => {
    if (!cleanMeetingId || hasLeft) return;

    let isMounted = true;
    setIsInitializing(true);
    setErrorState(null);

    async function initZoom() {
      const previousAlert = window.alert;
      window.alert = (message?: string) => {
        if (typeof message === 'string' && /signature is invalid/i.test(message)) return;
        previousAlert(message);
      };

      try {
        // The CDN bundle does not attach ZoomMtgEmbedded to window.
        // The installed package exports createClient directly.
        const embeddedModule = await import('@zoom/meetingsdk/embedded');
        const ZoomMtgEmbedded = embeddedModule.default ?? embeddedModule;

        if (!isMounted || !containerRef.current) return;

        if (!ZoomMtgEmbedded || typeof ZoomMtgEmbedded.createClient !== 'function') {
          throw new Error('Zoom Embedded SDK failed to load.');
        }

        const client = ZoomMtgEmbedded.createClient();
        clientRef.current = client;

        const triggerCleanLeave = () => {
          if (!isMounted) return;
          setHasLeft(true);
          if (containerRef.current) containerRef.current.innerHTML = '';
          if (onLeave) onLeave();
        };

        const res = await fetch('/api/zoom/signature', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ meetingNumber: cleanMeetingId, role: 0 }),
        });

        const payload = (await res.json().catch(() => null)) as { signature?: string; error?: string } | null;
        if (!res.ok || !payload?.signature) {
          throw new Error(payload?.error || 'Failed to generate Zoom meeting signature.');
        }
        const { signature } = payload;

        if (!isMounted || !containerRef.current) return;

        await client.init({
          zoomAppRoot: containerRef.current,
          language: 'en-US',
          patchJsMedia: true,
          leaveOnPageUnload: true,
        });

        if (typeof client.on === 'function') {
          client.on('connection-change', (payload: any) => {
            const state = payload?.state;
            if (state === 'Closed' || state === 'Disconnected' || state === 'Ended') {
              triggerCleanLeave();
            }
          });
        }

        await client.join({
          signature,
          meetingNumber: cleanMeetingId,
          password: passCode,
          userName: userName.trim(),
        });

        setIsInitializing(false);
      } catch (err: unknown) {
        if (isMounted) {
          const message = describeZoomError(err);
          console.error(`Zoom Embedded SDK Error: ${message}`);
          setErrorState(message);
          setIsInitializing(false);
        }
      } finally {
        window.alert = previousAlert;
      }
    }

    initZoom();

    return () => {
      isMounted = false;
      if (clientRef.current) {
        try {
          clientRef.current.leaveMeeting();
        } catch {}
        clientRef.current = null;
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [cleanMeetingId, passCode, userName, hasLeft, onLeave]);

  if (hasLeft) {
    return (
      <div className="w-full h-full min-h-[480px] rounded-2xl bg-black/90 flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-3xl">
          ✨
        </div>
        <div className="space-y-2 max-w-sm">
          <h3 className="text-lg font-bold text-white">Session Ended</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            You have left the video meeting.
          </p>
        </div>
      </div>
    );
  }

  if (errorState) {
    return (
      <div className="w-full h-full min-h-[480px] rounded-2xl bg-black/90 flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="space-y-2 max-w-sm">
          <h3 className="text-lg font-bold text-white">Unable to load video stream</h3>
          <p className="text-xs text-gray-400 leading-relaxed">{errorState}</p>
        </div>
        {joinLink && (
          <a
            href={joinLink}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg"
          >
            Join in Zoom
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[500px] rounded-2xl overflow-hidden bg-black relative">
      {isInitializing && (
        <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-300 font-medium tracking-wide">
            Connecting to Zoom Secure Room...
          </p>
        </div>
      )}

      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
export type ZoomSessionFields = {
  meetingZoomLink?: string;
  zoomMeetingId?: string;
  zoomPasscode?: string;
} | null | undefined;

export function extractZoomDetailsFromSession(session: ZoomSessionFields): {
  meetingId: string;
  passcode: string;
} {
  if (!session) {
    return { meetingId: '', passcode: '' };
  }

  const explicitId = digitsOnly(session.zoomMeetingId);
  const explicitPasscode = text(session.zoomPasscode);

  let meetingIdFromLink = '';
  let passcodeFromLink = '';

  if (session.meetingZoomLink) {
    try {
      const url = new URL(session.meetingZoomLink);
      const rawId = url.pathname
        .split('/')
        .find((segment) => /^\d{9,11}$/.test(segment));
      meetingIdFromLink = rawId ? digitsOnly(rawId) : '';
      passcodeFromLink = passcodeFromZoomUrl(url);
    } catch {
      // A bad link should not discard explicit meeting id / passcode fields.
    }
  }

  return {
    meetingId: explicitId || meetingIdFromLink,
    passcode: explicitPasscode || passcodeFromLink,
  };
}

function text(value: unknown): string {
  if (value == null) return '';
  return String(value).trim();
}

function digitsOnly(value: unknown): string {
  return text(value).replace(/[^0-9]/g, '');
}

/**
 * Official Zoom invite links store an encrypted join token in `pwd`.
 * The Meeting SDK `password` field needs the human passcode instead.
 * Only a short numeric `pwd` is treated as a passcode (hand-built links).
 */
function passcodeFromZoomUrl(url: URL): string {
  const named = (
    url.searchParams.get('passcode') ||
    url.searchParams.get('password') ||
    ''
  ).trim();
  if (named) return named;

  const pwd = url.searchParams.get('pwd') || '';
  if (/^\d{4,10}$/.test(pwd)) return pwd;
  return '';
}

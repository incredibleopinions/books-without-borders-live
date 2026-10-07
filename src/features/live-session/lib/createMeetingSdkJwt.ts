import jwt from 'jsonwebtoken';

export function createMeetingSdkJwt(input: {
  meetingNumber: string;
  role?: number;
  appKey: string;
  appSecret: string;
  issuedAt?: number;
}): string {
  const digits = String(input.meetingNumber ?? '').replace(/\D/g, '');
  const meetingNumber = Number(digits);
  const appKey = input.appKey.trim();
  const appSecret = input.appSecret.trim();

  if (!Number.isSafeInteger(meetingNumber) || meetingNumber <= 0 || !appKey || !appSecret) {
    throw new Error('Zoom app credentials or meeting number are missing.');
  }

  const role = input.role === 1 ? 1 : 0;
  const iat = input.issuedAt ?? Math.floor(Date.now() / 1000) - 30;
  const exp = iat + 60 * 60 * 2;

  // Web Meeting SDK auth requires appKey. sdkKey is the same Client ID so the
  // token still matches Zoom's auth sample. mn must be a number; a string is
  // rejected as signature 3712.
  return jwt.sign(
    {
      appKey,
      sdkKey: appKey,
      mn: meetingNumber,
      role,
      iat,
      exp,
      tokenExp: exp,
    },
    appSecret,
    { algorithm: 'HS256' }
  );
}

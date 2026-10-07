import jwt from 'jsonwebtoken';

export function createMeetingSdkJwt(input: {
  meetingNumber: string;
  role?: number;
  appKey: string;
  appSecret: string;
  issuedAt?: number;
}): string {
  const digits = String(input.meetingNumber ?? '').replace(/\D/g, '');
  const appKey = input.appKey.trim();
  const appSecret = input.appSecret.trim();

  if (!digits || !appKey || !appSecret) {
    throw new Error('Zoom app credentials or meeting number are missing.');
  }

  const role = input.role === 1 ? 1 : 0;
  // Backdate iat by 60s to handle server time drift
  const iat = input.issuedAt ?? Math.floor(Date.now() / 1000) - 60;
  const exp = iat + 60 * 60 * 2;

  return jwt.sign(
    {
      appKey,
      sdkKey: appKey,
      mn: digits,
      role,
      iat,
      exp,
      tokenExp: exp,
    },
    appSecret,
    { algorithm: 'HS256' }
  );
}
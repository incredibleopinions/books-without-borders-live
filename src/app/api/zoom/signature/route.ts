// src/app/api/zoom/signature/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { meetingNumber, role } = await request.json();

    const sdkKey = process.env.ZOOM_SDK_KEY;
    const sdkSecret = process.env.ZOOM_SDK_SECRET;

    if (!sdkKey || !sdkSecret) {
      return NextResponse.json(
        { error: 'Zoom SDK Credentials missing on server.' },
        { status: 500 }
      );
    }

    const iat = Math.round((Date.now() - 30000) / 1000);
    const exp = iat + 60 * 60 * 2; // Token valid for 2 hours

    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      sdkKey,
      mn: meetingNumber,
      role: role || 0, // 0 = Participant, 1 = Host
      iat,
      exp,
      appKey: sdkKey,
      tokenExp: exp,
    };

    const sHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const sPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const dataToSign = `${sHeader}.${sPayload}`;

    const signature = crypto
      .createHmac('sha256', sdkSecret)
      .update(dataToSign)
      .digest('base64url');

    return NextResponse.json({
      signature: `${dataToSign}.${signature}`,
      sdkKey,
    });
  } catch (err) {
    console.error('Error generating Zoom signature:', err);
    return NextResponse.json({ error: 'Failed to generate Zoom signature' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { createMeetingSdkJwt } from '@/features/live-session/lib/createMeetingSdkJwt';

export async function POST(req: Request) {
  const body = await req.json();
  const appKey = process.env.ZOOM_SDK_KEY?.trim();
  const appSecret = process.env.ZOOM_SDK_SECRET?.trim();

  if (!appKey || !appSecret) {
    return NextResponse.json({ error: 'Zoom SDK credentials are missing on the server.' }, { status: 500 });
  }

  try {
    const signature = createMeetingSdkJwt({
      meetingNumber: String(body.meetingNumber ?? ''),
      role: Number(body.role),
      appKey,
      appSecret,
    });

    return NextResponse.json({ signature });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate Zoom signature';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

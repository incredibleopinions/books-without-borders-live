import { NextResponse } from 'next/server';
import { createMeetingSdkJwt } from '@/features/live-session/lib/createMeetingSdkJwt';
import { selectZoomCredentials } from '@/features/live-session/lib/selectZoomCredentials';

export async function POST(req: Request) {
  const body = await req.json();
  const { appKey, appSecret, source } = selectZoomCredentials();

  if (!appKey || !appSecret) {
    const keyName = source === 'production' ? 'ZOOM_SDK_KEY_PROD' : 'ZOOM_SDK_KEY_DEV';
    const secretName = source === 'production' ? 'ZOOM_SDK_SECRET_PROD' : 'ZOOM_SDK_SECRET_DEV';
    return NextResponse.json(
      { error: `Zoom SDK credentials are missing. Set ${keyName} and ${secretName} on the server.` },
      { status: 500 }
    );
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

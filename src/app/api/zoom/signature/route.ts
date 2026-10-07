import { NextResponse } from 'next/server';
import { createMeetingSdkJwt } from '@/features/live-session/lib/createMeetingSdkJwt';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Directly evaluate environment variables
    const appKey = (
      process.env.ZOOM_SDK_KEY_PROD ||
      process.env.ZOOM_SDK_KEY_DEV ||
      process.env.ZOOM_SDK_KEY ||
      process.env.NEXT_PUBLIC_ZOOM_SDK_KEY
    )?.trim();

    const appSecret = (
      process.env.ZOOM_SDK_SECRET_PROD ||
      process.env.ZOOM_SDK_SECRET_DEV ||
      process.env.ZOOM_SDK_SECRET
    )?.trim();

    if (!appKey || !appSecret) {
      console.error('[Zoom Signature API Error] Missing credentials:', {
        hasKey: Boolean(appKey),
        hasSecret: Boolean(appSecret),
        VERCEL_ENV: process.env.VERCEL_ENV,
        NODE_ENV: process.env.NODE_ENV,
      });

      return NextResponse.json(
        {
          error:
            'Zoom SDK credentials are missing. Set ZOOM_SDK_KEY_PROD and ZOOM_SDK_SECRET_PROD on the server.',
        },
        { status: 500 }
      );
    }

    const signature = createMeetingSdkJwt({
      meetingNumber: String(body.meetingNumber ?? ''),
      role: Number(body.role),
      appKey,
      appSecret,
    });

    return NextResponse.json({
      signature,
      sdkKey: appKey,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate Zoom signature';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
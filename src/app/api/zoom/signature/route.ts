import { NextResponse } from 'next/server';
import { createMeetingSdkJwt } from '@/features/live-session/lib/createMeetingSdkJwt';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Direct environment variable check
    const prodKey = process.env.ZOOM_SDK_KEY_PROD;
    const prodSecret = process.env.ZOOM_SDK_SECRET_PROD;
    const devKey = process.env.ZOOM_SDK_KEY_DEV;
    const devSecret = process.env.ZOOM_SDK_SECRET_DEV;
    const genericKey = process.env.ZOOM_SDK_KEY;
    const genericSecret = process.env.ZOOM_SDK_SECRET;

    const appKey = (prodKey || devKey || genericKey)?.trim();
    const appSecret = (prodSecret || devSecret || genericSecret)?.trim();

    if (!appKey || !appSecret) {
      return NextResponse.json(
        {
          error: 'Missing Zoom credentials on Vercel runtime.',
          debug: {
            VERCEL_ENV: process.env.VERCEL_ENV || 'undefined',
            NODE_ENV: process.env.NODE_ENV || 'undefined',
            hasProdKey: Boolean(prodKey),
            hasProdSecret: Boolean(prodSecret),
            hasDevKey: Boolean(devKey),
            hasDevSecret: Boolean(devSecret),
            hasGenericKey: Boolean(genericKey),
            hasGenericSecret: Boolean(genericSecret),
          },
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

    return NextResponse.json({ signature, sdkKey: appKey });
  } catch (err) {
    return NextResponse.json(
      {
        error: 'Exception thrown inside signature endpoint',
        details: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : null,
      },
      { status: 500 }
    );
  }
}
export function selectZoomCredentials(env: NodeJS.ProcessEnv = process.env): {
  appKey: string;
  appSecret: string;
  source: 'production' | 'development';
} {
  // Check all potential keys
  const appKey = (
    env.ZOOM_SDK_KEY_PROD || 
    env.ZOOM_SDK_KEY_DEV || 
    env.ZOOM_SDK_KEY
  )?.trim() ?? '';

  const appSecret = (
    env.ZOOM_SDK_SECRET_PROD || 
    env.ZOOM_SDK_SECRET_DEV || 
    env.ZOOM_SDK_SECRET
  )?.trim() ?? '';

  const source = env.VERCEL_ENV === 'production' ? 'production' : 'development';

  // Server-side logging for Vercel runtime inspection
  console.log('[Zoom Credentials Debug]', {
    VERCEL_ENV: env.VERCEL_ENV,
    NODE_ENV: env.NODE_ENV,
    hasKey: Boolean(appKey),
    hasSecret: Boolean(appSecret),
    keyLength: appKey.length,
  });

  return { appKey, appSecret, source };
}
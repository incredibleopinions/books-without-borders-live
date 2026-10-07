export function selectZoomCredentials(env: NodeJS.ProcessEnv = process.env): {
  appKey: string;
  appSecret: string;
  source: 'production' | 'development';
} {
  const useProd = env.VERCEL_ENV ? env.VERCEL_ENV === 'production' : env.NODE_ENV === 'production';
  
  // Try loading primary keys based on environment
  let appKey = (useProd ? env.ZOOM_SDK_KEY_PROD : env.ZOOM_SDK_KEY_DEV)?.trim() ?? '';
  let appSecret = (useProd ? env.ZOOM_SDK_SECRET_PROD : env.ZOOM_SDK_SECRET_DEV)?.trim() ?? '';
  let source: 'production' | 'development' = useProd ? 'production' : 'development';

  // Fallback: If dev keys aren't defined (e.g., Preview deployment), fall back to prod keys
  if (!appKey || !appSecret) {
    appKey = (env.ZOOM_SDK_KEY_PROD || env.ZOOM_SDK_KEY_DEV || env.ZOOM_SDK_KEY)?.trim() ?? '';
    appSecret = (env.ZOOM_SDK_SECRET_PROD || env.ZOOM_SDK_SECRET_DEV || env.ZOOM_SDK_SECRET)?.trim() ?? '';
    source = 'production';
  }

  return { appKey, appSecret, source };
}
export function selectZoomCredentials(env: NodeJS.ProcessEnv = process.env): {
  appKey: string;
  appSecret: string;
  source: 'production' | 'development';
} {
  const useProd = env.VERCEL_ENV ? env.VERCEL_ENV === 'production' : env.NODE_ENV === 'production';
  const source = useProd ? 'production' : 'development';
  const appKey = (useProd ? env.ZOOM_SDK_KEY_PROD : env.ZOOM_SDK_KEY_DEV)?.trim() ?? '';
  const appSecret = (useProd ? env.ZOOM_SDK_SECRET_PROD : env.ZOOM_SDK_SECRET_DEV)?.trim() ?? '';
  return { appKey, appSecret, source };
}

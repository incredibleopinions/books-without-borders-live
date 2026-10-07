export function selectZoomCredentials(): {
  appKey: string;
  appSecret: string;
  source: 'production' | 'development';
} {
  // Direct process.env reads
  const prodKey = process.env.ZOOM_SDK_KEY_PROD?.trim();
  const prodSecret = process.env.ZOOM_SDK_SECRET_PROD?.trim();
  const devKey = process.env.ZOOM_SDK_KEY_DEV?.trim();
  const devSecret = process.env.ZOOM_SDK_SECRET_DEV?.trim();
  const fallbackKey = process.env.ZOOM_SDK_KEY?.trim();
  const fallbackSecret = process.env.ZOOM_SDK_SECRET?.trim();

  const isProd = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';

  // Pick best available key pair
  const appKey = (isProd ? prodKey : devKey) || prodKey || devKey || fallbackKey || '';
  const appSecret = (isProd ? prodSecret : devSecret) || prodSecret || devSecret || fallbackSecret || '';
  const source = isProd ? 'production' : 'development';

  return { appKey, appSecret, source };
}
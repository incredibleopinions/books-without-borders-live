import assert from 'node:assert/strict';
import test from 'node:test';
import { selectZoomCredentials } from './selectZoomCredentials.ts';

test('uses production Zoom credentials on a Vercel production deploy', () => {
  const selected = selectZoomCredentials({
    VERCEL_ENV: 'production',
    NODE_ENV: 'production',
    ZOOM_SDK_KEY_PROD: 'prod-key',
    ZOOM_SDK_SECRET_PROD: 'prod-secret',
    ZOOM_SDK_KEY_DEV: 'dev-key',
    ZOOM_SDK_SECRET_DEV: 'dev-secret',
  });

  assert.equal(selected.source, 'production');
  assert.equal(selected.appKey, 'prod-key');
  assert.equal(selected.appSecret, 'prod-secret');
});

test('uses development Zoom credentials for local and preview deploys', () => {
  const local = selectZoomCredentials({
    NODE_ENV: 'development',
    ZOOM_SDK_KEY_PROD: 'prod-key',
    ZOOM_SDK_SECRET_PROD: 'prod-secret',
    ZOOM_SDK_KEY_DEV: 'dev-key',
    ZOOM_SDK_SECRET_DEV: 'dev-secret',
  });
  const preview = selectZoomCredentials({
    VERCEL_ENV: 'preview',
    NODE_ENV: 'production',
    ZOOM_SDK_KEY_PROD: 'prod-key',
    ZOOM_SDK_SECRET_PROD: 'prod-secret',
    ZOOM_SDK_KEY_DEV: 'dev-key',
    ZOOM_SDK_SECRET_DEV: 'dev-secret',
  });

  assert.equal(local.appKey, 'dev-key');
  assert.equal(preview.appKey, 'dev-key');
  assert.equal(preview.appSecret, 'dev-secret');
});

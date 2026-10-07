import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import { createMeetingSdkJwt } from './createMeetingSdkJwt.ts';

const APP_KEY = 'test-client-id';
const APP_SECRET = 'test-client-secret';

test('signs the Meeting SDK payload Zoom currently verifies', () => {
  const token = createMeetingSdkJwt({
    meetingNumber: '832 4126 3582',
    role: 0,
    appKey: APP_KEY,
    appSecret: APP_SECRET,
    issuedAt: 1_700_000_000,
  });

  const decoded = jwt.verify(token, APP_SECRET, {
    algorithms: ['HS256'],
    ignoreExpiration: true,
  }) as jwt.JwtPayload;
  assert.equal(decoded.appKey, APP_KEY);
  assert.equal(decoded.sdkKey, APP_KEY);
  assert.equal(decoded.mn, 83241263582);
  assert.equal(typeof decoded.mn, 'number');
  assert.equal(decoded.role, 0);
  assert.equal(decoded.iat, 1_700_000_000);
  assert.equal(decoded.exp, 1_700_000_000 + 60 * 60 * 2);
  assert.equal(decoded.tokenExp, decoded.exp);

  const header = jwt.decode(token, { complete: true })?.header;
  assert.equal(header?.alg, 'HS256');
  assert.equal(header?.typ, 'JWT');
});

test('rejects a token checked with the wrong client secret', () => {
  const token = createMeetingSdkJwt({
    meetingNumber: '83241263582',
    appKey: APP_KEY,
    appSecret: APP_SECRET,
    issuedAt: 1_700_000_000,
  });

  assert.throws(() => jwt.verify(token, 'different-secret', { algorithms: ['HS256'] }));
});

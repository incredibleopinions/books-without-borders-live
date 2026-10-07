import assert from 'node:assert/strict';
import test from 'node:test';
import { extractZoomDetailsFromSession } from './extractZoomDetails.ts';

const CURRENT_MONTH_LINK =
  'https://us06web.zoom.us/j/87957562917?pwd=Kimr5X2aHmzrtSKbdFovVmnnnODf0K.1';

test('uses the scheduled passcode instead of the invite link pwd token', () => {
  const details = extractZoomDetailsFromSession({
    meetingZoomLink: CURRENT_MONTH_LINK,
    zoomMeetingId: '879 5756 2917',
    zoomPasscode: '979412',
  });

  assert.equal(details.meetingId, '87957562917');
  assert.equal(details.passcode, '979412');
  assert.notEqual(details.passcode, 'Kimr5X2aHmzrtSKbdFovVmnnnODf0K.1');
});

test('does not treat an encrypted pwd query param as the SDK password', () => {
  const details = extractZoomDetailsFromSession({
    meetingZoomLink: CURRENT_MONTH_LINK,
  });

  assert.equal(details.meetingId, '87957562917');
  assert.equal(details.passcode, '');
});

test('reads explicit fields when the invite link is missing or invalid', () => {
  assert.deepEqual(
    extractZoomDetailsFromSession({
      zoomMeetingId: '87957562917',
      zoomPasscode: '979412',
    }),
    { meetingId: '87957562917', passcode: '979412' }
  );

  assert.deepEqual(
    extractZoomDetailsFromSession({
      meetingZoomLink: 'not a url',
      zoomMeetingId: '12345678901',
      zoomPasscode: '4242',
    }),
    { meetingId: '12345678901', passcode: '4242' }
  );
});

test('accepts a numeric pwd only when no scheduled passcode is stored', () => {
  const details = extractZoomDetailsFromSession({
    meetingZoomLink: 'https://zoom.us/j/12345678901?pwd=654321',
  });

  assert.equal(details.meetingId, '12345678901');
  assert.equal(details.passcode, '654321');
});

test('returns empty details when there is no session', () => {
  assert.deepEqual(extractZoomDetailsFromSession(null), {
    meetingId: '',
    passcode: '',
  });
});

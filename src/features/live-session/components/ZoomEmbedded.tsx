'use client';

import dynamic from 'next/dynamic';

const ZoomEmbeddedClient = dynamic(
  () => import('./ZoomEmbeddedClient'),
  { ssr: false }
);

export function ZoomEmbedded(props: any) {
  return <ZoomEmbeddedClient {...props} />;
}
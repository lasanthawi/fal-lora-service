import type { AppProps } from 'next/app';
import { Suspense } from 'react';
import { StackProvider } from '@stackframe/stack';
import { stackServerApp } from '../stack.config';

function LoadingFallback() {
  return (
    <div style={{ fontFamily: 'system-ui', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      Loading…
    </div>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <StackProvider app={stackServerApp}>
      <Suspense fallback={<LoadingFallback />}>
        <Component {...pageProps} />
      </Suspense>
    </StackProvider>
  );
}

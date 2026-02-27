import type { AppProps } from 'next/app';
import { Suspense } from 'react';
import { StackProvider } from '@stackframe/stack';
import { stackClientApp, stackServerApp } from '../stack.config';
import '../styles/globals.css';

function LoadingFallback() {
  return (
    <div className="loading-screen">
      <span className="loading-dots">Loading</span>
    </div>
  );
}

/** Use client app in browser (no secret); server app on server for SSR. */
function getStackApp() {
  if (typeof window === 'undefined') return stackServerApp;
  return stackClientApp;
}

export default function App({ Component, pageProps }: AppProps) {
  const app = getStackApp();
  return (
    <Suspense fallback={<LoadingFallback />}>
      <StackProvider app={app}>
        <Suspense fallback={<LoadingFallback />}>
          <Component {...pageProps} />
        </Suspense>
      </StackProvider>
    </Suspense>
  );
}

import type { AppProps } from 'next/app';
import { StackProvider } from '@stackframe/stack';
import { stackServerApp } from '../stack.config';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <StackProvider app={stackServerApp}>
      <Component {...pageProps} />
    </StackProvider>
  );
}

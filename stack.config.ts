import { StackClientApp, StackServerApp } from '@stackframe/stack';

const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID ?? '';
const publishableClientKey = process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY ?? '';
const secretServerKey = process.env.STACK_SECRET_SERVER_KEY ?? '';

export const stackServerApp = new StackServerApp({
  projectId,
  publishableClientKey,
  secretServerKey,
  tokenStore: 'cookie',
});

export const stackClientApp = new StackClientApp({
  projectId,
  publishableClientKey,
  tokenStore: 'cookie',
});

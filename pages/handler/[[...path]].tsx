import React, { Suspense } from 'react';
import { StackHandler, SignIn, SignUp } from '@stackframe/stack';
import { useRouter } from 'next/router';
import { useMemo, useState, useEffect } from 'react';

/** Catches NEXT_REDIRECT thrown by Stack Auth and performs client-side redirect. */
class RedirectErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { redirectUrl: string | null }
> {
  state = { redirectUrl: null as string | null };

  static getDerivedStateFromError(error: unknown) {
    const digest = (error as { digest?: string })?.digest;
    if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) {
      const parts = digest.split(';');
      const url = parts[2]; // NEXT_REDIRECT;replace;URL;status;
      if (url) return { redirectUrl: url };
    }
    return null;
  }

  componentDidCatch(error: unknown) {
    const digest = (error as { digest?: string })?.digest;
    if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) {
      const parts = digest.split(';');
      const url = parts[2];
      if (url && typeof window !== 'undefined') {
        window.location.replace(url);
        return;
      }
    }
    throw error;
  }

  render() {
    if (this.state.redirectUrl) {
      return (
        <div className="loading-screen">
          <span className="loading-dots">Redirecting</span>
        </div>
      );
    }
    return this.props.children;
  }
}

export async function getServerSideProps() {
  return { props: {} };
}

export default function HandlerPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const path = (router.query.path as string[] | undefined) ?? [];
  const searchParams = useMemo(() => {
    if (typeof window === 'undefined') return {};
    return Object.fromEntries(new URLSearchParams(window.location.search));
  }, [router.asPath]);

  if (!mounted) {
    return (
      <div className="loading-screen">
        <span className="loading-dots">Loading</span>
      </div>
    );
  }

  return (
    <RedirectErrorBoundary>
      <div className="auth-layout">
        <div className="auth-brand">
          <span className="auth-product">Create</span>
          <h1>Welcome back</h1>
          <p>Sign in to continue to your dashboard</p>
        </div>
        <div className="auth-card auth-card--handler">
          <Suspense
            fallback={
              <div className="loading-screen loading-screen--auth">
                <span className="loading-dots">Loading</span>
              </div>
            }
          >
            {path?.[0] === 'signin' ? (
              <SignIn
                fullPage={false}
                automaticRedirect={true}
                firstTab="password"
              />
            ) : path?.[0] === 'signup' ? (
              <SignUp
                fullPage={false}
                automaticRedirect={true}
                firstTab="password"
              />
            ) : (
              <StackHandler
                fullPage={false}
                params={{ path }}
                searchParams={searchParams}
              />
            )}
          </Suspense>
        </div>
      </div>
    </RedirectErrorBoundary>
  );
}

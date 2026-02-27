import { StackHandler } from '@stackframe/stack';
import { useRouter } from 'next/router';
import { useMemo } from 'react';

export async function getServerSideProps() {
  return { props: {} };
}

export default function HandlerPage() {
  const router = useRouter();
  const path = (router.query.path as string[] | undefined) ?? [];
  const searchParams = useMemo(() => {
    if (typeof window === 'undefined') return {};
    return Object.fromEntries(new URLSearchParams(window.location.search));
  }, [router.asPath]);

  return (
    <StackHandler
      fullPage={true}
      params={{ path }}
      searchParams={searchParams}
    />
  );
}
